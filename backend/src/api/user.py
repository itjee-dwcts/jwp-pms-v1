"""
Users API Routes

User management endpoints for administrators.
"""

import logging
from typing import List, Optional

from core.database import get_async_session
from core.dependencies import get_current_active_user, require_admin
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.user import User
from schemas.auth import UserResponse
from schemas.user import UserCreateRequest, UserUpdateRequest
from services.user import UserService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    page_no: int = Query(0, ge=0, description="Number of records to skip"),
    page_size: int = Query(
        50, ge=1, le=100, description="Number of records to return"
    ),
    search_text: Optional[str] = Query(
        None, description="Search by name or email"
    ),
    user_role: Optional[str] = Query(None, description="Filter by role"),
    user_status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List users with optional filtering and pagination
    """
    try:
        user_service = UserService(db)
        users = await user_service.list_users(
            page_no=page_no,
            page_size=page_size,
            search_text=search_text,
            user_role=user_role,
            user_status=user_status,
        )

        return [UserResponse.model_validate(user) for user in users]

    except Exception as e:
        logger.error("Error listing users: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users",
        ) from e


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get user by ID
    """
    try:
        user_service = UserService(db)
        user = await user_service.get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user",
        ) from e


@router.post(
    "/", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create a new user (admin only)
    """
    try:
        user_service = UserService(db)

        # Check if user already exists
        existing_user = await user_service.get_user_by_email_or_username(
            user_data.email, user_data.username
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists",
            )

        user = await user_service.create_user(
            user_data, created_by=int(str(current_user.id))
        )

        logger.info(f"User created by admin {current_user.name}: {user.name}")

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating user: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        ) from e


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Update user (admin only)
    """
    try:
        user_service = UserService(db)
        user = await user_service.update_user(
            user_id, user_data, updated_by=int(str(current_user.id))
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        logger.info(
            "User updated by admin %s: %s", current_user.name, user.name
        )

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating user %s: %s", user_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user",
        ) from e


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Delete user (admin only)
    """
    try:
        user_service = UserService(db)
        success = await user_service.delete_user(
            user_id, int(str(current_user.id))
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        logger.info("User deleted by admin %s: %s", current_user.name, user_id)

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting user %s: %s", user_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        ) from e


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)
