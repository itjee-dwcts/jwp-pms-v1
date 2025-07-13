"""
작업 API Routes

작업 관리 엔드포인트
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from schemas.task import (
    TaskCommentResponse,
    TaskCreateRequest,
    TaskListResponse,  # <-- Add this import
    TaskResponse,
    TaskSearchRequest,
    TaskUpdateRequest,
)
from services.task import TaskService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    page_no: int = Query(0, ge=0, description="건너뛸 레코드 수"),
    page_size: int = Query(50, ge=1, le=100, description="반환할 레코드 수"),
    project_id: Optional[UUID] = Query(None, description="프로젝트별 필터"),
    assignee_id: Optional[UUID] = Query(None, description="담당자별 필터"),
    task_status: Optional[str] = Query(None, description="상태별 필터"),
    priority: Optional[str] = Query(None, description="우선순위별 필터"),
    search_text: Optional[str] = Query(None, description="제목 또는 설명으로 검색"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    현재 사용자가 접근 가능한 작업 목록 조회
    """
    try:
        print("[DEBUG] list_projects 호출됨")
        print(f"[DEBUG] 사용자 ID: {current_user.id}")
        print(f"[DEBUG] 페이지 번호: {page_no}, 페이지 크기: {page_size}")

        task_service = TaskService(db)
        result = await task_service.list_tasks(
            user_id=UUID(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_params=TaskSearchRequest(
                project_id=project_id,
                assignee_id=assignee_id,
                task_status=task_status,
                priority=priority,
                search_text=search_text,
                task_type=None,
                owner_id=None,
                tag_ids=None,
                due_date_from=None,
                due_date_to=None,
                created_from=None,
                created_to=None,
            ),
        )

        print(f"[DEBUG] 서비스 호출 완료, 반환 타입: {type(result)}")

        # result가 None이거나 반복 불가한 경우 빈 리스트 반환
        if result is None:
            return TaskListResponse.create_response(
                tasks=[],
                page_no=page_no,
                page_size=page_size,
                total_items=0,
            )

        # 이미 ProjectListResponse라면 그대로 반환
        if isinstance(result, TaskListResponse):
            return result

        # 리스트라면 TaskListResponse로 변환
        if isinstance(result, list):
            tasks = [
                TaskResponse.model_validate(task)
                for task in result  # type: ignore
            ]
            return TaskListResponse.create_response(
                tasks=tasks,
                page_no=page_no,
                page_size=page_size,
                total_items=len(tasks),
            )

        # 기타 경우 오류 처리
        raise ValueError(f"예상치 못한 반환 타입: {type(result)}")

    except Exception as e:
        logger.error("작업 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업 목록을 조회할 수 없습니다",
        ) from e


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    ID로 작업 조회
    """
    try:
        task_service = TaskService(db)
        task = await task_service.check_task_access(
            user_id=UUID(str(current_user.id)), task_id=task_id
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="작업을 찾을 수 없습니다"
            )

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("작업 %s 조회 오류: %s", task_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업을 조회할 수 없습니다",
        ) from e


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새 작업 생성
    """
    try:
        task_service = TaskService(db)
        task = await task_service.create_task(
            user_id=UUID(str(current_user.id)), task_data=task_data
        )

        logger.info("작업이 %s에 의해 생성됨: %s", current_user.name, task.title)

        return TaskResponse.model_validate(task)

    except Exception as e:
        logger.error("작업 생성 오류: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업을 생성할 수 없습니다",
        ) from e


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    작업 수정
    """
    try:
        task_service = TaskService(db)
        task = await task_service.update_task(
            user_id=UUID(str(current_user.id)), task_id=task_id, task_data=task_data
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="작업을 찾을 수 없습니다"
            )

        logger.info("작업이 %s에 의해 수정됨: %s", current_user.name, task.title)

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("작업 %s 수정 오류: %s", task_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업을 수정할 수 없습니다",
        ) from e


@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    작업 삭제
    """
    try:
        task_service = TaskService(db)
        success = await task_service.delete_task(
            user_id=UUID(str(current_user.id)), task_id=task_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="작업을 찾을 수 없습니다"
            )

        logger.info("작업이 %s에 의해 삭제됨: %s", current_user.name, task_id)

        return {"message": "작업이 성공적으로 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("작업 %s 삭제 오류: %s", task_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업을 삭제할 수 없습니다",
        ) from e


@router.get("/{task_id}/comments", response_model=List[TaskCommentResponse])
async def list_task_comments(
    task_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    작업 댓글 목록 조회
    """
    try:
        task_service = TaskService(db)
        comments = await task_service.list_task_comments(
            user_id=UUID(str(current_user.id)), task_id=task_id
        )

        return [TaskCommentResponse.model_validate(comment) for comment in comments]

    except Exception as e:
        logger.error("작업 댓글 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업 댓글 목록을 조회할 수 없습니다",
        ) from e
