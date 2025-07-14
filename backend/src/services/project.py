"""
프로젝트 서비스

프로젝트 관리 작업을 위한 비즈니스 로직
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, cast
from uuid import UUID

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import count

from constants.project import ProjectStatus
from core.database import get_async_session
from models.project import Project, ProjectComment, ProjectMember, ProjectMemberRole
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
from services.user import UserService
from utils.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)

logger = logging.getLogger(__name__)


class ProjectService:
    """프로젝트 관리 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)

    async def create_project(
        self,
        user_id: UUID,
        project_data: ProjectCreateRequest,
    ) -> ProjectResponse:
        """새 프로젝트 생성"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            if not project_data.owner_id:
                project_data.owner_id = user_id

            owner = self.user_service.get_user_by_id(project_data.owner_id)
            if not owner:
                raise NotFoundError(
                    f"ID {project_data.owner_id}인 소유자를 찾을 수 없습니다"
                )

            # 프로젝트 생성
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
                tags=",".join(project_data.tags) if project_data.tags else None,
                is_public=project_data.is_public,
                owner_id=project_data.owner_id,
                created_by=user_id,
            )

            self.db.add(project)
            await self.db.flush()

            # 생성자를 프로젝트 소유자로 추가
            project_member = ProjectMember(
                project_id=project.id,
                member_id=project_data.owner_id,
                role=ProjectMemberRole.OWNER,
                created_by=user_id,
            )

            self.db.add(project_member)
            await self.db.commit()

            # 관계와 함께 생성된 프로젝트 조회
            result = await self.db.execute(
                select(Project)
                .options(
                    selectinload(Project.owner),
                    selectinload(Project.members).selectinload(ProjectMember.member),
                )
                .where(Project.id == project.id)
            )
            created_project = result.scalar_one()

            logger.info("프로젝트가 성공적으로 생성되었습니다: %s", project.name)
            return ProjectResponse.model_validate(created_project)

        except Exception as e:
            await self.db.rollback()
            logger.error("프로젝트 생성에 실패했습니다: %s", e)
            raise

    async def get_project_by_id(
        self, user_id: UUID, project_id: UUID
    ) -> ProjectResponse:
        """ID로 프로젝트 조회"""
        try:
            # 관계와 함께 쿼리 구성
            query = (
                select(Project)
                .options(
                    selectinload(Project.owner),
                    selectinload(Project.members).selectinload(ProjectMember.member),
                    selectinload(Project.comments).selectinload(ProjectComment.author),
                    selectinload(Project.attachments),
                )
                .where(Project.id == project_id)
            )

            result = await self.db.execute(query)
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"ID {project_id}인 프로젝트를 찾을 수 없습니다")

            # 접근 권한 확인
            if not bool(project.is_public) and user_id:
                has_access = await self.check_project_access(user_id, project_id)
                if not has_access:
                    raise AuthorizationError("이 프로젝트에 대한 접근이 거부되었습니다")

            return ProjectResponse.model_validate(project)

        except Exception as e:
            logger.error("프로젝트 %d 조회에 실패했습니다: %s", project_id, e)
            raise

    async def update_project(
        self, user_id: UUID, project_id: UUID, project_data: ProjectUpdateRequest
    ) -> ProjectResponse:
        """프로젝트 정보 업데이트"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 프로젝트를 업데이트할 권한이 있는지 확인
            can_edit = await self.check_project_permission(
                user_id, project_id, ["owner", "manager"]
            )
            if not can_edit:
                raise AuthorizationError("프로젝트를 업데이트할 권한이 부족합니다")

            result = await self.db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"ID {project_id}인 프로젝트를 찾을 수 없습니다")

            # 필드 업데이트
            update_data = project_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(project, field):
                    if field == "tags":
                        # 태그는 쉼표로 구분된 문자열로 저장
                        setattr(project, field, ",".join(value) if value else None)
                    else:
                        setattr(project, field, value)

            project.updated_by = user_id
            project.updated_at = datetime.now(timezone.utc)

            await self.db.commit()

            # 관계와 함께 업데이트된 프로젝트 조회
            result = await self.db.execute(
                select(Project)
                .options(
                    selectinload(Project.owner),
                    selectinload(Project.members).selectinload(ProjectMember.member),
                )
                .where(Project.id == project_id)
            )
            updated_project = result.scalar_one()

            logger.info("프로젝트가 성공적으로 업데이트되었습니다: %s", project.name)
            return ProjectResponse.model_validate(updated_project)

        except Exception as e:
            await self.db.rollback()
            logger.error("프로젝트 %d 업데이트에 실패했습니다: %s", project_id, e)
            raise

    async def delete_project(self, user_id: UUID, project_id: UUID) -> bool:
        """프로젝트 삭제 (소프트 삭제)"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 프로젝트를 삭제할 권한이 있는지 확인
            can_delete = await self.check_project_permission(
                user_id, project_id, ["owner"]
            )
            if not can_delete:
                raise AuthorizationError("프로젝트를 삭제할 권한이 부족합니다")

            result = await self.db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                raise NotFoundError(f"ID {project_id}인 프로젝트를 찾을 수 없습니다")

            # 상태 변경으로 소프트 삭제
            project.status = ProjectStatus.CANCELLED
            project.updated_by = user_id
            project.updated_at = datetime.now(timezone.utc)

            await self.db.commit()

            logger.info("프로젝트가 삭제되었습니다: %s", project.name)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("프로젝트 %d 삭제에 실패했습니다: %s", project_id, e)
            raise

    async def list_projects(
        self,
        user_id: UUID,
        page_no: int = 1,
        page_size: int = 20,
        search_params: Optional[ProjectSearchRequest] = None,
    ) -> ProjectListResponse:
        """페이지네이션과 필터로 프로젝트 목록 조회"""
        try:
            # 사용자가 존재하는지 검증
            print(f"사용자 존재 검증 User ID: {user_id}")
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 기본 쿼리 구성
            query = select(Project).options(
                selectinload(Project.owner),
                selectinload(Project.members).selectinload(ProjectMember.member),
                selectinload(Project.comments),
                selectinload(Project.attachments),
            )

            # 접근 제어 적용
            if user_id:
                # 사용자는 공개 프로젝트나 멤버인 프로젝트를 볼 수 있음
                member_subquery = select(ProjectMember.project_id).where(
                    ProjectMember.member_id == user_id
                )
                query = query.where(
                    or_(
                        Project.is_public.is_(True),
                        Project.id.in_(member_subquery),
                    )
                )
            else:
                # 익명 사용자는 공개 프로젝트만 볼 수 있음
                query = query.where(Project.is_public.is_(True))

            # 검색 필터 적용
            if search_params:
                if search_params.search_text:
                    query = query.where(
                        or_(
                            Project.name.ilike(f"%{search_params.search_text}%"),
                            Project.description.ilike(f"%{search_params.search_text}%"),
                        )
                    )

                if search_params.project_status:
                    query = query.where(Project.status == search_params.project_status)

                if search_params.priority:
                    query = query.where(Project.priority == search_params.priority)

                if search_params.owner_id:
                    query = query.where(Project.owner_id == search_params.owner_id)

                if search_params.start_date_from:
                    query = query.where(
                        Project.start_date >= search_params.start_date_from
                    )

                if search_params.start_date_to:
                    query = query.where(
                        Project.start_date <= search_params.start_date_to
                    )

                if search_params.end_date_from:
                    query = query.where(Project.end_date >= search_params.end_date_from)

                if search_params.end_date_to:
                    query = query.where(Project.end_date <= search_params.end_date_to)

                if search_params.tags:
                    for tag in search_params.tags:
                        query = query.where(Project.tags.ilike(f"%{tag}%"))

                if search_params.is_public is not None:
                    query = query.where(Project.is_public == search_params.is_public)

            # 페이지 번호 검증 및 정규화
            page_no = max(0, page_no)  # 음수 방지
            page_size = max(1, min(100, page_size))  # 범위 제한

            # 총 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 총 페이지 수 계산
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            # 페이지 번호가 범위를 벗어나는 경우 조정
            if total_pages > 0 and page_no >= total_pages:
                page_no = max(0, total_pages - 1)

            # 페이지네이션과 정렬 적용
            offset = page_no * page_size

            print(
                f"[DEBUG] 페이지네이션 계산 - page_no: {page_no}, page_size: {page_size}, offset: {offset}, total_pages: {total_pages}"
            )

            query = (
                query.offset(offset).limit(page_size).order_by(desc(Project.created_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            projects = result.scalars().all()

            # 페이지네이션 정보 계산
            has_next = (page_no + 1) < total_pages if total_pages > 0 else False
            has_prev = page_no > 0

            print(
                f"프로젝트 목록 조회 - 페이지: {page_no}, 총 개수: {total_items}, offset: {offset}"
            )

            return ProjectListResponse(
                projects=[
                    ProjectResponse.model_validate(project) for project in projects
                ],
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
                total_items=total_items if total_items is not None else 0,
                has_next=has_next,
                has_prev=has_prev,
            )

        except Exception as e:
            logger.error("프로젝트 목록 조회에 실패했습니다: %s", e)
            raise

    async def add_project_member(
        self,
        user_id: UUID,
        project_id: UUID,
        member_data: ProjectMemberCreateRequest,
    ) -> bool:
        """프로젝트에 멤버 추가"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 멤버를 추가할 권한이 있는지 확인
            can_add = await self.check_project_permission(
                user_id, project_id, ["owner", "manager"]
            )
            if not can_add:
                raise AuthorizationError("멤버를 추가할 권한이 부족합니다")

            # 사용자가 이미 멤버인지 확인
            existing_member = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.member_id == member_data.member_id,
                    )
                )
            )
            if existing_member.scalar_one_or_none():
                raise ConflictError("사용자가 이미 이 프로젝트의 멤버입니다")

            # 대상 사용자가 존재하는지 확인
            user_result = await self.db.execute(
                select(User).where(User.id == member_data.member_id)
            )
            if not user_result.scalar_one_or_none():
                raise NotFoundError(
                    f"ID {member_data.member_id}인 사용자를 찾을 수 없습니다"
                )

            # 멤버 추가
            project_member = ProjectMember(
                project_id=project_id,
                member_id=member_data.member_id,
                role=member_data.role,
                created_by=user_id,
            )

            self.db.add(project_member)
            await self.db.commit()

            logger.info(
                "프로젝트 %d에 멤버가 추가되었습니다: 사용자 %d",
                project_id,
                member_data.member_id,
            )
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("프로젝트 %d에 멤버 추가에 실패했습니다: %s", project_id, e)
            raise

    async def remove_project_member(
        self, user_id: UUID, project_id: UUID, member_id: UUID
    ) -> bool:
        """프로젝트에서 멤버 제거"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 멤버를 제거할 권한이 있는지 확인
            can_remove = await self.check_project_permission(
                user_id, project_id, ["owner", "manager"]
            )
            if not can_remove:
                raise AuthorizationError("멤버를 제거할 권한이 부족합니다")

            # 프로젝트 소유자는 제거할 수 없음
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.member_id == member_id,
                    )
                )
            )
            member = member_result.scalar_one_or_none()

            if not member:
                raise NotFoundError("사용자가 이 프로젝트의 멤버가 아닙니다")

            if str(member.role) == str(ProjectMemberRole.OWNER):
                raise ValidationError("프로젝트 소유자를 제거할 수 없습니다")

            await self.db.delete(member)
            await self.db.commit()

            logger.info(
                "프로젝트 %d에서 멤버가 제거되었습니다: 사용자 %d",
                project_id,
                member_id,
            )
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("프로젝트 %d에서 멤버 제거에 실패했습니다: %s", project_id, e)
            raise

    async def get_project_stats(self, user_id: UUID) -> ProjectStatsResponse:
        """프로젝트 통계 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 접근 제어와 함께 기본 쿼리 구성
            base_query = select(Project)
            if user_id:
                member_subquery = select(ProjectMember.project_id).where(
                    ProjectMember.member_id == user_id
                )
                base_query = base_query.where(
                    or_(
                        Project.is_public.is_(True),
                        Project.id.in_(member_subquery),
                    )
                )
            else:
                base_query = base_query.where(Project.is_public.is_(True))

            # 전체 프로젝트
            total_result = await self.db.execute(
                select(count()).select_from(base_query.subquery())
            )
            total_projects = total_result.scalar()

            # 활성 프로젝트
            active_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Project.status == "active").subquery()
                )
            )
            active_projects = active_result.scalar()

            # 완료된 프로젝트
            completed_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Project.status == "completed").subquery()
                )
            )
            completed_projects = completed_result.scalar()

            # 상태별 프로젝트
            status_result = await self.db.execute(
                select(Project.status, count(Project.id))
                .select_from(base_query.subquery())
                .group_by(Project.status)
            )
            projects_by_status = {row[0]: row[1] for row in status_result.fetchall()}

            # 우선순위별 프로젝트
            priority_result = await self.db.execute(
                select(Project.priority, count(Project.id))
                .select_from(base_query.subquery())
                .group_by(Project.priority)
            )
            projects_by_priority = {
                row[0]: row[1] for row in priority_result.fetchall()
            }

            # 평균 진행률
            progress_result = await self.db.execute(
                select(func.avg(Project.progress)).select_from(base_query.subquery())
            )
            average_progress = progress_result.scalar() or 0.0

            return ProjectStatsResponse(
                total_projects=(total_projects if total_projects is not None else 0),
                active_projects=(active_projects if active_projects is not None else 0),
                completed_projects=(
                    completed_projects if completed_projects is not None else 0
                ),
                projects_by_status=projects_by_status,
                projects_by_priority=projects_by_priority,
                average_progress=float(average_progress),
            )

        except Exception as e:
            logger.error("프로젝트 통계 조회에 실패했습니다: %s", e)
            raise

    async def get_project_dashboard(self, user_id: UUID) -> ProjectDashboardResponse:
        """사용자를 위한 프로젝트 대시보드 데이터 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자의 프로젝트 조회
            member_subquery = select(ProjectMember.project_id).where(
                ProjectMember.member_id == user_id
            )

            # 내 프로젝트
            my_projects_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.owner))
                .where(Project.id.in_(member_subquery))
                .order_by(desc(Project.updated_at))
                .limit(5)
            )
            my_projects = my_projects_result.scalars().all()

            # 최근 프로젝트 (모든 접근 가능한 프로젝트)
            recent_projects_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.owner))
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

            # 임박한 마감일
            upcoming_deadlines_result = await self.db.execute(
                select(Project)
                .options(selectinload(Project.owner))
                .where(
                    and_(
                        Project.end_date > datetime.now(timezone.utc),
                        Project.end_date
                        < datetime.now(timezone.utc) + timedelta(days=30),
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

            # 통계 조회
            stats = await self.get_project_stats(user_id)

            # 지연된 프로젝트
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
                my_projects=[ProjectResponse.model_validate(p) for p in my_projects],
                project_progress_stats=stats.projects_by_status,
                upcoming_deadlines=[
                    ProjectResponse.model_validate(p) for p in upcoming_deadlines
                ],
            )

        except Exception as e:
            logger.error("프로젝트 대시보드 조회에 실패했습니다: %s", e)
            raise

    async def get_accessible_projects(self, user_id: UUID) -> List[int]:
        """사용자가 접근할 수 있는 프로젝트 ID 목록 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 공개 프로젝트 조회
            public_result = await self.db.execute(
                select(Project.id).where(Project.is_public.is_(True))
            )
            public_projects = [row[0] for row in public_result.fetchall()]

            # 사용자가 멤버인 프로젝트 조회
            member_result = await self.db.execute(
                select(ProjectMember.project_id).where(
                    ProjectMember.member_id == user_id
                )
            )
            member_projects = [row[0] for row in member_result.fetchall()]

            # 결합하고 중복 제거
            return list(set(public_projects + member_projects))

        except Exception as e:
            logger.error("접근 가능한 프로젝트 조회에 실패했습니다: %s", e)
            return []

    async def check_project_access(self, user_id: UUID, project_id: UUID) -> bool:
        """사용자가 프로젝트에 접근할 수 있는지 확인"""
        try:
            # 사용자가 존재하는지 검증
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 프로젝트가 공개인지 확인
            project_result = await self.db.execute(
                select(Project.is_public).where(Project.id == project_id)
            )
            project = project_result.scalar_one_or_none()

            if not project:
                return False

            if project:  # is_public
                return True

            # 사용자가 멤버인지 확인
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.member_id == user_id,
                    )
                )
            )

            return member_result.scalar_one_or_none() is not None

        except Exception as e:
            logger.error("프로젝트 접근 권한 확인에 실패했습니다: %s", e)
            return False

    async def check_project_permission(
        self, user_id: UUID, project_id: UUID, required_roles: List[str]
    ) -> bool:
        """사용자가 프로젝트에서 필요한 역할을 가지고 있는지 확인"""
        try:
            member_result = await self.db.execute(
                select(ProjectMember).where(
                    and_(
                        ProjectMember.project_id == project_id,
                        ProjectMember.member_id == user_id,
                    )
                )
            )
            member = member_result.scalar_one_or_none()

            if not member:
                return False

            return member.role in required_roles

        except Exception as e:
            logger.error("프로젝트 권한 확인에 실패했습니다: %s", e)
            return False

    async def list_project_members(
        self, user_id: UUID, project_id: UUID, member_id: Optional[UUID] = None
    ) -> List[ProjectMember]:
        """
        사용자를 위한 프로젝트 멤버 목록 조회
        """
        # 사용자가 존재하는지 검증
        user = self.user_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

        stmt = select(ProjectMember).where(ProjectMember.project_id == project_id)
        if member_id:
            stmt = stmt.where(ProjectMember.member_id == member_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


async def get_project_service(
    db: AsyncSession | None = None,
) -> ProjectService:
    """프로젝트 서비스 인스턴스 조회"""
    if db is None:
        async for session in get_async_session():
            return ProjectService(session)
    return ProjectService(cast(AsyncSession, db))
