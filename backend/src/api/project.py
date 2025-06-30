"""
Projects API Routes

Project management endpoints.
"""

import logging
from typing import List, Optional

from core.database import get_async_session
from core.dependencies import get_current_active_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.user import User
from schemas.project import (
    ProjectCreateRequest,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectSearchRequest,
    ProjectUpdateRequest,
)
from services.project import ProjectService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    page_no: int = Query(0, ge=0, description="Number of records to skip"),
    page_size: int = Query(
        50, ge=1, le=100, description="Number of records to return"
    ),
    search_text: Optional[str] = Query(
        None, description="Search by name or description"
    ),
    project_status: Optional[str] = Query(
        None, description="Filter by status"
    ),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List projects accessible to current user
    """
    try:

        project_service = ProjectService(db)
        projects = await project_service.list_projects(
            user_id=int(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_params=ProjectSearchRequest(
                search_text=search_text, project_status=project_status
            ),
        )

        return [
            ProjectResponse.model_validate(project) for project in projects
        ]

    except Exception as e:
        logger.error("Error listing projects: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects",
        ) from e


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get project by ID
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.check_project_access(
            project_id, int(str(current_user.id))
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return ProjectResponse.model_validate(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project",
        ) from e


@router.post(
    "/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED
)
async def create_project(
    project_data: ProjectCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create a new project
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.create_project(
            project_data, int(str(current_user.id))
        )

        logger.info(
            "Project created by %s: %s", current_user.name, project.name
        )

        return ProjectResponse.model_validate(project)

    except Exception as e:
        logger.error("Error creating project: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        ) from e


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Update project
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.update_project(
            project_id, project_data, int(str(current_user.id))
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        logger.info(
            "Project updated by %s: %s", current_user.name, project.name
        )

        return ProjectResponse.model_validate(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating project %s: %s", project_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project",
        ) from e


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Delete project
    """
    try:
        project_service = ProjectService(db)
        success = await project_service.delete_project(
            project_id, int(str(current_user.id))
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        logger.info("Project deleted by %s: %s", current_user.name, project_id)

        return {"message": "Project deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting project %s: %s", project_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project",
        ) from e


@router.get(
    "/{project_id}/members", response_model=List[ProjectMemberResponse]
)
async def list_project_members(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List project members
    """
    try:
        project_service = ProjectService(db)
        members = await project_service.list_project_members(
            project_id, int(str(current_user.id))
        )

        return [
            ProjectMemberResponse.model_validate(member) for member in members
        ]

    except Exception as e:
        logger.error("Error listing project members: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project members",
        ) from e
