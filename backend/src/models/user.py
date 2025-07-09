"""
사용자 모델

사용자 관리 및 인증을 위한 SQLAlchemy 모델
"""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from constants.user import UserRole, UserStatus
from core.base import Base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

if TYPE_CHECKING:
    pass


class User(Base):
    """
    인증 및 프로필 관리를 위한 사용자 모델
    """

    __tablename__ = "users"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="사용자 ID"
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="사용자 생성 타임스탬프",
    )
    created_by = Column(Integer, nullable=True, doc="이 사용자를 생성한 사용자")
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="사용자 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        Integer, nullable=True, doc="이 사용자를 마지막으로 업데이트한 사용자"
    )

    # 기본 정보
    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="사용자 이메일 주소 (고유)",
    )
    full_name = Column(String(200), nullable=True, doc="사용자 전체 이름")

    # 인증 정보
    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
        doc="사용자명 (고유)",
    )
    password = Column(String(255), nullable=False, doc="해시된 비밀번호")
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="사용자 계정 활성화 여부",
    )
    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="사용자 이메일 인증 여부",
    )

    # 프로필 정보
    role = Column(
        String(20),  # SQLEnum(UserRole),
        default=UserRole.DEVELOPER,
        nullable=False,
        doc="시스템에서의 사용자 역할",
    )
    status = Column(
        String(20),  # SQLEnum(UserStatus),
        default=UserStatus.PENDING,
        nullable=False,
        doc="사용자 계정 상태",
    )
    avatar_url = Column(String(500), nullable=True, doc="사용자 아바타 이미지 URL")
    bio = Column(Text, nullable=True, doc="사용자 자기소개")

    # 연락처 정보
    phone = Column(String(20), nullable=True, doc="전화번호")
    department = Column(String(100), nullable=True, doc="사용자 부서")
    position = Column(String(100), nullable=True, doc="사용자 직급")

    # OAuth 정보
    google_id = Column(String(100), nullable=True, index=True, doc="Google OAuth ID")
    github_id = Column(String(100), nullable=True, index=True, doc="GitHub OAuth ID")

    # 활동 추적
    last_login = Column(
        DateTime(timezone=True), nullable=True, doc="마지막 로그인 타임스탬프"
    )
    last_active = Column(
        DateTime(timezone=True), nullable=True, doc="마지막 활동 타임스탬프"
    )

    # 관계
    created_projects = relationship(
        "Project", back_populates="owner", foreign_keys="Project.owner_id"
    )

    project_memberships = relationship("ProjectMember", back_populates="user")

    task_assignments = relationship("TaskAssignment", back_populates="assignee")

    created_tasks = relationship(
        "Task", back_populates="owner", foreign_keys="Task.owner_id"
    )

    calendars = relationship("Calendar", back_populates="owner")

    created_events = relationship(
        "Event", back_populates="creator", foreign_keys="Event.creator_id"
    )

    activity_logs = relationship("UserActivityLog", back_populates="user")

    # 제약 조건
    __table_args__ = (
        UniqueConstraint("email", name="ux_users__email"),
        UniqueConstraint("username", name="ux_users__username"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    def update_last_active(self):
        """마지막 활동 타임스탬프를 현재 시간으로 업데이트"""
        self.last_active = datetime.now(timezone.utc)

    def is_admin(self) -> bool:
        """사용자가 관리자인지 확인"""
        return self.role in [UserRole.ADMIN]

    def is_manager_or_admin(self) -> bool:
        """사용자가 매니저 또는 관리자인지 확인"""
        return self.role in [UserRole.ADMIN, UserRole.MANAGER]

    def can_manage_users(self) -> bool:
        """사용자가 다른 사용자를 관리할 수 있는지 확인"""
        return self.role in [UserRole.ADMIN]

    def can_create_projects(self) -> bool:
        """사용자가 프로젝트를 생성할 수 있는지 확인"""
        return self.role in [UserRole.ADMIN, UserRole.MANAGER]

    def can_manage_project(self, project) -> bool:
        """사용자가 특정 프로젝트를 관리할 수 있는지 확인"""
        if self.is_admin():
            return True

        # 프로젝트 소유자인지 확인
        if project.owner_id == self.id:
            return True

        # 프로젝트 매니저인지 확인
        for membership in self.project_memberships:
            if (
                membership.project_id == project.id
                and membership.role in ["OWNER", "MANAGER"]
                and membership.is_active
            ):
                return True

        return False

    def get_project_role(self, project_id: str) -> str:
        """특정 프로젝트에서의 사용자 역할 조회"""
        for membership in self.project_memberships:
            if membership.project_id == project_id and membership.is_active:
                return membership.role
        return "NONE"


class UserActivityLog(Base):
    """
    사용자 활동 로깅 모델
    """

    __tablename__ = "user_activity_logs"

    # 고유 식별자 및 타임스탬프
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="로그 ID")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        doc="로그 항목의 타임스탬프",
    )
    created_by = Column(Integer, nullable=True, doc="이 로그 항목을 생성한 사용자")

    # 기본 정보
    user_id = Column(
        Integer,
        nullable=False,
        index=True,
        doc="작업을 수행한 사용자 ID",
    )
    action = Column(
        String(100),
        nullable=False,
        doc="수행된 작업 (예: '로그인', '프로젝트_생성')",
    )
    resource_type = Column(
        String(50),
        nullable=True,
        doc="영향을 받은 리소스 유형 (예: '프로젝트', '작업')",
    )
    resource_id = Column(String(50), nullable=True, doc="영향을 받은 리소스 ID")
    description = Column(Text, nullable=True, doc="작업에 대한 상세 설명")

    # 메타데이터
    ip_address = Column(
        String(45),
        nullable=True,
        doc="작업이 수행된 IP 주소",
    )
    user_agent = Column(String(500), nullable=True, doc="사용자 에이전트 문자열")
    extra_data = Column(Text, nullable=True, doc="JSON 문자열로 저장된 추가 메타데이터")

    # 관계
    user = relationship("User", back_populates="activity_logs")

    def __repr__(self) -> str:
        return (
            f"<UserActivityLog(id={self.id}, user_id={self.user_id}, "
            f"action='{self.action}')>"
        )


