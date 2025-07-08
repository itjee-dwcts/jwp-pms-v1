"""
File Upload API Routes

File upload and management endpoints.
"""

import logging
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from services.file import FileService

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
    Upload a file

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
                detail="Either project_id or task_id must be provided",
            )

        if project_id and task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot specify both project_id and task_id",
            )

        # 2. 파일 검증
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required",
            )

        # Validate file size
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    f"File size ({file.size} bytes) exceeds maximum allowed "
                    f"size of {settings.MAX_FILE_SIZE} bytes"
                ),
            )

        # 3. 파일 내용 읽기 및 검증
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty"
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
            logger.error("Failed to save file to disk: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file to disk",
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
            logger.error("Database error during file upload: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file metadata",
            ) from e

        # 8. 로깅
        logger.info(
            "File uploaded successfully - User: %s, File: %s, Size: %d bytes",
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
        logger.error("Error uploading file: %s", e)

        # 파일이 저장되었다면 삭제
        if "file_path" in locals() and file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file",
        ) from e


@router.get("/{file_id}")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Download a file
    """
    try:
        file_service = FileService(db)
        file_record = await file_service.get_file_with_access_check(
            file_id, int(str(current_user.id))
        )

        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        file_path = Path(str(file_record.file_path))
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on disk",
            )

        return FileResponse(
            path=str(file_path),
            filename=str(file_record.filename),
            media_type=str(file_record.mime_type),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error downloading file %s: %s", file_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download file",
        ) from e


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Delete a file
    """
    try:
        file_service = FileService(db)
        success = await file_service.delete_file(file_id, int(str(current_user.id)))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        logger.info("File deleted by %s: %s", current_user.name, file_id)

        return {"message": "File deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting file %s: %s", file_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file",
        ) from e
