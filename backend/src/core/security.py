"""
보안 및 인증 유틸리티

JWT 토큰 처리, 비밀번호 해싱, 권한 확인 유틸리티.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from constants.user import TokenType, UserRole
from core.config import settings
from models.user import User
from schemas.auth import TokenData

logger = logging.getLogger(__name__)

# 비밀번호 해싱 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer 토큰 스키마
security = HTTPBearer(auto_error=False)

# 역할 기반 권한 매핑
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    UserRole.ADMIN: [
        "users:read",
        "users:write",
        "users:delete",
        "projects:read",
        "projects:write",
        "projects:delete",
        "tasks:read",
        "tasks:write",
        "tasks:delete",
        "calendar:read",
        "calendar:write",
        "calendar:delete",
        "system:read",
        "system:write",
    ],
    UserRole.MANAGER: [
        "users:read",
        "projects:read",
        "projects:write",
        "tasks:read",
        "tasks:write",
        "tasks:delete",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.DEVELOPER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.TESTER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
    ],
    UserRole.CONTRIBUTOR: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.VIEWER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "calendar:read",
    ],
    UserRole.GUEST: [
        "projects:read",
        "tasks:read",
    ],
}


class AuthenticationError(Exception):
    """인증 관련 오류"""


class AuthorizationError(Exception):
    """권한 부여 관련 오류"""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """해시된 비밀번호에 대해 비밀번호 검증"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError) as e:
        logger.error("비밀번호 검증에 실패했습니다: %s", e)
        return False


def get_password_hash(password: str) -> str:
    """비밀번호 해시 생성"""
    try:
        return pwd_context.hash(password)
    except (ValueError, TypeError) as e:
        logger.error("비밀번호 해싱에 실패했습니다: %s", e)
        raise


def create_token(
    data: Dict[str, Any],
    token_type: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """지정된 유형과 만료 시간으로 JWT 토큰 생성"""
    try:
        to_encode = data.copy()
        now = datetime.now(timezone.utc)

        # UUID 객체를 문자열로 변환
        for key, value in to_encode.items():
            if isinstance(value, UUID):
                to_encode[key] = str(value)

        if expires_delta:
            expire = now + expires_delta
        else:
            # 토큰 유형에 따른 기본 만료 시간
            if token_type == TokenType.ACCESS:
                expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            elif token_type == TokenType.REFRESH:
                expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            elif token_type == TokenType.PASSWORD_RESET:
                expire = now + timedelta(hours=1)
            elif token_type == TokenType.EMAIL_VERIFICATION:
                expire = now + timedelta(days=7)
            else:
                expire = now + timedelta(minutes=30)  # 기본값

        to_encode.update({"exp": expire, "iat": now, "type": token_type})

        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )

        return encoded_jwt

    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s 토큰 생성에 실패했습니다: %s", token_type, e)
        raise


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """JWT 액세스 토큰 생성"""
    return create_token(data, TokenType.ACCESS, expires_delta)


def create_refresh_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """JWT 리프레시 토큰 생성"""
    return create_token(data, TokenType.REFRESH, expires_delta)


