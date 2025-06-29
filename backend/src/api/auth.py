"""
Authentication API Routes

User authentication, registration, and token management endpoints.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User, UserRole, UserStatus
from schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    UserResponse,
)
from services.user import UserService
from utils.auth import AuthManager, get_password_hash

logger = logging.getLogger(__name__)
router = APIRouter()


class AuthenticationError(Exception):
    """Custom authentication error"""


class RegistrationError(Exception):
    """Custom registration error"""


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Register a new user
    """
    try:
        user_service = UserService(db)

        # Check if user already exists
        existing_user = await user_service.get_user_by_email_or_username(
            user_data.email, user_data.username
        )

        if existing_user:
            raise RegistrationError(
                "User with this email or username already exists"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)

        new_user = User(
            name=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            password=hashed_password,
            role=UserRole.DEVELOPER,
            status=UserStatus.ACTIVE,
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow(),
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        logger.info("New user registered: %s", new_user.name)

        return UserResponse.from_orm(new_user)

    except RegistrationError as e:
        logger.warning("Registration failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        logger.error("Registration error: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        ) from e


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
):
    """
    User login with username/email and password
    """
    try:
        user_service = UserService(db)

        # Verify credentials
        user = await user_service.verify_user_credentials(
            login_data.username, login_data.password
        )

        if not user:
            raise AuthenticationError("Invalid credentials")

        user_id = getattr(user, "id", None)
        if not user_id:
            raise AuthenticationError("User ID not found")

        # Create tokens using AuthManager
        tokens = AuthManager.create_tokens(user)

        # Update last login
        client_ip = request.client.host if request.client else "unknown"
        await user_service.update_last_login(user_id, client_ip)

        # Prepare response
        user_response = UserResponse.from_orm(user)

        logger.info("User logged in: %s", user.name)

        return LoginResponse(
            access_token=str(tokens["access_token"]),
            refresh_token=str(tokens["refresh_token"]),
            token_type=str(tokens["token_type"]),
            expires_in=int(tokens["expires_in"]),
            user=user_response,
        )

    except AuthenticationError as exc:
        logger.warning("Login failed for: %s", login_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from exc
    except Exception as e:
        logger.error("Login error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        ) from e


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Refresh access token using refresh token
    """
    try:
        tokens = AuthManager.refresh_tokens(refresh_data.refresh_token)

        return RefreshTokenResponse(
            access_token=str(tokens["access_token"]),
            refresh_token=str(tokens["refresh_token"]),
            token_type=str(tokens["token_type"]),
            expires_in=int(tokens["expires_in"]),
        )

    except Exception as e:
        logger.warning("Token refresh failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from e


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    User logout (token invalidation would be handled by client-side
    token removal)
    """
    # In a production system, you might want to maintain a blacklist of tokens
    # or store session information in the database to handle logout properly

    logger.info("User logged out: %s", current_user.name)

    return JSONResponse(
        content={
            "message": "Successfully logged out",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user profile
    """
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Update current user profile
    """
    try:
        # Update allowed fields
        allowed_fields = [
            "full_name",
            "bio",
            "phone",
            "department",
            "position",
        ]

        for field, value in user_data.items():
            if field in allowed_fields and hasattr(current_user, field):
                setattr(current_user, field, value)

        setattr(current_user, "updated_by", current_user.id)
        setattr(current_user, "updated_at", datetime.now(timezone.utc))
        # current_user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(current_user)

        logger.info("User profile updated: %s", current_user.name)

        return UserResponse.from_orm(current_user)

    except Exception as e:
        logger.error("Profile update error: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed",
        ) from e
