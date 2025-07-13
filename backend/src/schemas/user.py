# backend/src/schemas/user.py
"""
사용자 Pydantic 스키마

사용자 관리를 위한 요청/응답 스키마
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

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

    id: UUID = Field(..., description="사용자 ID")
    email: EmailStr = Field(..., description="이메일 주소")
    username: str = Field(..., description="사용자명")
    full_name: Optional[str] = Field(None, description="전체 이름")
    role: str = Field(..., description="사용자 역할")
    status: str = Field(..., description="사용자 상태")
    bio: Optional[str] = Field(None, description="자기소개")
    phone: Optional[str] = Field(None, description="전화번호")
    department: Optional[str] = Field(None, description="부서")
    position: Optional[str] = Field(None, description="직급")
    timezone: Optional[str] = Field(None, description="시간대")
    language: Optional[str] = Field(None, description="언어")
    avatar_url: Optional[str] = Field(None, description="아바타 URL")
    last_login: Optional[datetime] = Field(None, description="마지막 로그인 시간")
    is_active: bool = Field(..., description="활성 상태")
    is_email_verified: bool = Field(default=False, description="이메일 인증 여부")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")

    class Config:
        """UserResponse 설정"""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "john_doe",
                "full_name": "홍길동",
                "role": "developer",
                "status": "active",
                "bio": "백엔드 개발자",
                "phone": "010-1234-5678",
                "department": "개발팀",
                "position": "시니어 개발자",
                "timezone": "Asia/Seoul",
                "language": "ko",
                "avatar_url": "https://example.com/avatar.jpg",
                "last_login": "2025-07-13T10:00:00Z",
                "is_active": True,
                "is_email_verified": True,
                "created_at": "2025-07-01T10:00:00Z",
                "updated_at": "2025-07-13T10:00:00Z",
            }
        }

    def to_dict(self) -> dict:
        """딕셔너리로 변환"""
        return self.model_dump()

    @property
    def display_name(self) -> str:
        """표시용 이름 반환"""
        return self.full_name or self.username

    @property
    def is_admin(self) -> bool:
        """관리자 권한 확인"""
        return self.role in [UserRole.ADMIN, UserRole.DEVELOPER]

    @property
    def is_manager(self) -> bool:
        """매니저 권한 확인"""
        return self.role in [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOPER]


class UserPublic(BaseModel):
    """공개 사용자 정보 스키마"""

    id: UUID
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

    id: UUID
    user_id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime

    class Config:
        """모델 직렬화 설정"""

        from_attributes = True


class UserListResponse(BaseModel):
    """사용자 목록 응답 스키마"""

    users: List[UserResponse]
    page_no: int = Field(..., ge=0, description="현재 페이지 번호")
    page_size: int = Field(..., ge=1, le=100, description="페이지 크기")
    total_pages: int = Field(..., ge=0, description="전체 페이지 수")
    total_items: int = Field(..., ge=0, description="전체 항목 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

    @classmethod
    def create_response(
        cls,
        users: List[UserResponse],
        page_no: int,
        page_size: int,
        total_items: int,
    ) -> "UserListResponse":
        """UserListResponse 생성 헬퍼 메서드"""
        total_pages = (
            (total_items + page_size - 1) // page_size if total_items > 0 else 0
        )
        has_next = page_no < total_pages - 1 if total_pages > 0 else False
        has_prev = page_no > 0

        return cls(
            users=users,
            page_no=page_no,
            page_size=page_size,
            total_pages=total_pages,
            total_items=total_items,
            has_next=has_next,
            has_prev=has_prev,
        )

    class Config:
        """ProjectListResponse 설정"""

        from_attributes = True


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
