"""
Authentication Schemas

Pydantic models for authentication-related requests and responses.
"""

from datetime import datetime
from typing import Annotated, Any, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """Login request schema"""

    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1)
    remember_me: bool = False

    class Config:
        """Configuration for the LoginRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "username": "john_doe",
                "password": "secretpassword123",
                "remember_me": False,
            }
        }


class LoginResponse(BaseModel):
    """Login response schema"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"

    class Config:
        """Configuration for the LoginResponse schema"""

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
                    "full_name": "John Doe",
                },
            }
        }


class RegisterRequest(BaseModel):
    """User registration request schema"""

    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate username format"""
        if not v.isalnum() and "_" not in v:
            raise ValueError(
                "Username must contain only letters, numbers, and underscores"
            )
        return v.lower()

    @field_validator("confirm_password", mode="before")
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """Validate that passwords match"""
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

    class Config:
        """Configuration for the RegisterRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "password": "securePassword123!",
                "confirm_password": "securePassword123!",
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""

    refresh_token: str

    class Config:
        """Configuration for the RefreshTokenRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}
        }


class RefreshTokenResponse(BaseModel):
    """Refresh token response schema"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    class Config:
        """Configuration for the RefreshTokenResponse schema"""

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
    """Logout request schema"""

    refresh_token: Optional[str] = None
    logout_all_devices: bool = False

    class Config:
        """Configuration for the LogoutRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "logout_all_devices": False,
            }
        }


class PasswordChangeRequest(BaseModel):
    """Password change request schema"""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("confirm_new_password", mode="before")
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """Validate that new passwords match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("New passwords do not match")
        return v

    class Config:
        """Configuration for the PasswordChangeRequest schema"""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "current_password": "oldPassword123!",
                "new_password": "newSecurePassword456!",
                "confirm_new_password": "newSecurePassword456!",
            }
        }


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""

    email: EmailStr

    class Config:
        """Configuration for the PasswordResetRequest schema"""

        from_attributes = True
        json_schema_extra = {"example": {"email": "john@example.com"}}


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""

    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @field_validator(
        "confirm_password",
        mode="before",
    )
    @classmethod
    def passwords_match(cls, v: str, values: Any) -> str:
        """Validate that passwords match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    class Config:
        """Configuration for the PasswordResetConfirm schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "token": "reset-token-here",
                "new_password": "newSecurePassword789!",
                "confirm_password": "newSecurePassword789!",
            }
        }


class Token(BaseModel):
    """Token schema"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema with user information"""

    # Standard JWT claims
    sub: Optional[str] = None  # Subject (typically user ID as string)
    exp: Optional[datetime] = None  # Expiration time
    iat: Optional[datetime] = None  # Issued at time
    type: Optional[str] = None  # Token type (access, refresh, etc.)

    # User information fields
    user_id: Optional[int] = None  # User ID
    username: Optional[str] = None  # Username
    email: Optional[str] = None  # User email
    role: Optional[str] = None  # User role
    scopes: Optional[List[str]] = None  # User permissions/scopes

    class Config:
        """Configuration for the TokenData schema"""

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
                "role": "developer",
                "scopes": ["projects:read", "tasks:write"],
            }
        }


class TokenRefresh(BaseModel):
    """Token refresh schema"""

    refresh_token: str


class UserResponse(BaseModel):
    """User response schema for authentication"""

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
        """Configuration for the UserResponse schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "role": "developer",
                "status": "active",
                "is_active": True,
                "is_verified": True,
                "created_at": "2023-01-01T00:00:00Z",
                "last_active": "2023-12-01T10:30:00Z",
            }
        }


class EmailVerificationRequest(BaseModel):
    """Email verification request schema"""

    email: EmailStr

    class Config:
        """Configuration for the EmailVerificationRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"email": "john@example.com"}
        }


class EmailVerificationConfirm(BaseModel):
    """Email verification confirmation schema"""

    token: str

    class Config:
        """Configuration for the EmailVerificationConfirm schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {"token": "verification-token-here"}
        }


class AuthenticationError(BaseModel):
    """Authentication error response schema"""

    detail: str
    error_code: str
    timestamp: datetime

    class Config:
        """Configuration for the AuthenticationError schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "detail": "Invalid credentials",
                "error_code": "AUTHENTICATION_ERROR",
                "timestamp": "2023-12-01T10:30:00Z",
            }
        }


class OAuthLoginRequest(BaseModel):
    """OAuth login request schema"""

    provider: Annotated[str, Field(pattern="^(google|github)$")]
    code: str
    state: Optional[str] = None

    class Config:
        """Configuration for the OAuthLoginRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {
            "example": {
                "provider": "google",
                "code": "oauth-authorization-code",
                "state": "random-state-string",
            }
        }


class TwoFactorAuthRequest(BaseModel):
    """Two-factor authentication request schema"""

    token: str = Field(..., min_length=6, max_length=6)

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        """Validate 2FA token is numeric"""
        if not v.isdigit():
            raise ValueError("Token must be 6 digits")
        return v

    class Config:
        """Configuration for the TwoFactorAuthRequest schema"""

        from_attributes = True
        json_schema_extra: dict[str, dict[str, Any]] = {"example": {"token": "123456"}}


class SessionInfo(BaseModel):
    """Session information schema"""

    session_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_active: datetime
    is_current: bool

    class Config:
        """Configuration for the SessionInfo schema"""

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
    """User login history schema"""

    id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    created_at: datetime

    class Config:
        """Configuration for the UserLoginHistory schema"""

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
