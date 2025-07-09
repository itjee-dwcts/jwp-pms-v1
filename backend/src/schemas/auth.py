"""
인증 스키마

인증 관련 요청 및 응답을 위한 Pydantic 모델들입니다.
"""

from datetime import datetime
from typing import Annotated, Any, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """로그인 요청 스키마"""

    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)
    remember_me: bool = False

    class Config:
        """LoginRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "username": "john_doe",
                "password": "secretpassword123",
                "remember_me": False,
            }
        }


class LoginResponse(BaseModel):
    """로그인 응답 스키마"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "LoginUserResponse"

    class Config:
        """LoginResponse 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "id": 1,
                    "username": "john_doe",
                    "email": "john@example.com",
                    "full_name": "홍길동",
                },
            }
        }


class RegisterRequest(BaseModel):
    """사용자 등록 요청 스키마"""

    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """사용자명 형식 검증"""
        if not v.isalnum() and "_" not in v:
            raise ValueError("사용자명은 영문자, 숫자, 밑줄만 포함할 수 있습니다")
        return v.lower()

    @field_validator("confirm_password", mode="before")
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """비밀번호 일치 검증"""
        if "password" in values and v != values["password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v

    class Config:
        """RegisterRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "홍길동",
                "password": "securePassword123!",
                "confirm_password": "securePassword123!",
            }
        }


class RefreshTokenRequest(BaseModel):
    """리프레시 토큰 요청 스키마"""

    refresh_token: str

    class Config:
        """RefreshTokenRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}
        }


class RefreshTokenResponse(BaseModel):
    """리프레시 토큰 응답 스키마"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    class Config:
        """RefreshTokenResponse 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
            }
        }


class LogoutRequest(BaseModel):
    """로그아웃 요청 스키마"""

    refresh_token: Optional[str] = None
    logout_all_devices: bool = False

    class Config:
        """LogoutRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "logout_all_devices": False,
            }
        }


class PasswordChangeRequest(BaseModel):
    """비밀번호 변경 요청 스키마"""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("confirm_new_password", mode="before")
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """새 비밀번호 일치 검증"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("새 비밀번호가 일치하지 않습니다")
        return v

    class Config:
        """PasswordChangeRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "current_password": "oldPassword123!",
                "new_password": "newSecurePassword456!",
                "confirm_new_password": "newSecurePassword456!",
            }
        }


class PasswordResetRequest(BaseModel):
    """비밀번호 재설정 요청 스키마"""

    email: EmailStr

    class Config:
        """PasswordResetRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra = {"example": {"email": "john@example.com"}}


class PasswordResetConfirm(BaseModel):
    """비밀번호 재설정 확인 스키마"""

    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator(
        "confirm_password",
        mode="before",
    )
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """비밀번호 일치 검증"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v

    class Config:
        """PasswordResetConfirm 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "token": "reset-token-here",
                "new_password": "newSecurePassword789!",
                "confirm_password": "newSecurePassword789!",
            }
        }


class Token(BaseModel):
    """토큰 스키마"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """사용자 정보가 포함된 토큰 데이터 스키마"""

    # 표준 JWT 클레임
    sub: Optional[str] = None  # 주체 (일반적으로 사용자 ID를 문자열로)
    exp: Optional[datetime] = None  # 만료 시간
    iat: Optional[datetime] = None  # 발급 시간
    type: Optional[str] = None  # 토큰 유형 (access, refresh 등)

    # 사용자 정보 필드
    user_id: Optional[int] = None  # 사용자 ID
    username: Optional[str] = None  # 사용자명
    email: Optional[str] = None  # 사용자 이메일
    role: Optional[str] = None  # 사용자 역할
    scopes: Optional[List[str]] = None  # 사용자 권한/범위

    class Config:
        """TokenData 스키마 설정"""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "sub": "123",
                "exp": "2023-12-01T11:30:00Z",
                "iat": "2023-12-01T10:30:00Z",
                "type": "access",
                "user_id": 123,
                "username": "john_doe",
                "email": "john@example.com",
                "role": "개발자",
                "scopes": ["projects:read", "tasks:write"],
            }
        }


class TokenRefresh(BaseModel):
    """토큰 갱신 스키마"""

    refresh_token: str


class LoginUserResponse(BaseModel):
    """인증용 사용자 응답 스키마"""

    id: int
    username: str
    email: str
    full_name: str
    role: str
    status: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_active: Optional[datetime] = None

    class Config:
        """LoginUserResponse 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "홍길동",
                "role": "개발자",
                "status": "활성",
                "is_active": True,
                "is_verified": True,
                "created_at": "2023-01-01T00:00:00Z",
                "last_active": "2023-12-01T10:30:00Z",
            }
        }


class EmailVerificationRequest(BaseModel):
    """이메일 인증 요청 스키마"""

    email: EmailStr

    class Config:
        """EmailVerificationRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"email": "john@example.com"}
        }


class EmailVerificationConfirm(BaseModel):
    """이메일 인증 확인 스키마"""

    token: str

    class Config:
        """EmailVerificationConfirm 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"token": "verification-token-here"}
        }


class AuthenticationError(BaseModel):
    """인증 오류 응답 스키마"""

    detail: str
    error_code: str
    timestamp: datetime

    class Config:
        """AuthenticationError 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "detail": "잘못된 자격 증명",
                "error_code": "AUTHENTICATION_ERROR",
                "timestamp": "2023-12-01T10:30:00Z",
            }
        }


class OAuthLoginRequest(BaseModel):
    """OAuth 로그인 요청 스키마"""

    provider: Annotated[str, Field(pattern="^(google|github)$")]
    code: str
    state: Optional[str] = None

    class Config:
        """OAuthLoginRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "provider": "google",
                "code": "oauth-authorization-code",
                "state": "random-state-string",
            }
        }


class TwoFactorAuthRequest(BaseModel):
    """2단계 인증 요청 스키마"""

    token: str = Field(..., min_length=6, max_length=6)

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        """2FA 토큰이 숫자인지 검증"""
        if not v.isdigit():
            raise ValueError("토큰은 6자리 숫자여야 합니다")
        return v

    class Config:
        """TwoFactorAuthRequest 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {"example": {"token": "123456"}}


class SessionInfo(BaseModel):
    """세션 정보 스키마"""

    session_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_active: datetime
    is_current: bool

    class Config:
        """SessionInfo 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "session_id": "sess_abc123",
                "user_agent": "Mozilla/5.0...",
                "ip_address": "192.168.1.1",
                "created_at": "2023-12-01T09:00:00Z",
                "last_active": "2023-12-01T10:30:00Z",
                "is_current": True,
            }
        }


class UserLoginHistory(BaseModel):
    """사용자 로그인 기록 스키마"""

    id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    created_at: datetime

    class Config:
        """UserLoginHistory 스키마 설정"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "id": 1,
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "success": True,
                "created_at": "2023-12-01T10:30:00Z",
            }
        }
