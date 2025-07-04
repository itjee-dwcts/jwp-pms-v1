# backend/src/services/task.py
"""
Task Service

Business logic for task management operations.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional, cast

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
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import (
    count,  # func.count 오류 인식 이슈로 인해 별도 처리함
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
    """Task management service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(
        self, task_data: TaskCreateRequest, creator_id: int
    ) -> TaskResponse:
        """Create a new task"""
        try:
            # Verify project exists and user has access
            project_result = await self.db.execute(
                select(Project).where(Project.id == task_data.project_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                raise NotFoundError(
                    f"Project with ID {task_data.project_id} not found"
                )

            # Check if user has permission to create tasks in this project
            project_service = ProjectService(self.db)
            project_access = await project_service.check_project_access(
                task_data.project_id, creator_id
            )
            if not project_access:
                raise AuthorizationError(
                    "No permission to create tasks in this project"
                )

            # Verify parent task if specified
            if task_data.parent_task_id:
                parent_result = await self.db.execute(
                    select(Task).where(Task.id == task_data.parent_task_id)
                )
                parent_task = parent_result.scalar_one_or_none()

                if not parent_task:
                    raise NotFoundError("Parent task not found")

                parent_project_id = getattr(parent_task, "project_id", None)
                if not parent_project_id:
                    raise ValidationError(
                        "Parent task does not belong to any project"
                    )

                if parent_project_id != task_data.project_id:
                    raise ValidationError(
                        "Parent task must be in the same project"
                    )

            # Create task
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

            # Assign users if specified
            task_id = getattr(task, "id", None)
            if not task_id:
                raise ConflictError("Failed to create task, ID not assigned")

            if task_data.assignee_ids:
                for user_id in task_data.assignee_ids:
                    await self.assign_user_to_task(
                        task_id, user_id, creator_id
                    )

            # Add tags if specified
            if task_data.tag_ids:
                for tag_id in task_data.tag_ids:
                    task_tag = TaskTag(
                        task_id=task.id, tag_id=tag_id, created_by=creator_id
                    )
                    self.db.add(task_tag)

            await self.db.commit()

            # Fetch created task with relationships
            result = await self.db.execute(
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.assignments).selectinload(
                        TaskAssignment.user
                    ),
                    selectinload(Task.tags).selectinload(TaskTag.tag),
                )
                .where(Task.id == task.id)
            )
            created_task = result.scalar_one()

            logger.info("Task created successfully: %s", task.title)
            return TaskResponse.model_validate(created_task)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to create task: %s", e)
            raise

    async def get_task_by_id(
        self, task_id: int, user_id: Optional[int] = None
    ) -> TaskResponse:
        """Get task by ID"""
        try:
            # Build query with relationships
            query = (
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.project),
                    selectinload(Task.assignments).selectinload(
                        TaskAssignment.user
                    ),
                    selectinload(Task.comments).selectinload(
                        TaskComment.author
                    ),
                    selectinload(Task.attachments).selectinload(
                        TaskAttachment.uploader
                    ),
                    selectinload(Task.time_logs).selectinload(
                        TaskTimeLog.user
                    ),
                    selectinload(Task.tags).selectinload(TaskTag.tag),
                    selectinload(Task.subtasks),
                )
                .where(Task.id == task_id)
            )

            result = await self.db.execute(query)
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"Task with ID {task_id} not found")

            # Check access permissions
            if user_id:
                has_access = await self.check_task_access(task_id, user_id)
                if not has_access:
                    raise AuthorizationError("Access denied to this task")

            return TaskResponse.model_validate(task)

        except Exception as e:
            logger.error("Failed to get task %d: %s", task_id, e)
            raise

    async def update_task(
        self, task_id: int, task_data: TaskUpdateRequest, user_id: int
    ) -> TaskResponse:
        """Update task information"""
        try:
            # Check user has permission to update task
            has_access = await self.check_task_access(task_id, user_id)
            if not has_access:
                raise AuthorizationError("No permission to update this task")

            result = await self.db.execute(
                select(Task).where(Task.id == task_id)
            )
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"Task with ID {task_id} not found")

            # Update fields
            update_data = task_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(task, field, value)

            # Mark as completed if status changed to done
            task_status = getattr(task, "status", None)
            if task_status is None:
                raise ValidationError("Task status cannot be None")

            task_completed_at = getattr(task, "completed_at", None)

            if task_data.status == "done" and task_status != "done":
                setattr(
                    task, "completed_at", datetime.utcnow()
                )  # task.completed_at = datetime.utcnow()
            elif task_data.status != "done" and task_completed_at is not None:
                setattr(task, "completed_at", None)  # task.completed_at = None

            # task.updated_by = user_id
            # task.updated_at = datetime.utcnow()

            setattr(task, "updated_by", user_id)
            setattr(task, "updated_at", datetime.utcnow())

            await self.db.commit()

            # Fetch updated task with relationships
            result = await self.db.execute(
                select(Task)
                .options(
                    selectinload(Task.creator),
                    selectinload(Task.assignments).selectinload(
                        TaskAssignment.user
                    ),
                )
                .where(Task.id == task_id)
            )
            updated_task = result.scalar_one()

            logger.info("Task updated successfully: %s", task.title)
            return TaskResponse.model_validate(updated_task)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to update task %d: %s", task_id, e)
            raise

    async def delete_task(self, task_id: int, user_id: int) -> bool:
        """Delete task (soft delete)"""
        try:
            # Check user has permission to delete task
            has_access = await self.check_task_access(task_id, user_id)
            if not has_access:
                raise AuthorizationError("No permission to delete this task")

            result = await self.db.execute(
                select(Task).where(Task.id == task_id)
            )
            task = result.scalar_one_or_none()

            if not task:
                raise NotFoundError(f"Task with ID {task_id} not found")

            # Soft delete by changing status
            setattr(task, "status", "cancelled")
            setattr(task, "updated_by", user_id)
            setattr(task, "updated_at", datetime.now(timezone.utc))

            await self.db.commit()

            logger.info("Task deleted: %s", task.title)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to delete task %d: %s", task_id, e)
            raise

    async def list_tasks(
        self,
        page_no: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        search_params: Optional[TaskSearchRequest] = None,
    ) -> TaskListResponse:
        """List tasks with pagination and filters"""
        try:
            # Build base query
            query = select(Task).options(
                selectinload(Task.creator),
                selectinload(Task.project),
                selectinload(Task.assignments).selectinload(
                    TaskAssignment.user
                ),
            )

            # Apply access control - user can see tasks in projects they
            # have access to
            if user_id:
                project_service = ProjectService(self.db)
                accessible_projects = (
                    await project_service.get_accessible_projects(user_id)
                )
                query = query.where(Task.project_id.in_(accessible_projects))

            # Apply search filters
            if search_params:
                if search_params.search_text:
                    query = query.where(
                        or_(
                            Task.title.ilike(f"%{search_params.search_text}%"),
                            Task.description.ilike(
                                f"%{search_params.search_text}%"
                            ),
                        )
                    )

                if search_params.project_id:
                    query = query.where(
                        Task.project_id == search_params.project_id
                    )

                # if search_params.task_status:
                #     query = query.where(
                #         Task.status == search_params.task_status
                #     )

                if search_params.priority:
                    query = query.where(
                        Task.priority == search_params.priority
                    )

                if search_params.task_type:
                    query = query.where(
                        Task.task_type == search_params.task_type
                    )

                if search_params.assignee_id:
                    assignment_subquery = (
                        select(TaskAssignment.task_id)
                        .where(
                            TaskAssignment.user_id == search_params.assignee_id
                        )
                        .where(TaskAssignment.is_active.is_(True))
                    )
                    query = query.where(Task.id.in_(assignment_subquery))

                if search_params.creator_id:
                    query = query.where(
                        Task.creator_id == search_params.creator_id
                    )

                if search_params.due_date_from:
                    query = query.where(
                        Task.due_date >= search_params.due_date_from
                    )

                if search_params.due_date_to:
                    query = query.where(
                        Task.due_date <= search_params.due_date_to
                    )

                if search_params.created_from:
                    query = query.where(
                        Task.created_at >= search_params.created_from
                    )

                if search_params.created_to:
                    query = query.where(
                        Task.created_at <= search_params.created_to
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
                .order_by(desc(Task.created_at))
            )

            # Execute query
            result = await self.db.execute(query)
            tasks = result.scalars().all()

            # Calculate pagination info
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
            logger.error("Failed to list tasks: %s", e)
            raise

    async def assign_task(
        self, task_id: int, user_ids: List[int], assigned_by: int
    ) -> bool:
        """Assign task to users"""
        try:
            # Check permission
            has_access = await self.check_task_access(task_id, assigned_by)
            if not has_access:
                raise AuthorizationError("No permission to assign this task")

            # Verify task exists
            task_result = await self.db.execute(
                select(Task).where(Task.id == task_id)
            )
            task = task_result.scalar_one_or_none()
            if not task:
                raise NotFoundError("Task not found")

            # Remove existing assignments
            await self.db.execute(
                TaskAssignment.__table__.update()
                .where(TaskAssignment.task_id == task_id)
                .values(is_active=False)
            )

            # Add new assignments
            for user_id in user_ids:
                await self.assign_user_to_task(task_id, user_id, assigned_by)

            await self.db.commit()

            logger.info("Task %d assigned to users: %s", task_id, user_ids)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to assign task %d: %s", task_id, e)
            raise

    async def get_task_stats(
        self, user_id: Optional[int] = None
    ) -> TaskStatsResponse:
        """Get task statistics"""
        try:
            # Build base query with access control
            base_query = select(Task)
            if user_id:
                project_service = ProjectService(self.db)
                accessible_projects = (
                    await project_service.get_accessible_projects(user_id)
                )
                base_query = base_query.where(
                    Task.project_id.in_(accessible_projects)
                )

            # Total tasks
            total_query = select(count()).select_from(base_query.subquery())
            total_result = await self.db.execute(total_query)
            total_tasks = total_result.scalar()

            # Tasks by status
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

            # Overdue tasks
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

            # Tasks by priority
            priority_result = await self.db.execute(
                select(Task.priority, count(Task.id))
                .select_from(base_query.subquery())
                .group_by(Task.priority)
            )
            # tasks_by_priority = dict(priority_result.fetchall())
            tasks_by_priority = {
                row[0]: row[1] for row in priority_result.fetchall()
            }

            # Tasks by type
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
                overdue_tasks=(
                    overdue_tasks if overdue_tasks is not None else 0
                ),
                tasks_by_status=status_counts,
                tasks_by_priority=tasks_by_priority,
                tasks_by_type=tasks_by_type,
            )

        except Exception as e:
            logger.error("Failed to get task stats: %s", e)
            raise

    async def get_kanban_board(
        self, project_id: Optional[int] = None, user_id: Optional[int] = None
    ) -> TaskKanbanBoardResponse:
        """Get tasks organized in Kanban board format"""
        try:
            # Build base query
            query = select(Task).options(
                selectinload(Task.creator),
                selectinload(Task.assignments).selectinload(
                    TaskAssignment.user
                ),
            )

            # Filter by project if specified
            if project_id:
                # Check access to project
                if user_id:
                    project_service = ProjectService(self.db)
                    project_access = (
                        await project_service.check_project_access(
                            project_id, user_id
                        )
                    )
                    if not project_access:
                        raise AuthorizationError("No access to this project")
                query = query.where(Task.project_id == project_id)
            elif user_id:
                # Show tasks from accessible projects
                project_service = ProjectService(self.db)
                accessible_projects = (
                    await project_service.get_accessible_projects(user_id)
                )
                query = query.where(Task.project_id.in_(accessible_projects))

            # Execute query
            result = await self.db.execute(query)
            tasks = result.scalars().all()

            # Organize by status
            kanban_board = TaskKanbanBoardResponse(
                todo=[], in_progress=[], in_review=[], testing=[], done=[]
            )

            for task in tasks:
                task_response = TaskResponse.model_validate(task)
                task_status = getattr(task, "status", None)
                if task_status is None:
                    logger.warning("Task %d has no status, skipping", task.id)
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
            logger.error("Failed to get kanban board: %s", e)
            raise

    async def check_task_access(self, task_id: int, user_id: int) -> bool:
        """Check if user has access to task"""
        try:
            task_result = await self.db.execute(
                select(Task).where(Task.id == task_id)
            )
            task = task_result.scalar_one_or_none()

            if not task:
                return False

            # Task creator has access
            task_creator_id = getattr(task, "creator_id", None)
            if task_creator_id is None:
                logger.warning(
                    "Task %d has no creator, access denied", task_id
                )
                return False

            if task_creator_id == user_id:
                return True

            # Check if user is assigned to task
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

            # Check project access
            task_project_id = getattr(task, "project_id", None)
            if task_project_id is None:
                logger.warning(
                    "Task %d has no project, access denied", task_id
                )
                return False

            project_service = ProjectService(self.db)

            return await project_service.check_project_access(
                task_project_id, user_id
            )

        except (
            NotFoundError,
            ValidationError,
            ConflictError,
            AuthorizationError,
        ) as e:
            logger.error("Failed to check task access: %s", e)
            return False

    async def assign_user_to_task(
        self, task_id: int, user_id: int, assigned_by: int
    ):
        """Assign a user to a task"""
        try:
            # Verify user exists
            user_result = await self.db.execute(
                select(User).where(User.id == user_id)
            )
            if not user_result.scalar_one_or_none():
                raise NotFoundError(f"User with ID {user_id} not found")

            # Check if already assigned
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
                return  # Already assigned

            # Create assignment
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
                "Failed to assign user %d to task %d: %s", user_id, task_id, e
            )
            raise

    async def list_task_comments(
        self,
        task_id: int,
        user_id: int,
    ):
        """
        List comments for a user
        """

        stmt = select(TaskComment).where(TaskComment.task_id == task_id)
        if user_id:
            stmt = stmt.where(TaskComment.author_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()


async def get_task_service(db: AsyncSession | None = None) -> TaskService:
    """Get task service instance"""
    if db is None:
        async for session in get_async_session():
            return TaskService(session)
    return TaskService(cast(AsyncSession, db))