class UserSession(Base):
    """
    사용자 세션 관리 모델
    """

    __tablename__ = "user_sessions"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="세션 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        doc="세션 생성 타임스탬프",
    )
    created_by = Column(Integer, nullable=True, doc="이 세션을 생성한 사용자")

    # 기본 정보
    user_id = Column(String(50), nullable=False, index=True, doc="사용자 ID")
    session_token = Column(String(255), unique=True, nullable=False, doc="세션 토큰")
    refresh_token = Column(String(255), unique=True, nullable=True, doc="갱신 토큰")
    expires_at = Column(DateTime(timezone=True), nullable=False, doc="세션 만료 시간")
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="세션 활성화 여부",
    )

    # 메타데이터
    ip_address = Column(String(45), nullable=True, doc="세션의 IP 주소")
    user_agent = Column(String(500), nullable=True, doc="사용자 에이전트 문자열")

    # 관계
    user = relationship("User")

    def __repr__(self) -> str:
        return (
            f"<UserSession(id={self.id}, user_id={self.user_id}, "
            f"expires_at={self.expires_at})>"
        )

    def revoke(self):
        """세션 취소"""
        self.is_active = False

    def is_expired(self) -> bool:
        """세션이 만료되었는지 확인"""
        return bool(datetime.now(timezone.utc) > self.expires_at)

    def is_valid(self) -> bool:
        """세션이 유효한지 확인 (활성화되어 있고 만료되지 않음)"""
        return bool(self.is_active and not self.is_expired())
