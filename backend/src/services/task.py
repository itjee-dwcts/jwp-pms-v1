"""
작업 서비스

작업 관리 작업을 위한 비즈니스 로직입니다.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional, cast

from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import (
    count,  # func.count 오류 인식 이슈로 인해 별도 처리함
)

from core.database import get_async_session
from models.project import Project
from models.task import (
    Task,
    TaskAssignment,
    TaskAttachment,
    TaskComment,
    TaskTag,
    TaskTimeLog,
)
from models.user import User
from schemas.task import (
    TaskCreateRequest,
    TaskKanbanBoardResponse,
    TaskListResponse,
    TaskResponse,
    TaskSearchRequest,
    TaskStatsResponse,
    TaskUpdateRequest,
)
from utils.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)

from .project import ProjectService

logger = logging.getLogger(__name__)


class TaskService:
    """작업 관리 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(
        self, task_data: TaskCreateRequest, creator_id: int
    ) -> TaskResponse:
        """새 작업 생성"""
        try:
            # 프로젝트가 존재하고 사용자가 접근 권한이 있는지 확인
            project_result = await self.db.execute(
                select(Project).where(Project.id == task_data.project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                raise NotFoundError(
                    f"ID {task_data.project_id}인 프로젝트를 찾을 수 없습니다"
                )

            # 사용자가 이 프로젝트에서 작업을 생성할 권한이 있는지 확인
            project_service = ProjectService(self.db)
            project_access = await project_service.check_project_access(
                task_data.project_id, creator_id
            )
            if not project_access:
                raise AuthorizationError(
                    "이 프로젝트에서 작업을 생성할 권한이 없습니다"
                )

            # 지정된 경우 상위 작업 확인
            if task_data.parent_task_id:
                parent_result = await self.db.execute(
                    select(Task).where(Task.id == task_data.parent_task_id)
                )
                parent_task = parent_result.scalar_one_or_none()

                if not parent_task:
                    raise NotFoundError("상위 작업을 찾을 수 없습니다")

                parent_project_id = getattr(parent_task, "project_id", None)
                if not parent_project_id:
                    raise ValidationError(
                        "상위 작업이 어떤 프로젝트에도 속해 있지 않습니다"
                    )

                if parent_project_id != task_data.project_id:
                    raise ValidationError("상위 작업은 같은 프로젝트에 있어야 합니다")

            # 작업 생성
            task = Task(
                title=task_data.title,
                description=task_data.description,
                status=task_data.status,
                priority=task_data.priority,
                task_type=task_data.task_type,
                project_id=task_data.project_id,
                parent_task_id=task_data.parent_task_id,
                start_date=task_data.start_date,
                due_date=task_data.due_date,
                estimated_hours=task_data.estimated_hours,
                story_points=task_data.story_points,
                acceptance_criteria=task_data.acceptance_criteria,
                external_id=task_data.external_id,
                creator_id=creator_id,
                created_by=creator_id,
                updated_by=creator_id,
            )

            self.db.add(task)
            await self.db.flush()

            # 지정된 경우 사용자 할당
            task_id = getattr(task, "id", None)
            if not task_id:
                raise ConflictError(
                    "작업 생성에 실패했습니다. ID가 할당되지 않았습니다"
                )

            if task_data.assignee_ids:
                for user_id in task_data.assignee_ids:
                    await self.assign_user_to_task(task_id, user_id, creator_id)

            # 지정된 경우 태그 추가
            if task_data.tag_ids:
                for tag_id in task_data.tag_ids:
                    task_tag = TaskTag(
                        task_id=task.id, tag_id=tag_id, created_by=creator_id
                    )
                    self.db.add(task_tag)

            await self.db.commit()

            # 관계와 함께 생성된 작업 가져오기
            result = await self.db.execute(
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.assignments).selectinload(TaskAssignment.user),
                    selectinload(Task.tags).selectinload(TaskTag.tag),
                )
                .where(Task.id == task.id)
            )
            created_task = result.scalar_one()

            logger.info("작업이 성공적으로 생성되었습니다: %s", task.title)
            return TaskResponse.model_validate(created_task)

        except Exception as e:
            await self.db.rollback()
            logger.error("작업 생성에 실패했습니다: %s", e)
            raise

    async def get_task_by_id(
        self, task_id: int, user_id: Optional[int] = None
    ) -> TaskResponse:
        """ID로 작업 가져오기"""
        try:
            # 관계와 함께 쿼리 빌드
            query = (
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.project),
                    selectinload(Task.assignments).selectinload(TaskAssignment.user),
                    selectinload(Task.comments).selectinload(TaskComment.author),
                    selectinload(Task.attachments).selectinload(
                        TaskAttachment.uploader
                    ),
                    selectinload(Task.time_logs).selectinload(TaskTimeLog.user),
                    selectinload(Task.tags).selectinload(TaskTag.tag),
                    selectinload(Task.subtasks),
                )
                .where(Task.id == task_id)
            )

            result = await self.db.execute(query)
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"ID {task_id}인 작업을 찾을 수 없습니다")

            # 접근 권한 확인
            if user_id:
                has_access = await self.check_task_access(task_id, user_id)
                if not has_access:
                    raise AuthorizationError("이 작업에 대한 접근이 거부되었습니다")

            return TaskResponse.model_validate(task)

        except Exception as e:
            logger.error("작업 %d 가져오기에 실패했습니다: %s", task_id, e)
            raise

    async def update_task(
        self, task_id: int, task_data: TaskUpdateRequest, user_id: int
    ) -> TaskResponse:
        """작업 정보 업데이트"""
        try:
            # 사용자가 작업을 업데이트할 권한이 있는지 확인
            has_access = await self.check_task_access(task_id, user_id)
            if not has_access:
                raise AuthorizationError("이 작업을 업데이트할 권한이 없습니다")

            result = await self.db.execute(select(Task).where(Task.id == task_id))
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"ID {task_id}인 작업을 찾을 수 없습니다")

            # 필드 업데이트
            update_data = task_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(task, field, value)

            # 상태가 완료로 변경되면 완료로 표시
            task_status = getattr(task, "status", None)
            if task_status is None:
                raise ValidationError("작업 상태는 None일 수 없습니다")

            task_completed_at = getattr(task, "completed_at", None)

            if task_data.status == "done" and task_status != "done":
                task.completed_at = (
                    datetime.utcnow()
                )  # task.completed_at = datetime.utcnow()
            elif task_data.status != "done" and task_completed_at is not None:
                task.completed_at = None  # task.completed_at = None

            # task.updated_by = user_id
            # task.updated_at = datetime.utcnow()

            task.updated_by = user_id
            task.updated_at = datetime.utcnow()

            await self.db.commit()

            # 관계와 함께 업데이트된 작업 가져오기
            result = await self.db.execute(
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.assignments).selectinload(TaskAssignment.user),
                )
                .where(Task.id == task_id)
            )
            updated_task = result.scalar_one()

            logger.info("작업이 성공적으로 업데이트되었습니다: %s", task.title)
            return TaskResponse.model_validate(updated_task)

        except Exception as e:
            await self.db.rollback()
            logger.error("작업 %d 업데이트에 실패했습니다: %s", task_id, e)
            raise

    async def delete_task(self, task_id: int, user_id: int) -> bool:
        """작업 삭제 (소프트 삭제)"""
        try:
            # 사용자가 작업을 삭제할 권한이 있는지 확인
            has_access = await self.check_task_access(task_id, user_id)
            if not has_access:
                raise AuthorizationError("이 작업을 삭제할 권한이 없습니다")

            result = await self.db.execute(select(Task).where(Task.id == task_id))
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"ID {task_id}인 작업을 찾을 수 없습니다")

            # 상태 변경으로 소프트 삭제
            task.status = "cancelled"
            task.updated_by = user_id
            task.updated_at = datetime.now(timezone.utc)

            await self.db.commit()

            logger.info("작업이 삭제되었습니다: %s", task.title)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("작업 %d 삭제에 실패했습니다: %s", task_id, e)
            raise

    async def list_tasks(
        self,
        page_no: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        search_params: Optional[TaskSearchRequest] = None,
    ) -> TaskListResponse:
        """페이지네이션 및 필터를 사용한 작업 목록"""
        try:
            # 기본 쿼리 빌드
            query = select(Task).options(
                selectinload(Task.creator),
                selectinload(Task.project),
                selectinload(Task.assignments).selectinload(TaskAssignment.user),
            )

            # 접근 제어 적용 - 사용자는 접근 권한이 있는 프로젝트의 작업을 볼 수 있음
            if user_id:
                project_service = ProjectService(self.db)
                accessible_projects = await project_service.get_accessible_projects(
                    user_id
                )
                query = query.where(Task.project_id.in_(accessible_projects))

            # 검색 필터 적용
            if search_params:
                if search_params.search_text:
                    query = query.where(
                        or_(
                            Task.title.ilike(f"%{search_params.search_text}%"),
                            Task.description.ilike(f"%{search_params.search_text}%"),
                        )
                    )

                if search_params.project_id:
                    query = query.where(Task.project_id == search_params.project_id)

                # if search_params.task_status:
                #     query = query.where(
                #         Task.status == search_params.task_status
                #     )

                if search_params.priority:
                    query = query.where(Task.priority == search_params.priority)

                if search_params.task_type:
                    query = query.where(Task.task_type == search_params.task_type)

                if search_params.assignee_id:
                    assignment_subquery = (
                        select(TaskAssignment.task_id)
                        .where(TaskAssignment.user_id == search_params.assignee_id)
                        .where(TaskAssignment.is_active.is_(True))
                    )
                    query = query.where(Task.id.in_(assignment_subquery))

                if search_params.creator_id:
                    query = query.where(Task.creator_id == search_params.creator_id)

                if search_params.due_date_from:
                    query = query.where(Task.due_date >= search_params.due_date_from)

                if search_params.due_date_to:
                    query = query.where(Task.due_date <= search_params.due_date_to)

                if search_params.created_from:
                    query = query.where(Task.created_at >= search_params.created_from)

                if search_params.created_to:
                    query = query.where(Task.created_at <= search_params.created_to)

            # 총 개수 가져오기
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset).limit(page_size).order_by(desc(Task.created_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            tasks = result.scalars().all()

            # 페이지네이션 정보 계산
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return TaskListResponse(
                tasks=[TaskResponse.model_validate(task) for task in tasks],
                total_items=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
            )

        except Exception as e:
            logger.error("작업 목록 가져오기에 실패했습니다: %s", e)
            raise

    async def assign_task(
        self, task_id: int, user_ids: List[int], assigned_by: int
    ) -> bool:
        """사용자에게 작업 할당"""
        try:
            # 권한 확인
            has_access = await self.check_task_access(task_id, assigned_by)
            if not has_access:
                raise AuthorizationError("이 작업을 할당할 권한이 없습니다")

            # 작업 존재 확인
            task_result = await self.db.execute(select(Task).where(Task.id == task_id))
            task = task_result.scalar_one_or_none()
            if not task:
                raise NotFoundError("작업을 찾을 수 없습니다")

            # 기존 할당 제거
            await self.db.execute(
                TaskAssignment.__table__.update()
                .where(TaskAssignment.task_id == task_id)
                .values(is_active=False)
            )

            # 새 할당 추가
            for user_id in user_ids:
                await self.assign_user_to_task(task_id, user_id, assigned_by)

            await self.db.commit()

            logger.info("작업 %d이 사용자들에게 할당되었습니다: %s", task_id, user_ids)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("작업 %d 할당에 실패했습니다: %s", task_id, e)
            raise

    async def get_task_stats(self, user_id: Optional[int] = None) -> TaskStatsResponse:
        """작업 통계 가져오기"""
        try:
            # 접근 제어가 포함된 기본 쿼리 빌드
            base_query = select(Task)
            if user_id:
                project_service = ProjectService(self.db)
                accessible_projects = await project_service.get_accessible_projects(
                    user_id
                )
                base_query = base_query.where(Task.project_id.in_(accessible_projects))

            # 총 작업 수
            total_query = select(count()).select_from(base_query.subquery())
            total_result = await self.db.execute(total_query)
            total_tasks = total_result.scalar()

            # 상태별 작업 수
            status_counts = {}
            for status in [
                "todo",
                "in_progress",
                "done",
                "blocked",
                "cancelled",
            ]:
                status_query = base_query.where(
                    Task.status == status  # type: ignore
                )
                status_result = await self.db.execute(
                    select(count()).select_from(status_query.subquery())
                )
                status_counts[status] = status_result.scalar()

            # 연체된 작업
            overdue_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        and_(
                            Task.due_date < datetime.now(timezone.utc),
                            Task.status.notin_(["done", "cancelled"]),
                        )
                    ).subquery()
                )
            )
            overdue_tasks = overdue_result.scalar()

            # 우선순위별 작업
            priority_result = await self.db.execute(
                select(Task.priority, count(Task.id))
                .select_from(base_query.subquery())
                .group_by(Task.priority)
            )
            # tasks_by_priority = dict(priority_result.fetchall())
            tasks_by_priority = {row[0]: row[1] for row in priority_result.fetchall()}

            # 유형별 작업
            type_result = await self.db.execute(
                select(Task.task_type, count(Task.id))
                .select_from(base_query.subquery())
                .group_by(Task.task_type)
            )
            # tasks_by_type = dict(type_result.fetchall())
            tasks_by_type = {row[0]: row[1] for row in type_result.fetchall()}

            return TaskStatsResponse(
                total_tasks=total_tasks if total_tasks is not None else 0,
                todo_tasks=status_counts.get("todo", 0),
                in_progress_tasks=status_counts.get("in_progress", 0),
                completed_tasks=status_counts.get("done", 0),
                overdue_tasks=(overdue_tasks if overdue_tasks is not None else 0),
                tasks_by_status=status_counts,
                tasks_by_priority=tasks_by_priority,
                tasks_by_type=tasks_by_type,
            )

        except Exception as e:
            logger.error("작업 통계 가져오기에 실패했습니다: %s", e)
            raise

    async def get_kanban_board(
        self, project_id: Optional[int] = None, user_id: Optional[int] = None
    ) -> TaskKanbanBoardResponse:
        """칸반 보드 형식으로 구성된 작업 가져오기"""
        try:
            # 기본 쿼리 빌드
            query = select(Task).options(
                selectinload(Task.creator),
                selectinload(Task.assignments).selectinload(TaskAssignment.user),
            )

            # 지정된 경우 프로젝트별 필터링
            if project_id:
                # 프로젝트에 대한 접근 권한 확인
                if user_id:
                    project_service = ProjectService(self.db)
                    project_access = await project_service.check_project_access(
                        project_id, user_id
                    )
                    if not project_access:
                        raise AuthorizationError("이 프로젝트에 접근할 권한이 없습니다")
                query = query.where(Task.project_id == project_id)
            elif user_id:
                # 접근 가능한 프로젝트의 작업 표시
                project_service = ProjectService(self.db)
                accessible_projects = await project_service.get_accessible_projects(
                    user_id
                )
                query = query.where(Task.project_id.in_(accessible_projects))

            # 쿼리 실행
            result = await self.db.execute(query)
            tasks = result.scalars().all()

            # 상태별로 구성
            kanban_board = TaskKanbanBoardResponse(
                todo=[], in_progress=[], in_review=[], testing=[], done=[]
            )

            for task in tasks:
                task_response = TaskResponse.model_validate(task)
                task_status = getattr(task, "status", None)
                if task_status is None:
                    logger.warning("작업 %d에 상태가 없습니다. 건너뜁니다", task.id)
                    continue

                if task_status == "todo":
                    kanban_board.todo.append(task_response)
                elif task_status == "in_progress":
                    kanban_board.in_progress.append(task_response)
                elif task_status == "in_review":
                    kanban_board.in_review.append(task_response)
                elif task_status == "testing":
                    kanban_board.testing.append(task_response)
                elif task_status == "done":
                    kanban_board.done.append(task_response)

            return kanban_board

        except Exception as e:
            logger.error("칸반 보드 가져오기에 실패했습니다: %s", e)
            raise

    async def check_task_access(self, task_id: int, user_id: int) -> bool:
        """사용자가 작업에 접근할 수 있는지 확인"""
        try:
            task_result = await self.db.execute(select(Task).where(Task.id == task_id))
            task = task_result.scalar_one_or_none()

            if not task:
                return False

            # 작업 생성자는 접근 권한이 있음
            task_creator_id = getattr(task, "creator_id", None)
            if task_creator_id is None:
                logger.warning(
                    "작업 %d에 생성자가 없습니다. 접근이 거부되었습니다", task_id
                )
                return False

            if task_creator_id == user_id:
                return True

            # 사용자가 작업에 할당되었는지 확인
            assignment_result = await self.db.execute(
                select(TaskAssignment).where(
                    and_(
                        TaskAssignment.task_id == task_id,
                        TaskAssignment.user_id == user_id,
                        TaskAssignment.is_active.is_(True),
                    )
                )
            )
            if assignment_result.scalar_one_or_none():
                return True

            # 프로젝트 접근 권한 확인
            task_project_id = getattr(task, "project_id", None)
            if task_project_id is None:
                logger.warning(
                    "작업 %d에 프로젝트가 없습니다. 접근이 거부되었습니다", task_id
                )
                return False

            project_service = ProjectService(self.db)

            return await project_service.check_project_access(task_project_id, user_id)

        except (
            NotFoundError,
            ValidationError,
            ConflictError,
            AuthorizationError,
        ) as e:
            logger.error("작업 접근 권한 확인에 실패했습니다: %s", e)
            return False

    async def assign_user_to_task(self, task_id: int, user_id: int, assigned_by: int):
        """사용자를 작업에 할당"""
        try:
            # 사용자 존재 확인
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            if not user_result.scalar_one_or_none():
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 이미 할당되었는지 확인
            existing_result = await self.db.execute(
                select(TaskAssignment).where(
                    and_(
                        TaskAssignment.task_id == task_id,
                        TaskAssignment.user_id == user_id,
                        TaskAssignment.is_active.is_(True),
                    )
                )
            )
            if existing_result.scalar_one_or_none():
                return  # 이미 할당됨

            # 할당 생성
            assignment = TaskAssignment(
                task_id=task_id,
                user_id=user_id,
                assigned_by=assigned_by,
                is_active=True,
            )

            self.db.add(assignment)
            await self.db.flush()

        except (
            NotFoundError,
            ValidationError,
            ConflictError,
            AuthorizationError,
        ) as e:
            logger.error(
                "사용자 %d를 작업 %d에 할당하는데 실패했습니다: %s", user_id, task_id, e
            )
            raise

    async def list_task_comments(
        self,
        task_id: int,
        user_id: int,
    ):
        """
        사용자의 댓글 목록
        """

        stmt = select(TaskComment).where(TaskComment.task_id == task_id)
        if user_id:
            stmt = stmt.where(TaskComment.author_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()


async def get_task_service(db: AsyncSession | None = None) -> TaskService:
    """작업 서비스 인스턴스 가져오기"""
    if db is None:
        async for session in get_async_session():
            return TaskService(session)
    return TaskService(cast(AsyncSession, db))
