"""
파일 업로드 서비스

파일 업로드, 다운로드, 삭제 등의 비즈니스 로직을 제공합니다.
"""

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from services.file import FileService

logger = logging.getLogger(__name__)


class UploadService:
    """
    파일 업로드 관련 비즈니스 로직을 처리하는 서비스 클래스
    """

    def __init__(self, db: AsyncSession):
        """
        업로드 서비스 초기화

        Args:
            db: 데이터베이스 세션
        """
        self.db = db
        self.file_service = FileService(db)
        self.upload_dir = Path(settings.UPLOAD_PATH)

        # 업로드 디렉토리 생성
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def upload_file(
        self,
        file: UploadFile,
        user_id: int,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        파일 업로드 처리

        Args:
            file: 업로드할 파일
            user_id: 업로드하는 사용자 ID
            project_id: 프로젝트 ID (선택사항)
            task_id: 작업 ID (선택사항)

        Returns:
            Dict[str, Any]: 업로드된 파일 정보

        Raises:
            ValueError: 입력 검증 실패
            RuntimeError: 파일 저장 실패
        """
        try:
            # 1. 입력 검증
            self._validate_upload_params(file, project_id, task_id)

            # 2. 파일 내용 읽기 및 검증
            content = await self._read_and_validate_file(file)

            # 3. 고유 파일명 생성
            if file.filename is None:
                raise ValueError("파일명이 필요합니다")
            unique_filename = self._generate_unique_filename(file.filename)

            # 4. 파일 저장
            file_path = await self._save_file_to_disk(unique_filename, content)

            # 5. 데이터베이스에 메타데이터 저장
            try:
                file_record = await self.file_service.create_file_record(
                    file_name=file.filename,
                    file_path=str(file_path),
                    file_size=len(content),
                    mime_type=file.content_type,
                    uploaded_by=user_id,
                    project_id=project_id,
                    task_id=task_id,
                )
            except Exception as e:
                # 데이터베이스 저장 실패 시 파일 삭제
                if file_path.exists():
                    file_path.unlink()
                raise e

            logger.info(
                "파일 업로드 성공 - 사용자: %d, 파일: %s, 크기: %d bytes",
                user_id,
                file.filename,
                len(content),
            )

            return {
                "id": file_record.id,
                "file_name": file_record.file_name,
                "file_path": file_record.file_path,
                "file_size": file_record.file_size,
                "mime_type": file_record.mime_type,
                "uploaded_by": file_record.uploaded_by,
                "project_id": file_record.project_id,
                "task_id": file_record.task_id,
                "created_at": file_record.created_at.isoformat(),
                "download_url": f"/api/v1/uploads/{file_record.id}",
            }

        except Exception as e:
            logger.error("파일 업로드 오류: %s", e)
            raise

    async def get_file_info(
        self, file_id: int, user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        파일 정보 조회

        Args:
            file_id: 파일 ID
            user_id: 요청하는 사용자 ID

        Returns:
            Optional[Dict[str, Any]]: 파일 정보 또는 None
        """
        try:
            file_record = await self.file_service.get_file_with_access_check(
                file_id, user_id
            )

            if not file_record:
                return None

            # 파일 존재 여부 확인
            file_path = Path(str(file_record.file_path))
            file_exists = file_path.exists()

            return {
                "id": file_record.id,
                "file_name": file_record.file_name,
                "file_path": file_record.file_path,
                "file_size": file_record.file_size,
                "mime_type": file_record.mime_type,
                "uploaded_by": file_record.uploaded_by,
                "project_id": file_record.project_id,
                "task_id": file_record.task_id,
                "created_at": file_record.created_at.isoformat(),
                "file_exists": file_exists,
                "download_url": f"/api/v1/uploads/{file_record.id}",
            }

        except Exception as e:
            logger.error("파일 정보 조회 오류: %s", e)
            raise

    async def delete_file(self, file_id: int, user_id: int) -> bool:
        """
        파일 삭제

        Args:
            file_id: 삭제할 파일 ID
            user_id: 요청하는 사용자 ID

        Returns:
            bool: 삭제 성공 여부
        """
        try:
            success = await self.file_service.delete_file(file_id, user_id)

            if success:
                logger.info(
                    "파일 삭제 성공 - 사용자: %d, 파일 ID: %d", user_id, file_id
                )

            return success

        except Exception as e:
            logger.error("파일 삭제 오류: %s", e)
            raise

    async def get_user_files(
        self,
        user_id: int,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        사용자의 파일 목록 조회

        Args:
            user_id: 사용자 ID
            project_id: 프로젝트 ID (필터링용)
            task_id: 작업 ID (필터링용)
            limit: 조회할 파일 수
            offset: 조회 시작 위치

        Returns:
            List[Dict[str, Any]]: 파일 목록
        """
        try:
            files = await self.file_service.get_user_files(
                user_id=user_id,
                project_id=project_id,
                task_id=task_id,
                limit=limit,
                offset=offset,
            )

            return [
                {
                    "id": file_record.id,
                    "file_name": file_record.file_name,
                    "file_size": file_record.file_size,
                    "mime_type": file_record.mime_type,
                    "project_id": file_record.project_id,
                    "task_id": file_record.task_id,
                    "created_at": file_record.created_at.isoformat(),
                    "download_url": f"/api/v1/uploads/{file_record.id}",
                }
                for file_record in files
            ]

        except Exception as e:
            logger.error("사용자 파일 목록 조회 오류: %s", e)
            raise

    async def get_upload_stats(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        업로드 통계 조회

        Args:
            user_id: 특정 사용자 ID (None이면 전체 통계)

        Returns:
            Dict[str, Any]: 업로드 통계
        """
        try:
            stats = await self.file_service.get_upload_stats(user_id)

            # 디스크 사용량 계산
            total_disk_usage = self._calculate_disk_usage()

            return {
                **stats,
                "disk_usage": total_disk_usage,
                "upload_directory": str(self.upload_dir),
                "max_file_size": settings.MAX_FILE_SIZE,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error("업로드 통계 조회 오류: %s", e)
            raise

    def _validate_upload_params(
        self, file: UploadFile, project_id: Optional[int], task_id: Optional[int]
    ) -> None:
        """
        업로드 파라미터 검증

        Args:
            file: 업로드할 파일
            project_id: 프로젝트 ID
            task_id: 작업 ID

        Raises:
            ValueError: 검증 실패
        """
        if not project_id and not task_id:
            raise ValueError(
                "프로젝트 ID 또는 작업 ID 중 하나는 반드시 제공되어야 합니다"
            )

        if project_id and task_id:
            raise ValueError("프로젝트 ID와 작업 ID를 동시에 지정할 수 없습니다")

        if not file.filename:
            raise ValueError("파일명이 필요합니다")

        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise ValueError(
                f"파일 크기({file.size} bytes)가 최대 허용 크기 "
                f"{settings.MAX_FILE_SIZE} bytes를 초과합니다"
            )

    async def _read_and_validate_file(self, file: UploadFile) -> bytes:
        """
        파일 내용 읽기 및 검증

        Args:
            file: 업로드할 파일

        Returns:
            bytes: 파일 내용

        Raises:
            ValueError: 파일이 비어있음
        """
        content = await file.read()
        if not content:
            raise ValueError("파일이 비어있습니다")

        # 파일 포인터를 처음으로 되돌리기
        await file.seek(0)

        return content

    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        고유한 파일명 생성

        Args:
            original_filename: 원본 파일명

        Returns:
            str: 고유한 파일명
        """
        file_extension = Path(original_filename).suffix
        return f"{uuid.uuid4()}{file_extension}"

    async def _save_file_to_disk(self, filename: str, content: bytes) -> Path:
        """
        파일을 디스크에 저장

        Args:
            filename: 저장할 파일명
            content: 파일 내용

        Returns:
            Path: 저장된 파일 경로

        Raises:
            RuntimeError: 파일 저장 실패
        """
        file_path = self.upload_dir / filename

        try:
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            return file_path
        except OSError as e:
            logger.error("파일을 디스크에 저장하는데 실패했습니다: %s", e)
            raise RuntimeError("파일을 디스크에 저장하는데 실패했습니다") from e

    def _calculate_disk_usage(self) -> Dict[str, Any]:
        """
        업로드 디렉토리의 디스크 사용량 계산

        Returns:
            Dict[str, Any]: 디스크 사용량 정보
        """
        try:
            total_size = 0
            file_count = 0

            for file_path in self.upload_dir.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
                    file_count += 1

            return {
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "file_count": file_count,
                "directory": str(self.upload_dir),
            }
        except Exception as e:
            logger.error("디스크 사용량 계산 오류: %s", e)
            return {"error": "디스크 사용량 계산 실패"}

    async def cleanup_orphaned_files(self) -> Dict[str, Any]:
        """
        고아 파일 정리 (데이터베이스에 기록이 없는 파일들)

        Returns:
            Dict[str, Any]: 정리 결과
        """
        try:
            cleaned_count = 0
            total_size_cleaned = 0

            # 데이터베이스의 모든 파일 경로 조회
            db_file_paths = await self.file_service.get_all_file_paths()
            db_paths_set = set(db_file_paths)

            # 디스크의 모든 파일 확인
            for file_path in self.upload_dir.rglob("*"):
                if file_path.is_file() and str(file_path) not in db_paths_set:
                    file_size = file_path.stat().st_size
                    try:
                        file_path.unlink()
                        cleaned_count += 1
                        total_size_cleaned += file_size
                        logger.info("고아 파일 삭제: %s", file_path)
                    except Exception as e:
                        logger.error("고아 파일 삭제 실패 %s: %s", file_path, e)

            return {
                "cleaned_files": cleaned_count,
                "total_size_cleaned": total_size_cleaned,
                "timestamp": datetime.now(timezone.utc),
            }

        except Exception as e:
            logger.error("고아 파일 정리 오류: %s", e)
            raise


# 의존성 주입용 함수
def get_upload_service(db: AsyncSession) -> UploadService:
    """
    UploadService 인스턴스를 반환하는 의존성 주입 함수

    Args:
        db: 데이터베이스 세션

    Returns:
        UploadService: 업로드 서비스 인스턴스
    """
    return UploadService(db)
