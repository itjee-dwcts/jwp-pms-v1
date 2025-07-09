"""
인증 API 라우트

사용자 인증, 등록, 토큰 관리 엔드포인트입니다.
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
    LoginUserResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
)
from services.user import UserService
from utils.auth import AuthManager, get_password_hash

logger = logging.getLogger(__name__)
router = APIRouter()


class AuthenticationError(Exception):
    """사용자 정의 인증 오류"""


class RegistrationError(Exception):
    """사용자 정의 회원가입 오류"""


@router.post(
    "/register",
    response_model=LoginUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    새로운 사용자 회원가입
    """
    try:
        user_service = UserService(db)

        # 사용자가 이미 존재하는지 확인
        existing_user = await user_service.get_user_by_email_or_username(
            user_data.email, user_data.username
        )

        if existing_user:
            raise RegistrationError("이미 존재하는 이메일 또는 사용자명입니다")

        # 새 사용자 생성
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

        logger.info("새 사용자 등록: %s", new_user.name)

        return LoginUserResponse.model_validate(new_user)

    except RegistrationError as e:
        logger.warning("회원가입 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        logger.error("회원가입 오류: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입에 실패했습니다",
        ) from e


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자명/이메일과 비밀번호로 로그인
    """
    try:
        user_service = UserService(db)

        # 자격 증명 확인
        user = await user_service.verify_user_credentials(
            login_data.username, login_data.password
        )

        if not user:
            raise AuthenticationError("잘못된 자격 증명입니다")

        user_id = getattr(user, "id", None)
        if not user_id:
            raise AuthenticationError("사용자 ID를 찾을 수 없습니다")

        # AuthManager를 사용해 토큰 생성
        tokens = AuthManager.create_tokens(user)

        # 마지막 로그인 업데이트
        client_ip = request.client.host if request.client else "unknown"
        await user_service.update_last_login(user_id, client_ip)

        # 응답 준비
        user_response = LoginUserResponse.model_validate(user)

        logger.info("사용자 로그인: %s", user.name)

        return LoginResponse(
            access_token=str(tokens["access_token"]),
            refresh_token=str(tokens["refresh_token"]),
            token_type=str(tokens["token_type"]),
            expires_in=int(tokens["expires_in"]),
            user=user_response,
        )

    except AuthenticationError as exc:
        logger.warning("로그인 실패: %s", login_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 자격 증명입니다",
        ) from exc
    except Exception as e:
        logger.error("로그인 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인에 실패했습니다",
        ) from e


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_async_session),
):
    """
    리프레시 토큰을 사용하여 액세스 토큰 갱신
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
        logger.warning("토큰 갱신 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 리프레시 토큰입니다",
        ) from e


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자 로그아웃 (토큰 무효화는 클라이언트 측 토큰 제거로 처리됨)
    """
    # 프로덕션 시스템에서는 토큰 블랙리스트를 유지하거나
    # 데이터베이스에 세션 정보를 저장하여 로그아웃을 적절히 처리할 수 있습니다

    logger.info("사용자 로그아웃: %s", current_user.name)

    return JSONResponse(
        content={
            "message": "성공적으로 로그아웃되었습니다",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@router.get("/me", response_model=LoginUserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    현재 사용자 프로필 조회
    """
    return LoginUserResponse.model_validate(current_user)


@router.put("/me", response_model=LoginUserResponse)
async def update_current_user_profile(
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    현재 사용자 프로필 수정
    """
    try:
        # 수정 가능한 필드
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

        current_user.updated_by = current_user.id
        current_user.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(current_user)

        logger.info("사용자 프로필 수정: %s", current_user.name)

        return LoginUserResponse.model_validate(current_user)

    except Exception as e:
        logger.error("프로필 수정 오류: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 수정에 실패했습니다",
        ) from e