def verify_token(token: str, token_type: str = TokenType.ACCESS) -> Optional[TokenData]:
    """JWT 토큰 검증 및 디코딩"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        # 토큰 유형 확인
        if payload.get("type") != token_type:
            logger.warning(
                "토큰 유형이 일치하지 않습니다. 예상: %s, 실제: %s",
                token_type,
                payload.get("type"),
            )
            return None

        # 표준 JWT 클레임 추출
        sub = payload.get("sub")
        exp = payload.get("exp")
        iat = payload.get("iat")
        token_type_claim = payload.get("type")

        # 사용자 정보 추출
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        email: str = payload.get("email")
        role: str = payload.get("role")
        scopes: List[str] = payload.get("scopes", [])

        if user_id is None:
            logger.warning("토큰에 user_id가 없습니다")
            return None

        # 타임스탬프를 datetime으로 변환 (있는 경우)
        exp_datetime = None
        iat_datetime = None

        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
        if iat:
            iat_datetime = datetime.fromtimestamp(iat, tz=timezone.utc)

        return TokenData(
            sub=sub or str(user_id),
            exp=exp_datetime,
            iat=iat_datetime,
            type=token_type_claim,
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            scopes=scopes,
        )

    except jwt.ExpiredSignatureError:
        logger.warning("%s 토큰이 만료되었습니다", token_type)
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("잘못된 %s 토큰입니다: %s", token_type, e)
        return None
    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s 토큰 검증에 실패했습니다: %s", token_type, e)
        return None


def get_user_scopes(role: str) -> List[str]:
    """역할에 따른 사용자 범위 조회"""
    if not UserRole.is_valid(role):
        logger.warning("알 수 없는 역할입니다: %s", role)
        return ["projects:read", "tasks:read"]

    return ROLE_PERMISSIONS.get(role, ["projects:read", "tasks:read"])


def create_tokens_for_user(user: User) -> Dict[str, Union[str, int]]:
    """사용자를 위한 액세스 및 리프레시 토큰 생성"""
    try:
        if not hasattr(user, "role") or user.role is None:
            raise ValueError("사용자 역할이 없거나 잘못되었습니다.")

        # 역할이 유효한지 확인
        role_value = str(user.role)
        if not UserRole.is_valid(role_value):
            logger.warning(
                "잘못된 사용자 역할: %s, 기본값으로 설정: %s",
                role_value,
                UserRole.DEVELOPER,
            )
            role_value = UserRole.DEVELOPER

        # UUID를 문자열로 변환하여 토큰 페이로드 생성
        token_data = {
            "user_id": str(user.id) if isinstance(user.id, UUID) else user.id,
            "username": user.username,
            "email": user.email,
            "role": role_value,
            "scopes": get_user_scopes(role_value),
        }

        # 토큰 생성
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(
            {
                "user_id": str(user.id) if isinstance(user.id, UUID) else user.id,
                "role": role_value,
            }
        )

        logger.info("✅ 사용자 %s의 토큰이 성공적으로 생성되었습니다", user.username)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    except Exception as e:
        logger.error("❌ 사용자 %s의 토큰 생성에 실패했습니다: %s", str(user.id), e)
        raise


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[TokenData]:
    """토큰에서 현재 사용자 조회 (선택사항 - 토큰이 없어도 오류 없음)"""
    if not credentials:
        return None

    token_data = verify_token(credentials.credentials, TokenType.ACCESS)
    return token_data


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """토큰에서 현재 사용자 조회 (필수)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = verify_token(credentials.credentials, TokenType.ACCESS)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 인증 자격증명입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """현재 활성 사용자 조회 (여기에 추가 검증을 추가할 수 있음)"""
    return current_user


def require_permissions(required_permissions: List[str]):
    """특정 권한을 요구하는 데코레이터"""

    def permission_checker(
        current_user: TokenData = Depends(get_current_user),
    ) -> TokenData:
        if not current_user.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="할당된 권한이 없습니다",
            )

        for perm in required_permissions:
            if perm not in current_user.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"필요한 권한이 없습니다: {perm}",
                )

        return current_user

    return permission_checker


def require_roles(required_roles: List[str]):
    """특정 역할을 요구하는 데코레이터"""

    def role_checker(
        current_user: TokenData = Depends(get_current_user),
    ) -> TokenData:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="역할 권한이 부족합니다",
            )

        return current_user

    return role_checker


def check_permission(user_role: str, resource: str, action: str) -> bool:
    """사용자 역할이 리소스와 작업에 대한 권한을 가지고 있는지 확인"""
    user_scopes = get_user_scopes(user_role)
    required_scope = f"{resource}:{action}"
    return required_scope in user_scopes


def generate_special_token(
    user_id: int,
    token_type: str,
    additional_data: Optional[Dict[str, Any]] = None,
) -> str:
    """특수 목적 토큰 생성 (재설정, 인증 등)"""
    try:
        data = {
            "user_id": user_id,
            "type": token_type,
        }

        if additional_data:
            data.update(additional_data)

        return create_token(data, token_type)

    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s 토큰 생성에 실패했습니다: %s", token_type, e)
        raise


