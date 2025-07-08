# backend/src/schemas/user.py
"""
User Pydantic Schemas

Request/Response schemas for user management.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.constants import UserRole, UserStatus


class UserBase(BaseModel):
    """Base user schema"""

    email: EmailStr = Field(..., description="Email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, description="Password")
    full_name: Optional[str] = Field(None, max_length=200, description="Full name")
    role: str = Field(UserRole.DEVELOPER, description="User role")
    status: str = Field(UserStatus.ACTIVE, description="User status")
    is_active: bool = Field(True, description="User active status")

    @field_validator("username")
    @classmethod
    def name_alphanumeric(cls, v):
        """Validate that username is alphanumeric with optional _ or -"""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric with optional _ or -")
        return v


class UserCreateRequest(UserBase):
    """Schema for creating a user"""

    password: str = Field(..., min_length=8, description="Password")
    confirm_password: str = Field(..., description="Password confirmation")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """Validate that password and confirm_password match"""
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdateRequest(BaseModel):
    """Schema for updating a user"""

    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = None
    position: Optional[str] = None
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    status: str = Field(UserStatus.ACTIVE, description="User account status")
    role: str = Field(UserRole.DEVELOPER, description="User role")
    is_active: bool = Field(True, description="User active status")


class UserPasswordChangeRequest(BaseModel):
    """Schema for changing user password"""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="New password confirmation")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """Validate that password and confirm_password match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(UserBase):
    """Schema for user response"""

    id: int
    role: str
    status: str
    bio: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    is_email_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for model serialization"""

        from_attributes = True


class UserPublic(BaseModel):
    """Public user information schema"""

    id: int
    name: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        """Configuration for model serialization"""

        from_attributes = True


class UserLoginRequest(BaseModel):
    """Schema for user login"""

    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")
    remember_me: bool = Field(default=False, description="Remember login")


class UserLoginResponse(BaseModel):
    """Schema for login response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UserRefreshToken(BaseModel):
    """Schema for token refresh"""

    refresh_token: str = Field(..., description="Refresh token")


class UserActivityLogResponse(BaseModel):
    """Schema for user activity log response"""

    id: int
    user_id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime

    class Config:
        """Configuration for model serialization"""

        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for user list response"""

    users: List[UserResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int


class UserStatsResponse(BaseModel):
    """Schema for user statistics"""

    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: dict
    users_by_status: dict


class UserProfileUpdateRequest(BaseModel):
    """Schema for updating user profile"""

    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserEmailVerification(BaseModel):
    """Schema for email verification"""

    token: str = Field(..., description="Email verification token")


class UserPasswordReset(BaseModel):
    """Schema for password reset request"""

    email: EmailStr = Field(..., description="User email address")


class UserPasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="New password confirmation")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """Validate that password and confirm_password match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserSessionResponse(BaseModel):
    """Schema for user session response"""

    id: int
    user_id: int
    session_token: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_activity: datetime
    expires_at: datetime

    class Config:
        """Configuration for model serialization"""

        from_attributes = True
