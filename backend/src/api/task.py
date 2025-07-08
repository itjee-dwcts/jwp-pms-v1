"""
Tasks API Routes

Task management endpoints.
"""

import logging
from typing import List, Optional

from core.database import get_async_session
from core.dependencies import get_current_active_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.user import User
from schemas.task import (
    TaskCommentResponse,
    TaskCreateRequest,
    TaskResponse,
    TaskSearchRequest,
    TaskUpdateRequest,
)
from services.task import TaskService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    page_no: int = Query(0, ge=0, description="Number of records to skip"),
    page_size: int = Query(50, ge=1, le=100, description="Number of records to return"),
    project_id: Optional[int] = Query(None, description="Filter by project"),
    assignee_id: Optional[int] = Query(None, description="Filter by assignee"),
    task_status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search_text: Optional[str] = Query(
        None, description="Search by title or description"
    ),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List tasks accessible to current user
    """
    try:
        task_service = TaskService(db)
        tasks = await task_service.list_tasks(
            user_id=int(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_params=TaskSearchRequest(
                project_id=project_id,
                assignee_id=assignee_id,
                task_status=task_status,
                priority=priority,
                search_text=search_text,
            ),
        )

        return [TaskResponse.model_validate(task) for task in tasks]

    except Exception as e:
        logger.error("Error listing tasks: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tasks",
        ) from e


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get task by ID
    """
    try:
        task_service = TaskService(db)
        task = await task_service.check_task_access(task_id, int(str(current_user.id)))

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting task %s: %s", task_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve task",
        ) from e


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create a new task
    """
    try:
        task_service = TaskService(db)
        task = await task_service.create_task(task_data, int(str(current_user.id)))

        logger.info("Task created by %s: %s", current_user.name, task.title)

        return TaskResponse.model_validate(task)

    except Exception as e:
        logger.error("Error creating task: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task",
        ) from e


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Update task
    """
    try:
        task_service = TaskService(db)
        task = await task_service.update_task(
            task_id, task_data, int(str(current_user.id))
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

        logger.info("Task updated by %s: %s", current_user.name, task.title)

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating task %s: %s", task_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task",
        ) from e


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Delete task
    """
    try:
        task_service = TaskService(db)
        success = await task_service.delete_task(task_id, int(str(current_user.id)))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

        logger.info("Task deleted by %s: %s", current_user.name, task_id)

        return {"message": "Task deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting task %s: %s", task_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task",
        ) from e


@router.get("/{task_id}/comments", response_model=List[TaskCommentResponse])
async def list_task_comments(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List task comments
    """
    try:
        task_service = TaskService(db)
        comments = await task_service.list_task_comments(
            task_id, int(str(current_user.id))
        )

        return [TaskCommentResponse.model_validate(comment) for comment in comments]

    except Exception as e:
        logger.error("Error listing task comments: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve task comments",
        ) from e
