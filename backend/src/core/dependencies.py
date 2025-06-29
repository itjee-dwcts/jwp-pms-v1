"""
FastAPI Dependencies

Common dependencies for authentication, database, and permissions.
"""

import logging
from typing import Optional

from core.constants import UserRole
from core.database import get_async_session
from core.security import TokenData, decode_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models.project import ProjectMember
from models.task import Task, TaskAssignment
from models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> Optional[User]:
    """
    Get current user from JWT token
    """
    if not credentials:
        return None

    try:
        # Decode JWT token
        token_data: TokenData = decode_access_token(credentials.credentials)

        if token_data.sub is None:
            raise ValueError("Token data is missing 'sub' claim")

        # Get user from database
        result = await db.execute(
            select(User).where(User.id == int(token_data.sub))
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(
                "User not found for token subject: %s", token_data.sub
            )
            return None

        user_is_active = getattr(user, "is_active", False)
        if not user_is_active:
            logger.warning("Inactive user attempted access: %s", user.id)
            return None

        # Update last active timestamp
        user.update_last_active()
        await db.commit()

        return user

    except Exception as e:
        logger.warning("Token validation failed: %s", e)
        return None


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> User:
    """
    Get current active user (raises exception if not authenticated)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current admin user (raises exception if not admin)
    """
    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    if current_user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user


def require_role(required_role: str):
    """
    Dependency factory for role-based access control
    """

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not has_role(current_user, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required",
            )
        return current_user

    return role_checker


def require_any_role(*required_roles: str):
    """
    Dependency factory for multiple role-based access control
    """

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not any(has_role(current_user, role) for role in required_roles):
            roles_str = ", ".join(required_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these roles required: {roles_str}",
            )
        return current_user

    return role_checker


def has_role(user: User, required_role: str) -> bool:
    """
    Check if user has the required role
    """
    # Role hierarchy: Admin > Project Manager > Developer > Viewer
    role_hierarchy = {
        UserRole.ADMIN: 0,
        UserRole.MANAGER: 1,
        UserRole.DEVELOPER: 2,
        UserRole.VIEWER: 3,
    }

    role = getattr(user, "role", UserRole.GUEST)
    user_level = role_hierarchy.get(role, 0)
    required_level = role_hierarchy.get(required_role, 0)

    return user_level >= required_level


def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to require admin role
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    if current_user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def require_project_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to require project manager role or higher
    """
    if not has_role(current_user, UserRole.MANAGER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project manager privileges required",
        )
    return current_user


def require_developer(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Dependency to require developer role or higher
    """
    if not has_role(current_user, UserRole.DEVELOPER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer privileges required",
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> Optional[User]:
    """
    Get current user optionally (doesn't raise exception if not authenticated)
    """
    return await get_current_user(credentials, db)


class RateLimiter:
    """
    Simple rate limiter dependency
    """

    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.requests = {}

    async def __call__(self, request):
        import time

        client_ip = request.client.host
        current_time = time.time()

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Remove old requests
        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if current_time - req_time < self.period
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )

        # Add current request
        self.requests[client_ip].append(current_time)


# Predefined rate limiters
rate_limit_auth = RateLimiter(calls=10, period=60)  # 10 calls per minute
rate_limit_api = RateLimiter(calls=100, period=60)  # 100 calls per minute
rate_limit_upload = RateLimiter(calls=5, period=60)  # 5 uploads per minute


async def verify_project_access(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> bool:
    """
    Verify user has access to a specific project
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    # Admin users have access to all projects
    if current_user_role == UserRole.ADMIN:
        return True

    # Check if user is a member of the project
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()

    return member is not None


async def verify_task_access(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> bool:
    """
    Verify user has access to a specific task
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)

    # Admin users have access to all tasks
    if current_user_role == UserRole.ADMIN:
        return True

    # Get task and check project membership
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        return False

    # Check if user is assigned to the task
    assignment_result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == current_user.id,
        )
    )
    assignment = assignment_result.scalar_one_or_none()

    if assignment:
        return True

    # Check if user is a member of the project
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    member = member_result.scalar_one_or_none()

    return member is not None


def create_access_checker(resource_type: str):
    """
    Factory function to create resource-specific access checkers
    """

    async def access_checker(
        resource_id: int,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_async_session),
    ) -> bool:
        if resource_type == "project":
            return await verify_project_access(resource_id, current_user, db)
        elif resource_type == "task":
            return await verify_task_access(resource_id, current_user, db)
        else:
            # Default: only allow access if user is admin
            current_user_role = getattr(current_user, "role", UserRole.GUEST)
            return current_user_role == UserRole.ADMIN

    return access_checker


# Convenience dependencies
require_project_access = create_access_checker("project")
require_task_access = create_access_checker("task")


async def get_pagination_params(
    page: int = 1,
    size: int = 20,
) -> dict:
    """
    Get pagination parameters with validation
    """
    if page < 1:
        page = 1
    if size < 1:
        size = 1
    if size > 100:
        size = 100

    return {
        "skip": (page - 1) * size,
        "limit": size,
        "page": page,
        "size": size,
    }


async def get_sort_params(
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    """
    Get sorting parameters with validation
    """
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "desc"

    return {
        "sort_by": sort_by,
        "sort_order": sort_order.lower(),
    }
