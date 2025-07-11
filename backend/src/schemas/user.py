# backend/src/schemas/user.py
"""
사용자 Pydantic 스키마

사용자 관리를 위한 요청/응답 스키마
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from constants.user import UserRole, UserStatus


class UserBase(BaseModel):
    """기본 사용자 스키마"""

    email: EmailStr = Field(..., description="이메일 주소")
    username: str = Field(..., min_length=3, max_length=50, description="사용자명")
    password: str = Field(..., min_length=8, description="비밀번호")
    full_name: Optional[str] = Field(None, max_length=200, description="전체 이름")
    role: str = Field(UserRole.DEVELOPER, description="사용자 역할")
    status: str = Field(UserStatus.ACTIVE, description="사용자 상태")
    is_active: bool = Field(True, description="사용자 활성 상태")

    @field_validator("username")
    @classmethod
    def name_alphanumeric(cls, v):
        """사용자명이 영숫자와 선택적 _ 또는 -인지 검증"""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("사용자명은 영숫자와 _ 또는 - 문자만 포함할 수 있습니다")
        return v


class UserCreateRequest(UserBase):
    """사용자 생성 스키마"""

    password: str = Field(..., min_length=8, description="비밀번호")
    confirm_password: str = Field(..., description="비밀번호 확인")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """비밀번호와 비밀번호 확인이 일치하는지 검증"""
        if "password" in values and v != values["password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        """비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")
        if not any(c.isupper() for c in v):
            raise ValueError("비밀번호는 최소 하나의 대문자를 포함해야 합니다")
        if not any(c.islower() for c in v):
            raise ValueError("비밀번호는 최소 하나의 소문자를 포함해야 합니다")
        if not any(c.isdigit() for c in v):
            raise ValueError("비밀번호는 최소 하나의 숫자를 포함해야 합니다")
        return v


class UserUpdateRequest(BaseModel):
    """사용자 업데이트 스키마"""

    full_name: Optional[str] = Field(None, max_length=100, description="전체 이름")
    bio: Optional[str] = Field(None, max_length=500, description="자기소개")
    phone: Optional[str] = Field(None, max_length=20, description="전화번호")
    department: Optional[str] = Field(None, description="부서")
    position: Optional[str] = Field(None, description="직급")
    timezone: Optional[str] = Field(None, max_length=50, description="시간대")
    language: Optional[str] = Field(None, max_length=10, description="언어")
    status: str = Field(UserStatus.ACTIVE, description="사용자 계정 상태")
    role: str = Field(UserRole.DEVELOPER, description="사용자 역할")
    is_active: bool = Field(True, description="사용자 활성 상태")


class UserPasswordChangeRequest(BaseModel):
    """사용자 비밀번호 변경 스키마"""

    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(..., min_length=8, description="새 비밀번호")
    confirm_password: str = Field(..., description="새 비밀번호 확인")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """비밀번호와 비밀번호 확인이 일치하는지 검증"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        """새 비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")
        if not any(c.isupper() for c in v):
            raise ValueError("비밀번호는 최소 하나의 대문자를 포함해야 합니다")
        if not any(c.islower() for c in v):
            raise ValueError("비밀번호는 최소 하나의 소문자를 포함해야 합니다")
        if not any(c.isdigit() for c in v):
            raise ValueError("비밀번호는 최소 하나의 숫자를 포함해야 합니다")
        return v


class UserResponse(UserBase):
    """사용자 응답 스키마"""

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
        """모델 직렬화 설정"""

        from_attributes = True


class UserPublic(BaseModel):
    """공개 사용자 정보 스키마"""

    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        """모델 직렬화 설정"""

        from_attributes = True


class UserLoginRequest(BaseModel):
    """사용자 로그인 스키마"""

    username: str = Field(..., description="사용자명 또는 이메일")
    password: str = Field(..., description="비밀번호")
    remember_me: bool = Field(default=False, description="로그인 유지")


class UserLoginResponse(BaseModel):
    """로그인 응답 스키마"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UserRefreshToken(BaseModel):
    """토큰 갱신 스키마"""

    refresh_token: str = Field(..., description="갱신 토큰")


class UserActivityLogResponse(BaseModel):
    """사용자 활동 로그 응답 스키마"""

    id: int
    user_id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime

    class Config:
        """모델 직렬화 설정"""

        from_attributes = True


class UserListResponse(BaseModel):
    """사용자 목록 응답 스키마"""

    users: List[UserResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int


class UserStatsResponse(BaseModel):
    """사용자 통계 스키마"""

    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: dict
    users_by_status: dict


class UserProfileUpdateRequest(BaseModel):
    """사용자 프로필 업데이트 스키마"""

    full_name: Optional[str] = Field(None, max_length=100, description="전체 이름")
    bio: Optional[str] = Field(None, max_length=500, description="자기소개")
    phone: Optional[str] = Field(None, max_length=20, description="전화번호")
    timezone: Optional[str] = Field(None, max_length=50, description="시간대")
    language: Optional[str] = Field(None, max_length=10, description="언어")
    avatar_url: Optional[str] = Field(None, max_length=500, description="아바타 URL")


class UserEmailVerification(BaseModel):
    """이메일 인증 스키마"""

    token: str = Field(..., description="이메일 인증 토큰")


class UserPasswordReset(BaseModel):
    """비밀번호 재설정 요청 스키마"""

    email: EmailStr = Field(..., description="사용자 이메일 주소")


class UserPasswordResetConfirm(BaseModel):
    """비밀번호 재설정 확인 스키마"""

    token: str = Field(..., description="비밀번호 재설정 토큰")
    new_password: str = Field(..., min_length=8, description="새 비밀번호")
    confirm_password: str = Field(..., description="새 비밀번호 확인")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, values):
        """비밀번호와 비밀번호 확인이 일치하는지 검증"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("비밀번호가 일치하지 않습니다")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        """새 비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError("비밀번호는 최소 8자 이상이어야 합니다")
        if not any(c.isupper() for c in v):
            raise ValueError("비밀번호는 최소 하나의 대문자를 포함해야 합니다")
        if not any(c.islower() for c in v):
            raise ValueError("비밀번호는 최소 하나의 소문자를 포함해야 합니다")
        if not any(c.isdigit() for c in v):
            raise ValueError("비밀번호는 최소 하나의 숫자를 포함해야 합니다")
        return v


class UserSessionResponse(BaseModel):
    """사용자 세션 응답 스키마"""

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
        """모델 직렬화 설정"""

        from_attributes = True
