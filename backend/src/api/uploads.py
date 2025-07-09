"""
파일 업로드 API Routes

파일 업로드 및 관리 엔드포인트
"""

import logging
import uuid
from pathlib import Path
from typing import Optional

from core.config import settings
from core.database import get_async_session
from core.dependencies import get_current_active_user
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from models.user import User
from services.file import FileService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    파일 업로드

    Args:
        file: 업로드할 파일
        project_id: 프로젝트 ID (선택사항)
        task_id: 작업 ID (선택사항)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        FileUploadResponse: 업로드된 파일 정보

    Raises:
        HTTPException: 파일 크기 초과, 권한 없음, 업로드 실패 등
    """
    try:
        # 1. 입력 검증
        if not project_id and not task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="프로젝트 ID 또는 작업 ID 중 하나는 반드시 제공되어야 합니다",
            )

        if project_id and task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="프로젝트 ID와 작업 ID를 동시에 지정할 수 없습니다",
            )

        # 2. 파일 검증
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="파일명이 필요합니다",
            )

        # 파일 크기 검증
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    f"파일 크기({file.size} bytes)가 최대 허용 크기 "
                    f"{settings.MAX_FILE_SIZE} bytes를 초과합니다"
                ),
            )

        # 3. 파일 내용 읽기 및 검증
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="파일이 비어있습니다"
            )

        # 파일 포인터를 처음으로 되돌리기 (필요한 경우 재사용 가능)
        await file.seek(0)

        # 4. 고유 파일명 생성
        file_extension = Path(file.filename or "").suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # 5. 업로드 디렉토리 생성
        upload_dir = Path(settings.UPLOAD_PATH)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 6. 파일 저장
        file_path = upload_dir / unique_filename

        try:
            with open(file_path, "wb") as buffer:
                buffer.write(content)
        except OSError as e:
            logger.error("파일을 디스크에 저장하는데 실패했습니다: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="파일을 디스크에 저장하는데 실패했습니다",
            ) from e

        # 7. 데이터베이스에 파일 메타데이터 저장
        try:
            file_service = FileService(db)
            file_record = await file_service.create_file_record(
                file_name=file.filename,
                file_path=str(file_path),
                file_size=len(content),
                mime_type=file.content_type,
                uploaded_by=int(str(current_user.id)),
                project_id=project_id,
                task_id=task_id,
            )
        except ValueError as e:
            # 데이터베이스 저장 실패 시 파일 삭제
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
            ) from e
        except Exception as e:
            # 데이터베이스 저장 실패 시 파일 삭제
            if file_path.exists():
                file_path.unlink()
            logger.error("파일 업로드 중 데이터베이스 오류: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="파일 메타데이터 저장에 실패했습니다",
            ) from e

        # 8. 로깅
        logger.info(
            "파일이 성공적으로 업로드됨 - 사용자: %s, 파일: %s, 크기: %d bytes",
            current_user.name,
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
            "created_at": file_record.created_at.isoformat(),
            "download_url": f"/api/v1/uploads/{file_record.id}",
        }

    except HTTPException:
        # FastAPI HTTPException은 그대로 재발생
        raise
    except Exception as e:
        logger.error("파일 업로드 오류: %s", e)

        # 파일이 저장되었다면 삭제
        if "file_path" in locals() and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 업로드에 실패했습니다",
        ) from e


@router.get("/{file_id}")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    파일 다운로드
    """
    try:
        file_service = FileService(db)
        file_record = await file_service.get_file_with_access_check(
            file_id, int(str(current_user.id))
        )

        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="파일을 찾을 수 없습니다"
            )

        file_path = Path(str(file_record.file_path))
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="디스크에서 파일을 찾을 수 없습니다",
            )

        return FileResponse(
            path=str(file_path),
            filename=str(file_record.file_name),
            media_type=str(file_record.mime_type),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("파일 %s 다운로드 오류: %s", file_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 다운로드에 실패했습니다",
        ) from e


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    파일 삭제
    """
    try:
        file_service = FileService(db)
        success = await file_service.delete_file(file_id, int(str(current_user.id)))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="파일을 찾을 수 없습니다"
            )

        logger.info(
            "파일이 삭제됨 - 사용자: %s, 파일 ID: %s", current_user.name, file_id
        )

        return {"message": "파일이 성공적으로 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("파일 %s 삭제 오류: %s", file_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 삭제에 실패했습니다",
        ) from e
