"""
파일 서비스

파일 업로드 및 관리 작업을 위한 비즈니스 로직입니다.
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, cast

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from models.project import ProjectAttachment, ProjectMember
from models.task import Task, TaskAttachment

logger = logging.getLogger(__name__)


class FileService:
    """파일 관리 작업을 위한 파일 서비스"""

    def __init__(self, db: AsyncSession):
        """
        파일 서비스 초기화

        Args:
            db: 데이터베이스 세션
        """
        self.db = db
        logger.debug("파일 서비스가 초기화되었습니다")

    async def create_file_record(
        self,
        file_name: str,
        file_path: str,
        file_size: int,
        mime_type: Optional[str],
        uploaded_by: int,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
    ) -> Union[ProjectAttachment, TaskAttachment]:
        """
        데이터베이스에 파일 기록 생성

        Args:
            file_name: 파일명
            file_path: 파일 경로
            file_size: 파일 크기
            mime_type: MIME 타입
            uploaded_by: 업로드한 사용자 ID
            project_id: 프로젝트 ID (선택사항)
            task_id: 작업 ID (선택사항)

        Returns:
            Union[ProjectAttachment, TaskAttachment]: 생성된 파일 기록

        Raises:
            ValueError: 권한 부족 또는 잘못된 매개변수
        """
        logger.info(
            "파일 기록 생성 시작 - 사용자: %d, 파일명: %s, 크기: %d bytes",
            uploaded_by,
            file_name,
            file_size,
        )

        try:
            if project_id:
                # 사용자가 프로젝트에 접근 권한이 있는지 확인
                logger.debug(
                    "프로젝트 %d에 대한 사용자 %d의 권한을 확인합니다",
                    project_id,
                    uploaded_by,
                )

                member_query = select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == uploaded_by,
                        ProjectMember.is_active.is_(True),
                    )
                )
                member_result = await self.db.execute(member_query)
                member = member_result.scalar_one_or_none()

                if not member:
                    error_msg = f"사용자 {uploaded_by}는 프로젝트 {project_id}에 접근 권한이 없습니다"
                    logger.warning("프로젝트 접근 권한 없음 - %s", error_msg)
                    raise ValueError(error_msg)

                file_record = ProjectAttachment(
                    project_id=project_id,
                    file_name=file_name,
                    file_path=file_path,
                    file_size=file_size,
                    mime_type=mime_type,
                    uploaded_by=uploaded_by,
                    created_by=uploaded_by,
                    created_at=datetime.now(timezone.utc),
                )
                logger.debug("프로젝트 첨부파일 레코드를 생성했습니다")

            elif task_id:
                # 작업 첨부파일 생성
                logger.debug("작업 %d에 대한 첨부파일을 생성합니다", task_id)

                file_record = TaskAttachment(
                    task_id=task_id,
                    file_name=file_name,
                    file_path=file_path,
                    file_size=file_size,
                    mime_type=mime_type,
                    uploaded_by=uploaded_by,
                    created_by=uploaded_by,
                    created_at=datetime.now(timezone.utc),
                )
                logger.debug("작업 첨부파일 레코드를 생성했습니다")

            else:
                error_msg = "project_id 또는 task_id 중 하나는 반드시 제공되어야 합니다"
                logger.error("파일 기록 생성 실패 - %s", error_msg)
                raise ValueError(error_msg)

            # 데이터베이스에 저장
            self.db.add(file_record)
            await self.db.commit()
            await self.db.refresh(file_record)

            logger.info(
                "파일 기록이 성공적으로 생성되었습니다 - ID: %d, 파일명: %s",
                file_record.id,
                file_name,
            )
            return file_record

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "파일 기록 생성 중 오류 발생 - 파일명: %s, 오류: %s", file_name, str(e)
            )
            raise RuntimeError(f"파일 기록 생성에 실패했습니다: {str(e)}") from e

    async def get_file_with_access_check(
        self, file_id: int, user_id: int
    ) -> Optional[Union[ProjectAttachment, TaskAttachment]]:
        """
        사용자가 접근 권한이 있는 경우 파일 정보 가져오기

        Args:
            file_id: 파일 ID
            user_id: 사용자 ID

        Returns:
            Optional[Union[ProjectAttachment, TaskAttachment]]: 파일 기록 또는 None
        """
        logger.debug(
            "파일 접근 권한 확인 - 파일 ID: %d, 사용자 ID: %d", file_id, user_id
        )

        try:
            # 프로젝트 첨부파일 확인
            project_query = (
                select(ProjectAttachment)
                .join(
                    ProjectMember,
                    ProjectMember.project_id == ProjectAttachment.project_id,
                )
                .where(
                    and_(
                        ProjectAttachment.id == file_id,
                        ProjectMember.user_id == user_id,
                        ProjectMember.is_active.is_(True),
                        ProjectAttachment.is_active.is_(True),
                    )
                )
            )

            project_result = await self.db.execute(project_query)
            project_file = project_result.scalar_one_or_none()

            if project_file:
                logger.debug("프로젝트 첨부파일에 대한 접근 권한이 확인되었습니다")
                return project_file

            # 작업 첨부파일 확인
            task_query = (
                select(TaskAttachment)
                .join(Task, Task.id == TaskAttachment.task_id)
                .join(ProjectMember, ProjectMember.project_id == Task.project_id)
                .where(
                    and_(
                        TaskAttachment.id == file_id,
                        ProjectMember.user_id == user_id,
                        ProjectMember.is_active.is_(True),
                        TaskAttachment.is_active.is_(True),
                    )
                )
            )

            task_result = await self.db.execute(task_query)
            task_file = task_result.scalar_one_or_none()

            if task_file:
                logger.debug("작업 첨부파일에 대한 접근 권한이 확인되었습니다")
                return task_file

            logger.warning(
                "파일에 대한 접근 권한이 없습니다 - 파일 ID: %d, 사용자 ID: %d",
                file_id,
                user_id,
            )
            return None

        except Exception as e:
            logger.error(
                "파일 접근 권한 확인 중 오류 발생 - 파일 ID: %d, 사용자 ID: %d, 오류: %s",
                file_id,
                user_id,
                str(e),
            )
            raise

    async def delete_file(self, file_id: int, user_id: int) -> bool:
        """
        사용자가 권한이 있는 경우 파일 삭제

        Args:
            file_id: 삭제할 파일 ID
            user_id: 요청하는 사용자 ID

        Returns:
            bool: 삭제 성공 여부
        """
        logger.info("파일 삭제 요청 - 파일 ID: %d, 사용자 ID: %d", file_id, user_id)

        try:
            # 파일 접근 권한 확인
            file_record = await self.get_file_with_access_check(file_id, user_id)
            if not file_record:
                logger.warning(
                    "삭제 권한이 없는 파일입니다 - 파일 ID: %d, 사용자 ID: %d",
                    file_id,
                    user_id,
                )
                return False

            # 파일 경로 확인
            file_path_str = getattr(file_record, "file_path", None)
            if not file_path_str:
                error_msg = f"파일 ID {file_id}에 대한 파일 경로가 설정되지 않았습니다"
                logger.error("파일 경로 누락 - %s", error_msg)
                raise ValueError(error_msg)

            # 파일 시스템에서 파일 삭제
            file_path = Path(file_path_str)
            if file_path.exists():
                try:
                    file_path.unlink()
                    logger.debug("디스크에서 파일을 삭제했습니다: %s", file_path_str)
                except OSError as e:
                    logger.warning(
                        "디스크에서 파일 삭제 실패: %s, 오류: %s", file_path_str, str(e)
                    )
            else:
                logger.warning(
                    "삭제할 파일이 디스크에 존재하지 않습니다: %s", file_path_str
                )

            # 데이터베이스에서 논리적 삭제 또는 물리적 삭제
            if hasattr(file_record, "is_active"):
                # 논리적 삭제
                file_record.is_active = False
                file_record.is_deleted = True
                file_record.deleted_at = datetime.now(timezone.utc)
                logger.debug("파일 기록을 논리적으로 삭제했습니다")
            else:
                # 물리적 삭제
                await self.db.delete(file_record)
                logger.debug("파일 기록을 물리적으로 삭제했습니다")

            await self.db.commit()

            logger.info(
                "파일이 성공적으로 삭제되었습니다 - 파일 ID: %d, 사용자 ID: %d",
                file_id,
                user_id,
            )
            return True

        except ValueError:
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "파일 삭제 중 오류 발생 - 파일 ID: %d, 사용자 ID: %d, 오류: %s",
                file_id,
                user_id,
                str(e),
            )
            raise RuntimeError(f"파일 삭제에 실패했습니다: {str(e)}") from e

    async def get_user_files(
        self,
        user_id: int,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Union[ProjectAttachment, TaskAttachment]]:
        """
        사용자의 파일 목록 조회

        Args:
            user_id: 사용자 ID
            project_id: 프로젝트 ID (필터링용)
            task_id: 작업 ID (필터링용)
            limit: 조회할 파일 수
            offset: 조회 시작 위치

        Returns:
            List[Union[ProjectAttachment, TaskAttachment]]: 파일 목록
        """
        logger.debug(
            "사용자 파일 목록 조회 - 사용자 ID: %d, 프로젝트 ID: %s, 작업 ID: %s, limit: %d, offset: %d",
            user_id,
            project_id,
            task_id,
            limit,
            offset,
        )

        files = []

        try:
            if project_id:
                # 특정 프로젝트의 파일만 조회
                logger.debug("특정 프로젝트 %d의 파일을 조회합니다", project_id)

                project_query = (
                    select(ProjectAttachment)
                    .join(
                        ProjectMember,
                        ProjectMember.project_id == ProjectAttachment.project_id,
                    )
                    .where(
                        and_(
                            ProjectMember.user_id == user_id,
                            ProjectMember.is_active.is_(True),
                            ProjectAttachment.project_id == project_id,
                            ProjectAttachment.is_active.is_(True),
                        )
                    )
                    .order_by(ProjectAttachment.created_at.desc())
                    .limit(limit)
                    .offset(offset)
                )
                result = await self.db.execute(project_query)
                files.extend(result.scalars().all())

                logger.debug("프로젝트 파일 %d개를 조회했습니다", len(files))

            elif task_id:
                # 특정 작업의 파일만 조회
                logger.debug("특정 작업 %d의 파일을 조회합니다", task_id)

                task_query = (
                    select(TaskAttachment)
                    .join(Task, Task.id == TaskAttachment.task_id)
                    .join(ProjectMember, ProjectMember.project_id == Task.project_id)
                    .where(
                        and_(
                            ProjectMember.user_id == user_id,
                            ProjectMember.is_active.is_(True),
                            TaskAttachment.task_id == task_id,
                            TaskAttachment.is_active.is_(True),
                        )
                    )
                    .order_by(TaskAttachment.created_at.desc())
                    .limit(limit)
                    .offset(offset)
                )
                result = await self.db.execute(task_query)
                files.extend(result.scalars().all())

                logger.debug("작업 파일 %d개를 조회했습니다", len(files))

            else:
                # 사용자가 접근 가능한 모든 파일 조회
                logger.debug("사용자가 접근 가능한 모든 파일을 조회합니다")

                # 프로젝트 첨부파일
                project_query = (
                    select(ProjectAttachment)
                    .join(
                        ProjectMember,
                        ProjectMember.project_id == ProjectAttachment.project_id,
                    )
                    .where(
                        and_(
                            ProjectMember.user_id == user_id,
                            ProjectMember.is_active.is_(True),
                            ProjectAttachment.is_active.is_(True),
                        )
                    )
                    .order_by(ProjectAttachment.created_at.desc())
                )

                # 작업 첨부파일
                task_query = (
                    select(TaskAttachment)
                    .join(Task, Task.id == TaskAttachment.task_id)
                    .join(ProjectMember, ProjectMember.project_id == Task.project_id)
                    .where(
                        and_(
                            ProjectMember.user_id == user_id,
                            ProjectMember.is_active.is_(True),
                            TaskAttachment.is_active.is_(True),
                        )
                    )
                    .order_by(TaskAttachment.created_at.desc())
                )

                # 두 쿼리 실행
                project_result = await self.db.execute(project_query)
                task_result = await self.db.execute(task_query)

                # 결과 합치기
                all_files = list(project_result.scalars().all()) + list(
                    task_result.scalars().all()
                )

                # 생성일 기준으로 정렬
                all_files.sort(
                    key=lambda x: getattr(x, "created_at", datetime.min), reverse=True
                )

                # 페이지네이션 적용
                files = all_files[offset : offset + limit]

            logger.debug(
                "전체 파일 중 %d개를 조회했습니다 (총 %d개)",
                len(files),
                len(all_files),
            )

            logger.info(
                "사용자 %d의 파일 목록 조회 완료 - %d개 파일", user_id, len(files)
            )
            return files

        except Exception as e:
            logger.error(
                "사용자 파일 목록 조회 중 오류 발생 - 사용자 ID: %d, 오류: %s",
                user_id,
                str(e),
            )
            raise

    async def get_upload_stats(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        업로드 통계 조회

        Args:
            user_id: 특정 사용자 ID (None이면 전체 통계)

        Returns:
            Dict[str, Any]: 업로드 통계
        """
        if user_id:
            logger.debug("사용자 %d의 업로드 통계를 조회합니다", user_id)
        else:
            logger.debug("전체 업로드 통계를 조회합니다")

        try:
            stats = {
                "total_files": 0,
                "total_size": 0,
                "project_files": 0,
                "task_files": 0,
                "file_types": {},
            }

            # 프로젝트 첨부파일 통계
            project_query = select(ProjectAttachment).where(
                ProjectAttachment.is_active.is_(True)
            )
            if user_id:
                project_query = project_query.where(
                    ProjectAttachment.uploaded_by == user_id
                )

            project_result = await self.db.execute(project_query)
            project_files = project_result.scalars().all()

            # 작업 첨부파일 통계
            task_query = select(TaskAttachment).where(
                TaskAttachment.is_active.is_(True)
            )
            if user_id:
                task_query = task_query.where(TaskAttachment.uploaded_by == user_id)

            task_result = await self.db.execute(task_query)
            task_files = task_result.scalars().all()

            # 통계 계산
            all_files = list(project_files) + list(task_files)

            stats["total_files"] = len(all_files)
            stats["project_files"] = len(project_files)
            stats["task_files"] = len(task_files)
            stats["total_size"] = sum(
                f.file_size for f in all_files if f.file_size is not None
            )

            # 파일 타입별 통계
            for file_obj in all_files:
                if file_obj.mime_type is not None:
                    file_type = (
                        file_obj.mime_type.split("/")[0]
                        if "/" in file_obj.mime_type
                        else file_obj.mime_type
                    )
                    stats["file_types"][file_type] = (
                        stats["file_types"].get(file_type, 0) + 1
                    )

            logger.info(
                "업로드 통계 조회 완료 - 사용자: %s, 총 파일: %d개, 총 크기: %d bytes",
                user_id if user_id else "전체",
                stats["total_files"],
                stats["total_size"],
            )
            return stats

        except Exception as e:
            logger.error(
                "업로드 통계 조회 중 오류 발생 - 사용자 ID: %s, 오류: %s",
                user_id,
                str(e),
            )
            raise

    async def get_all_file_paths(self) -> List[str]:
        """
        데이터베이스에 저장된 모든 파일 경로 조회

        Returns:
            List[str]: 파일 경로 목록
        """
        logger.debug("데이터베이스의 모든 파일 경로를 조회합니다")

        try:
            file_paths = []

            # 프로젝트 첨부파일 경로
            project_query = select(ProjectAttachment.file_path).where(
                ProjectAttachment.is_active.is_(True)
            )
            project_result = await self.db.execute(project_query)
            project_paths = list(project_result.scalars().all())
            file_paths.extend(project_paths)

            # 작업 첨부파일 경로
            task_query = select(TaskAttachment.file_path).where(
                TaskAttachment.is_active.is_(True)
            )
            task_result = await self.db.execute(task_query)
            task_paths = list(task_result.scalars().all())
            file_paths.extend(task_paths)

            logger.info(
                "파일 경로 목록 조회 완료 - 프로젝트 파일: %d개, 작업 파일: %d개, 총 %d개",
                len(project_paths),
                len(task_paths),
                len(file_paths),
            )
            return file_paths

        except Exception as e:
            logger.error("파일 경로 목록 조회 중 오류 발생 - 오류: %s", str(e))
            raise


async def get_file_service(db: Optional[AsyncSession] = None) -> FileService:
    """
    파일 서비스 인스턴스 가져오기

    Args:
        db: 데이터베이스 세션 (선택사항)

    Returns:
        FileService: 파일 서비스 인스턴스
    """
    if db is None:
        async for session in get_async_session():
            return FileService(session)
    return FileService(cast(AsyncSession, db))
