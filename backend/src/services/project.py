"""
Project Service

Business logic for project management operations.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, cast

from core.constants import ProjectStatus
from core.database import get_async_session
from models.project import (
    Project,
    ProjectAttachment,
    ProjectComment,
    ProjectMember,
    ProjectMemberRole,
)
from models.user import User
from schemas.project import (
    ProjectCreateRequest,
    ProjectDashboardResponse,
    ProjectListResponse,
    ProjectMemberCreateRequest,
    ProjectResponse,
    ProjectSearchRequest,
    ProjectStatsResponse,
    ProjectUpdateRequest,
)
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import count
from utils.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)

logger = logging.getLogger(__name__)


class ProjectService:
    """Project management service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(
        self, project_data: ProjectCreateRequest, creator_id: int
    ) -> ProjectResponse:
        """Create a new project"""
        try:
            # Validate creator exists
            creator_result = await self.db.execute(
                select(User).where(User.id == creator_id)
            )
            creator = creator_result.scalar_one_or_none()
            if not creator:
                raise NotFoundError(f"Creator with ID {creator_id} not found")

            # Create project
            project = Project(
                name=project_data.name,
                description=project_data.description,
                status=project_data.status,
                priority=project_data.priority,
                start_date=project_data.start_date,
                end_date=project_data.end_date,
                budget=project_data.budget,
                repository_url=project_data.repository_url,
                documentation_url=project_data.documentation_url,
                tags=project_data.tags,
                is_public=project_data.is_public,
                creator_id=creator_id,
                created_by=creator_id,
                updated_by=creator_id,
            )

            self.db.add(project)
            await self.db.flush()

            # Add creator as project owner
            project_member = ProjectMember(
                project_id=project.id,
                user_id=creator_id,
                role=ProjectMemberRole.OWNER,
                added_by=creator_id,
            )

            self.db.add(project_member)
            await self.db.commit()

            # Fetch created project with relationships
            result = await self.db.execute(
                select(Project)
                .options(
                    selectinload(Project.creator),
                    selectinload(Project.members).selectinload(
                        ProjectMember.user
                    ),
                )
                .where(Project.id == project.id)
            )
            created_project = result.scalar_one()

            logger.info("Project created successfully: %s", project.name)
            return ProjectResponse.model_validate(created_project)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to create project: %s", e)
            raise

    async def get_project_by_id(
        self, project_id: int, user_id: Optional[int] = None
    ) -> ProjectResponse:
        """Get project by ID"""
        try:
            # Build query with relationships
            query = (
                select(Project)
                .options(
                    selectinload(Project.creator),
                    selectinload(Project.members).selectinload(
                        ProjectMember.user
                    ),
                    selectinload(Project.comments).selectinload(
                        ProjectComment.author
                    ),
                    selectinload(Project.attachments).selectinload(
                        ProjectAttachment.uploader
                    ),
                )
                .where(Project.id == project_id)
            )

            result = await self.db.execute(query)
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"Project with ID {project_id} not found")

            # Check access permissions
            if not bool(project.is_public) and user_id:
                has_access = await self.check_project_access(
                    project_id, user_id
                )
                if not has_access:
                    raise AuthorizationError("Access denied to this project")

            return ProjectResponse.model_validate(project)

        except Exception as e:
            logger.error("Failed to get project %d: %s", project_id, e)
            raise

    async def update_project(
        self, project_id: int, project_data: ProjectUpdateRequest, user_id: int
    ) -> ProjectResponse:
        """Update project information"""
        try:
            # Check user has permission to update project
            can_edit = await self.check_project_permission(
                project_id, user_id, ["owner", "manager"]
            )
            if not can_edit:
                raise AuthorizationError(
                    "Insufficient permissions to update project"
                )

            result = await self.db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"Project with ID {project_id} not found")

            # Update fields
            update_data = project_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(project, field, value)

            setattr(project, "updated_by", user_id)
            setattr(project, "updated_at", datetime.now(timezone.utc))

            await self.db.commit()

            # Fetch updated project with relationships
            result = await self.db.execute(
                select(Project)
                .options(
                    selectinload(Project.creator),
                    selectinload(Project.members).selectinload(
                        ProjectMember.user
                    ),
                )
                .where(Project.id == project_id)
            )
            updated_project = result.scalar_one()

            logger.info("Project updated successfully: %s", project.name)
            return ProjectResponse.model_validate(updated_project)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to update project %d: %s", project_id, e)
            raise

    async def delete_project(self, project_id: int, user_id: int) -> bool:
        """Delete project (soft delete)"""
        try:
            # Check user has permission to delete project
            can_delete = await self.check_project_permission(
                project_id, user_id, ["owner"]
            )
            if not can_delete:
                raise AuthorizationError(
                    "Insufficient permissions to delete project"
                )

            result = await self.db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"Project with ID {project_id} not found")

            # Soft delete by changing status
            setattr(project, "status", ProjectStatus.CANCELLED)
            setattr(project, "updated_by", user_id)
            setattr(project, "updated_at", datetime.utcnow())

            await self.db.commit()

            logger.info("Project deleted: %s", project.name)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to delete project %d: %s", project_id, e)
            raise

    async def list_projects(
        self,
        page_no: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        search_params: Optional[ProjectSearchRequest] = None,
    ) -> ProjectListResponse:
        """List projects with pagination and filters"""
        try:
            # Build base query
            query = select(Project).options(
                selectinload(Project.creator),
                selectinload(Project.members).selectinload(ProjectMember.user),
            )

            # Apply access control
            if user_id:
                # User can see public projects or projects they're members of
                member_subquery = select(ProjectMember.project_id).where(
                    ProjectMember.user_id == user_id
                )
                query = query.where(
                    or_(
                        Project.is_public.is_(True),
                        Project.id.in_(member_subquery),
                    )
                )
            else:
                # Anonymous users can only see public projects
                query = query.where(Project.is_public.is_(True))

            # Apply search filters
            if search_params:
                if search_params.search_text:
                    query = query.where(
                        or_(
                            Project.name.ilike(
                                f"%{search_params.search_text}%"
                            ),
                            Project.description.ilike(
                                f"%{search_params.search_text}%"
                            ),
                        )
                    )

                if search_params.project_status:
                    query = query.where(
                        Project.status == search_params.project_status
                    )

                if search_params.priority:
                    query = query.where(
                        Project.priority == search_params.priority
                    )

                if search_params.creator_id:
                    query = query.where(
                        Project.creator_id == search_params.creator_id
                    )

                if search_params.start_date_from:
                    query = query.where(
                        Project.start_date >= search_params.start_date_from
                    )

                if search_params.start_date_to:
                    query = query.where(
                        Project.start_date <= search_params.start_date_to
                    )

                if search_params.end_date_from:
                    query = query.where(
                        Project.end_date >= search_params.end_date_from
                    )

                if search_params.end_date_to:
                    query = query.where(
                        Project.end_date <= search_params.end_date_to
                    )

                if search_params.tags:
                    for tag in search_params.tags:
                        query = query.where(Project.tags.ilike(f"%{tag}%"))

                if search_params.is_public is not None:
                    query = query.where(
                        Project.is_public == search_params.is_public
                    )

            # Get total count
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # Apply pagination and ordering
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(Project.created_at))
            )

            # Execute query
            result = await self.db.execute(query)
            projects = result.scalars().all()

            # Calculate pagination info
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return ProjectListResponse(
                projects=[
                    ProjectResponse.model_validate(project)
                    for project in projects
                ],
                total_items=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
            )

        except Exception as e:
            logger.error("Failed to list projects: %s", e)
            raise

    async def add_project_member(
        self,
        project_id: int,
        member_data: ProjectMemberCreateRequest,
        added_by: int,
    ) -> bool:
        """Add member to project"""
        try:
            # Check user has permission to add members
            can_add = await self.check_project_permission(
                project_id, added_by, ["owner", "manager"]
            )
            if not can_add:
                raise AuthorizationError(
                    "Insufficient permissions to add members"
                )

            # Check if user is already a member
            existing_member = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == member_data.user_id,
                    )
                )
            )
            if existing_member.scalar_one_or_none():
                raise ConflictError("User is already a member of this project")

            # Verify target user exists
            user_result = await self.db.execute(
                select(User).where(User.id == member_data.user_id)
            )
            if not user_result.scalar_one_or_none():
                raise NotFoundError(
                    f"User with ID {member_data.user_id} not found"
                )

            # Add member
            project_member = ProjectMember(
                project_id=project_id,
                user_id=member_data.user_id,
                role=member_data.role,
                added_by=added_by,
            )

            self.db.add(project_member)
            await self.db.commit()

            logger.info(
                "Member added to project %d: user %d",
                project_id,
                member_data.user_id,
            )
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to add member to project %d: %s", project_id, e
            )
            raise

    async def remove_project_member(
        self, project_id: int, user_id: int, removed_by: int
    ) -> bool:
        """Remove member from project"""
        try:
            # Check user has permission to remove members
            can_remove = await self.check_project_permission(
                project_id, removed_by, ["owner", "manager"]
            )
            if not can_remove:
                raise AuthorizationError(
                    "Insufficient permissions to remove members"
                )

            # Cannot remove project owner
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == user_id,
                    )
                )
            )
            member = member_result.scalar_one_or_none()

            if not member:
                raise NotFoundError("User is not a member of this project")

            if str(member.role) == str(ProjectMemberRole.OWNER):
                raise ValidationError("Cannot remove project owner")

            await self.db.delete(member)
            await self.db.commit()

            logger.info(
                "Member removed from project %d: user %d", project_id, user_id
            )
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to remove member from project %d: %s", project_id, e
            )
            raise

    async def get_project_stats(
        self, user_id: Optional[int] = None
    ) -> ProjectStatsResponse:
        """Get project statistics"""
        try:
            # Build base query with access control
            base_query = select(Project)
            if user_id:
                member_subquery = select(ProjectMember.project_id).where(
                    ProjectMember.user_id == user_id
                )
                base_query = base_query.where(
                    or_(
                        Project.is_public.is_(True),
                        Project.id.in_(member_subquery),
                    )
                )
            else:
                base_query = base_query.where(Project.is_public.is_(True))

            # Total projects
            total_result = await self.db.execute(
                select(count()).select_from(base_query.subquery())
            )
            total_projects = total_result.scalar()

            # Active projects
            active_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Project.status == "active").subquery()
                )
            )
            active_projects = active_result.scalar()

            # Completed projects
            completed_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Project.status == "completed").subquery()
                )
            )
            completed_projects = completed_result.scalar()

            # Projects by status
            status_result = await self.db.execute(
                select(Project.status, count(Project.id))
                .select_from(base_query.subquery())
                .group_by(Project.status)
            )
            projects_by_status = {
                row[0]: row[1] for row in status_result.fetchall()
            }  # dict(status_result.fetchall())

            # Projects by priority
            priority_result = await self.db.execute(
                select(Project.priority, count(Project.id))
                .select_from(base_query.subquery())
                .group_by(Project.priority)
            )
            projects_by_priority = {
                row[0]: row[1] for row in priority_result.fetchall()
            }  # dict(priority_result.fetchall())

            # Average progress
            progress_result = await self.db.execute(
                select(func.avg(Project.progress)).select_from(
                    base_query.subquery()
                )
            )
            average_progress = progress_result.scalar() or 0.0

            return ProjectStatsResponse(
                total_projects=(
                    total_projects if total_projects is not None else 0
                ),
                active_projects=(
                    active_projects if active_projects is not None else 0
                ),
                completed_projects=(
                    completed_projects if completed_projects is not None else 0
                ),
                projects_by_status=projects_by_status,
                projects_by_priority=projects_by_priority,
                average_progress=float(average_progress),
            )

        except Exception as e:
            logger.error("Failed to get project stats: %s", e)
            raise

    async def get_project_dashboard(
        self, user_id: int
    ) -> ProjectDashboardResponse:
        """Get project dashboard data for user"""
        try:
            # Get user's projects
            member_subquery = select(ProjectMember.project_id).where(
                ProjectMember.user_id == user_id
            )

            # My projects
            my_projects_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.creator))
                .where(Project.id.in_(member_subquery))
                .order_by(desc(Project.updated_at))
                .limit(5)
            )
            my_projects = my_projects_result.scalars().all()

            # Recent projects (all accessible)
            recent_projects_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.creator))
                .where(
                    or_(
                        Project.is_public.is_(True),
                        Project.id.in_(member_subquery),
                    )
                )
                .order_by(desc(Project.created_at))
                .limit(5)
            )
            recent_projects = recent_projects_result.scalars().all()

            # Upcoming deadlines
            upcoming_deadlines_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.creator))
                .where(
                    and_(
                        Project.end_date > datetime.utcnow(),
                        Project.end_date
                        < datetime.utcnow() + timedelta(days=30),
                        Project.status.in_(["planning", "active"]),
                        or_(
                            Project.is_public.is_(True),
                            Project.id.in_(member_subquery),
                        ),
                    )
                )
                .order_by(Project.end_date)
                .limit(10)
            )
            upcoming_deadlines = upcoming_deadlines_result.scalars().all()

            # Get stats
            stats = await self.get_project_stats(user_id)

            # Overdue projects
            overdue_result = await self.db.execute(
                select(count(Project.id)).where(
                    and_(
                        Project.end_date < datetime.utcnow(),
                        Project.status.in_(["planning", "active"]),
                        or_(
                            Project.is_public.is_(True),
                            Project.id.in_(member_subquery),
                        ),
                    )
                )
            )
            overdue_projects = overdue_result.scalar()

            return ProjectDashboardResponse(
                total_projects=stats.total_projects,
                active_projects=stats.active_projects,
                completed_projects=stats.completed_projects,
                overdue_projects=(
                    overdue_projects if overdue_projects is not None else 0
                ),
                recent_projects=[
                    ProjectResponse.model_validate(p) for p in recent_projects
                ],
                my_projects=[
                    ProjectResponse.model_validate(p) for p in my_projects
                ],
                project_progress_stats=stats.projects_by_status,
                upcoming_deadlines=[
                    ProjectResponse.model_validate(p)
                    for p in upcoming_deadlines
                ],
            )

        except Exception as e:
            logger.error("Failed to get project dashboard: %s", e)
            raise

    async def get_accessible_projects(self, user_id: int) -> List[int]:
        """Get list of project IDs user has access to"""
        try:
            # Get public projects
            public_result = await self.db.execute(
                select(Project.id).where(Project.is_public.is_(True))
            )
            public_projects = [row[0] for row in public_result.fetchall()]

            # Get projects where user is a member
            member_result = await self.db.execute(
                select(ProjectMember.project_id).where(
                    ProjectMember.user_id == user_id
                )
            )
            member_projects = [row[0] for row in member_result.fetchall()]

            # Combine and deduplicate
            return list(set(public_projects + member_projects))

        except Exception as e:
            logger.error("Failed to get accessible projects: %s", e)
            return []

    async def check_project_access(
        self, project_id: int, user_id: int
    ) -> bool:
        """Check if user has access to project"""
        try:
            # Check if project is public
            project_result = await self.db.execute(
                select(Project.is_public).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()

            if not project:
                return False

            if project:  # is_public
                return True

            # Check if user is a member
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == user_id,
                    )
                )
            )

            return member_result.scalar_one_or_none() is not None

        except Exception as e:
            logger.error("Failed to check project access: %s", e)
            return False

    async def check_project_permission(
        self, project_id: int, user_id: int, required_roles: List[str]
    ) -> bool:
        """Check if user has required role in project"""
        try:
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.user_id == user_id,
                    )
                )
            )
            member = member_result.scalar_one_or_none()

            if not member:
                return False

            return member.role in required_roles

        except Exception as e:
            logger.error("Failed to check project permission: %s", e)
            return False

    async def list_project_members(
        self,
        project_id: int,
        user_id: int,
    ):
        """
        List project members for a user
        """

        stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id
        )
        if user_id:
            stmt = stmt.where(ProjectMember.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()


async def get_project_service(
    db: AsyncSession | None = None,
) -> ProjectService:
    """Get project service instance"""
    if db is None:
        async for session in get_async_session():
            return ProjectService(session)
    return ProjectService(cast(AsyncSession, db))
