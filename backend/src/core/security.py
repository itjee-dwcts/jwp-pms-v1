"""
보안 및 인증 유틸리티

JWT 토큰 처리, 비밀번호 해싱, 인증 관리를 위한 모듈입니다.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

import jwt
from fastapi import HTTPException, status
from jwt import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

from core.config import settings

logger = logging.getLogger(__name__)

# 비밀번호 해싱을 위한 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """토큰 데이터 모델"""

    sub: Optional[str] = None
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None
    type: Optional[str] = None


class AuthManager:
    """토큰 처리를 위한 인증 관리자"""

    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        """JWT 액세스 토큰 생성"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.access_token_expire_minutes
            )

        to_encode.update(
            {
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "access",
            }
        )

        encoded_jwt = jwt.encode(
            to_encode,
            self.secret_key,
            algorithm=self.algorithm,
        )
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """JWT 리프레시 토큰 생성"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            days=self.refresh_token_expire_days
        )

        to_encode.update(
            {
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "refresh",
            }
        )

        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def decode_token(self, token: str) -> TokenData:
        """JWT 토큰 디코딩"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return TokenData(**payload)
        except InvalidTokenError as e:
            logger.warning("토큰 디코딩 오류: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="자격 증명을 검증할 수 없습니다",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e


# 전역 인증 관리자 인스턴스
auth_manager = AuthManager()


def get_password_hash(password: str) -> str:
    """bcrypt를 사용하여 비밀번호 해싱"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호를 해시와 비교하여 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """액세스 토큰 생성"""
    return auth_manager.create_access_token(data, expires_delta)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """리프레시 토큰 생성"""
    return auth_manager.create_refresh_token(data)


def decode_access_token(token: str) -> TokenData:
    """액세스 토큰 디코딩"""
    token_data = auth_manager.decode_token(token)

    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 토큰 타입입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def decode_refresh_token(token: str) -> TokenData:
    """리프레시 토큰 디코딩"""
    token_data = auth_manager.decode_token(token)

    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 토큰 타입입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def generate_password_reset_token(email: str) -> str:
    """비밀번호 재설정 토큰 생성"""
    delta = timedelta(hours=1)  # 재설정 토큰은 1시간 후 만료
    now = datetime.now(timezone.utc)
    expires = now + delta

    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """비밀번호 재설정 토큰 검증 후 이메일 반환"""
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if decoded_token.get("type") != "password_reset":
            return None

        return decoded_token.get("sub")
    except InvalidTokenError:
        return None


def generate_email_verification_token(email: str) -> str:
    """이메일 인증 토큰 생성"""
    delta = timedelta(days=7)  # 인증 토큰은 7일 후 만료
    now = datetime.now(timezone.utc)
    expires = now + delta

    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "email_verification"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_email_verification_token(token: str) -> Optional[str]:
    """이메일 인증 토큰 검증 후 이메일 반환"""
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if decoded_token.get("type") != "email_verification":
            return None

        return decoded_token.get("sub")
    except InvalidTokenError:
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
            "Content-Security-Policy": "default-src 'self'",
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
