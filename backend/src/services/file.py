"""
File Service

Business logic for file upload and management operations.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union, cast

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from models.project import ProjectAttachment, ProjectMember
from models.task import TaskAttachment


class FileService:
    """File service for file management operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

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
        """Create file record in database"""
        if project_id:
            # Verify user has access to project
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
                raise ValueError("User does not have access to this project")

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

        elif task_id:
            # Similar logic for task attachments
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

        else:
            raise ValueError("Either project_id or task_id must be provided")

        self.db.add(file_record)
        await self.db.commit()
        await self.db.refresh(file_record)
        return file_record

    async def get_file_with_access_check(
        self, file_id: int, user_id: int
    ) -> Optional[ProjectAttachment]:
        """Get file if user has access"""
        query = (
            select(ProjectAttachment)
            .join(ProjectMember)
            .where(
                and_(
                    ProjectAttachment.id == file_id,
                    ProjectMember.project_id == ProjectAttachment.project_id,
                    ProjectMember.user_id == user_id,
                    ProjectMember.is_active.is_(True),
                )
            )
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_file(self, file_id: int, user_id: int) -> bool:
        """Delete file if user has permission"""
        file_record = await self.get_file_with_access_check(file_id, user_id)
        if not file_record:
            return False

        file_path = getattr(file_record, "file_path", None)
        if not file_path:
            raise ValueError("File path is not set for this record")

        # Delete file from filesystem
        file_path = Path(file_path)
        if file_path.exists():
            file_path.unlink()

        # Delete database record
        await self.db.delete(file_record)
        await self.db.commit()
        return True


async def get_file_service(db: Optional[AsyncSession] = None) -> FileService:
    """Get file service instance"""
    if db is None:
        async for session in get_async_session():
            return FileService(session)
    return FileService(cast(AsyncSession, db))
