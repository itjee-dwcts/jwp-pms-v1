"""
파일 서비스

파일 업로드 및 관리 작업을 위한 비즈니스 로직입니다.
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
    """파일 관리 작업을 위한 파일 서비스"""

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
        """데이터베이스에 파일 기록 생성"""
        if project_id:
            # 사용자가 프로젝트에 접근 권한이 있는지 확인
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
                raise ValueError("사용자가 이 프로젝트에 접근 권한이 없습니다")

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
            # 작업 첨부파일에 대한 유사한 로직
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
            raise ValueError("project_id 또는 task_id 중 하나는 제공되어야 합니다")

        self.db.add(file_record)
        await self.db.commit()
        await self.db.refresh(file_record)
        return file_record

    async def get_file_with_access_check(
        self, file_id: int, user_id: int
    ) -> Optional[ProjectAttachment]:
        """사용자가 접근 권한이 있는 경우 파일 가져오기"""
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
        """사용자가 권한이 있는 경우 파일 삭제"""
        file_record = await self.get_file_with_access_check(file_id, user_id)
        if not file_record:
            return False

        file_path = getattr(file_record, "file_path", None)
        if not file_path:
            raise ValueError("이 기록에 대한 파일 경로가 설정되지 않았습니다")

        # 파일 시스템에서 파일 삭제
        file_path = Path(file_path)
        if file_path.exists():
            file_path.unlink()

        # 데이터베이스 기록 삭제
        await self.db.delete(file_record)
        await self.db.commit()
        return True


async def get_file_service(db: Optional[AsyncSession] = None) -> FileService:
    """파일 서비스 인스턴스 가져오기"""
    if db is None:
        async for session in get_async_session():
            return FileService(session)
    return FileService(cast(AsyncSession, db))
