"""
프로젝트 API Routes

프로젝트 관리 엔드포인트
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from schemas.project import (
    ProjectCreateRequest,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectSearchRequest,
    ProjectUpdateRequest,
)
from services.project import ProjectService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    page_no: int = Query(0, ge=0, description="건너뛸 레코드 수"),
    page_size: int = Query(50, ge=1, le=100, description="반환할 레코드 수"),
    search_text: Optional[str] = Query(None, description="이름 또는 설명으로 검색"),
    project_status: Optional[str] = Query(None, description="상태별 필터"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    현재 사용자가 접근 가능한 프로젝트 목록 조회
    """
    try:
        project_service = ProjectService(db)
        projects = await project_service.list_projects(
            user_id=int(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_params=ProjectSearchRequest(
                search_text=search_text,
                project_status=project_status,
                priority=None,
                owner_id=None,
                tags=None,
                start_date_from=None,
                start_date_to=None,
                end_date_from=None,
                end_date_to=None,
                is_public=None,
            ),
        )

        return [ProjectResponse.model_validate(project) for project in projects]

    except Exception as e:
        logger.error("프로젝트 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트 목록을 조회할 수 없습니다",
        ) from e


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    ID로 프로젝트 조회
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.check_project_access(
            project_id, int(str(current_user.id))
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="프로젝트를 찾을 수 없습니다",
            )

        return ProjectResponse.model_validate(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("프로젝트 %s 조회 오류: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트를 조회할 수 없습니다",
        ) from e


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새 프로젝트 생성
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.create_project(
            project_data, int(str(current_user.id))
        )

        logger.info("프로젝트가 %s에 의해 생성됨: %s", current_user.name, project.name)

        return ProjectResponse.model_validate(project)

    except Exception as e:
        logger.error("프로젝트 생성 오류: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트를 생성할 수 없습니다",
        ) from e


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    프로젝트 수정
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.update_project(
            project_id, project_data, int(str(current_user.id))
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="프로젝트를 찾을 수 없습니다",
            )

        logger.info("프로젝트가 %s에 의해 수정됨: %s", current_user.name, project.name)

        return ProjectResponse.model_validate(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("프로젝트 %s 수정 오류: %s", project_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트를 수정할 수 없습니다",
        ) from e


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    프로젝트 삭제
    """
    try:
        project_service = ProjectService(db)
        success = await project_service.delete_project(
            project_id, int(str(current_user.id))
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="프로젝트를 찾을 수 없습니다",
            )

        logger.info("프로젝트가 %s에 의해 삭제됨: %s", current_user.name, project_id)

        return {"message": "프로젝트가 성공적으로 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("프로젝트 %s 삭제 오류: %s", project_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트를 삭제할 수 없습니다",
        ) from e


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def list_project_members(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    프로젝트 멤버 목록 조회
    """
    try:
        project_service = ProjectService(db)
        members = await project_service.list_project_members(
            project_id, int(str(current_user.id))
        )

        return [ProjectMemberResponse.model_validate(member) for member in members]

    except Exception as e:
        logger.error("프로젝트 멤버 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트 멤버 목록을 조회할 수 없습니다",
        ) from e