def verify_special_token(token: str, token_type: str) -> Optional[Dict[str, Any]]:
    """특수 목적 토큰 검증 및 페이로드 반환"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if payload.get("type") != token_type:
            return None

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("%s 토큰이 만료되었습니다", token_type)
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("잘못된 %s 토큰입니다: %s", token_type, e)
        return None
    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s 토큰 검증에 실패했습니다: %s", token_type, e)
        return None


class AuthManager:
    """향상된 인증 관리자 클래스"""

    @staticmethod
    def hash_password(password: str) -> str:
        """bcrypt를 사용한 비밀번호 해싱"""
        return get_password_hash(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """해시에 대한 비밀번호 검증"""
        return verify_password(password, hashed)

    @staticmethod
    def create_tokens(user: User) -> Dict[str, Union[str, int]]:
        """사용자를 위한 인증 토큰 생성"""
        return create_tokens_for_user(user)

    @staticmethod
    def refresh_tokens(refresh_token: str) -> Dict[str, Union[str, int]]:
        """리프레시 토큰을 사용하여 액세스 토큰 갱신"""
        try:
            # 리프레시 토큰 검증
            token_data = AuthManager.verify_refresh_token(refresh_token)

            if not token_data:
                raise AuthenticationError("잘못된 리프레시 토큰입니다")

            # 동일한 사용자 데이터로 새 토큰 생성
            user_data = {
                "user_id": token_data.user_id,
                "username": token_data.username,
                "email": token_data.email,
                "role": token_data.role,
                "scopes": token_data.scopes or [],
            }

            # 새 토큰 생성
            access_token = create_access_token(user_data)
            new_refresh_token = create_refresh_token(
                {"user_id": token_data.user_id, "role": token_data.role}
            )

            return {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            }

        except (jwt.PyJWTError, ValueError, TypeError) as e:
            logger.error("토큰 갱신에 실패했습니다: %s", e)
            raise AuthenticationError("토큰 갱신에 실패했습니다") from e

    @staticmethod
    def verify_access_token(token: str) -> Optional[TokenData]:
        """액세스 토큰 검증"""
        return verify_token(token, TokenType.ACCESS)

    @staticmethod
    def verify_refresh_token(token: str) -> Optional[TokenData]:
        """리프레시 토큰 검증"""
        return verify_token(token, TokenType.REFRESH)

    @staticmethod
    def generate_password_reset_token(user_id: int) -> str:
        """비밀번호 재설정 토큰 생성"""
        return generate_special_token(user_id, TokenType.PASSWORD_RESET)

    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[int]:
        """비밀번호 재설정 토큰 검증 및 사용자 ID 반환"""
        payload = verify_special_token(token, TokenType.PASSWORD_RESET)
        return payload.get("user_id") if payload else None

    @staticmethod
    def generate_email_verification_token(user_id: int, email: str) -> str:
        """이메일 인증 토큰 생성"""
        return generate_special_token(
            user_id, TokenType.EMAIL_VERIFICATION, {"email": email}
        )

    @staticmethod
    def verify_email_verification_token(
        token: str,
    ) -> Optional[Dict[str, Any]]:
        """이메일 인증 토큰 검증"""
        payload = verify_special_token(token, TokenType.EMAIL_VERIFICATION)
        if payload:
            return {
                "user_id": payload.get("user_id"),
                "email": payload.get("email"),
            }
        return None


class SecurityHeaders:
    """API 응답을 위한 보안 헤더"""

    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """보안 헤더 딕셔너리 반환"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self' http: https:",
        }


def check_password_strength(
    password: str,
) -> Dict[str, Union[bool, str, list[str]]]:
    """비밀번호 강도 확인 후 검증 결과 반환"""
    result: Dict[str, Union[bool, str, list[str]]] = {
        "is_valid": True,
        "message": "비밀번호가 강력합니다",
        "requirements": [],
    }

    requirements: list[str] = []

    if len(password) < 8:
        requirements.append("최소 8자 이상")

    if not any(c.isupper() for c in password):
        requirements.append("대문자 최소 1개")

    if not any(c.islower() for c in password):
        requirements.append("소문자 최소 1개")

    if not any(c.isdigit() for c in password):
        requirements.append("숫자 최소 1개")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        requirements.append("특수문자 최소 1개")

    if requirements:
        result["is_valid"] = False
        result["message"] = "비밀번호가 요구사항을 충족하지 않습니다"
        result["requirements"] = requirements

    return result


# 전역 인증 관리자 인스턴스
auth_manager = AuthManager()


# 하위 호환성을 위한 편의 함수
def require_scopes(required_scopes: List[str]):
    """하위 호환성 - 대신 require_permissions 사용"""
    return require_permissions(required_scopes)


def generate_reset_token(user_id: int) -> str:
    """하위 호환성"""
    return AuthManager.generate_password_reset_token(user_id)


def verify_reset_token(token: str) -> Optional[int]:
    """하위 호환성"""
    return AuthManager.verify_password_reset_token(token)


def generate_email_verification_token(user_id: int, email: str) -> str:
    """하위 호환성"""
    return AuthManager.generate_email_verification_token(user_id, email)


def verify_email_verification_token(token: str) -> Optional[Dict[str, Any]]:
    """하위 호환성"""
    return AuthManager.verify_email_verification_token(token)
