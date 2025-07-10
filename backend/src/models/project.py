"""
프로젝트 모델

프로젝트 관리를 위한 SQLAlchemy 모델
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from constants.project import ProjectMemberRole, ProjectPriority, ProjectStatus
from core.base import Base

if TYPE_CHECKING:
    pass


class Project(Base):
    """
    프로젝트 관리를 위한 프로젝트 모델
    """

    __tablename__ = "projects"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="프로젝트의 고유 식별자",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="프로젝트 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="프로젝트를 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="프로젝트 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="프로젝트를 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    name = Column(String(200), nullable=False, index=True, doc="프로젝트 이름")
    description = Column(Text, nullable=True, doc="프로젝트 설명")

    # 상태 및 우선순위
    status = Column(
        String(20),  # Enum(ProjectStatus),
        default=ProjectStatus.PLANNING,
        nullable=False,
        doc="프로젝트 상태",
    )
    priority = Column(
        String(20),  # Enum(ProjectPriority),
        default=ProjectPriority.MEDIUM,
        nullable=False,
        doc="프로젝트 우선순위",
    )

    # 일정
    start_date = Column(DateTime(timezone=True), nullable=True, doc="프로젝트 시작일")
    end_date = Column(DateTime(timezone=True), nullable=True, doc="프로젝트 종료일")
    actual_start_date = Column(
        DateTime(timezone=True), nullable=True, doc="실제 프로젝트 시작일"
    )
    actual_end_date = Column(
        DateTime(timezone=True), nullable=True, doc="실제 프로젝트 종료일"
    )

    # 진행률 및 예산
    progress = Column(
        Integer,
        default=0,
        nullable=False,
        doc="프로젝트 진행률 (0-100%)",
    )
    budget = Column(Numeric(15, 2), nullable=True, doc="프로젝트 예산")
    actual_cost = Column(
        Numeric(15, 2),
        default=Decimal("0.00"),
        nullable=False,
        doc="실제 프로젝트 비용",
    )

    # 소유권 및 가시성
    owner_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="프로젝트를 생성한 사용자",
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="프로젝트 활성화 여부",
    )
    is_public = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="프로젝트 공개 여부",
    )

    # 추가 정보
    repository_url = Column(String(500), nullable=True, doc="Git 저장소 URL")
    documentation_url = Column(String(500), nullable=True, doc="문서 URL")
    tags = Column(Text, nullable=True, doc="프로젝트 태그 (쉼표로 구분)")

    # 관계
    owner = relationship(
        "User", back_populates="owned_projects", foreign_keys=[owner_id]
    )

    members = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    tasks = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    comments = relationship(
        "ProjectComment",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    attachments = relationship(
        "ProjectAttachment",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    events = relationship("Event", back_populates="project")

    # 제약 조건
    __table_args__ = (
        CheckConstraint(
            "progress >= 0 AND progress <= 100", name="ck_project_progress"
        ),
        CheckConstraint("budget >= 0", name="ck_project_budget_positive"),
        CheckConstraint("actual_cost >= 0", name="ck_project_actual_cost_positive"),
        CheckConstraint("start_date <= end_date", name="ck_project_date_order"),
    )

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"

    def update_progress(self):
        """완료된 작업을 기반으로 프로젝트 진행률 업데이트"""
        if not self.tasks:
            self.progress = 0
            return

        completed_tasks = sum(1 for task in self.tasks if task.status == "completed")
        total_tasks = len(self.tasks)
        self.progress = int((completed_tasks / total_tasks) * 100)


class ProjectMember(Base):
    """
    프로젝트 멤버 연관 모델
    """

    __tablename__ = "project_members"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="프로젝트 멤버의 고유 식별자",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="프로젝트 멤버 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="프로젝트 멤버 연관을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="프로젝트 멤버 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="프로젝트 멤버 연관을 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    project_id = Column(
        UUID, ForeignKey("projects.id"), nullable=False, doc="프로젝트 ID"
    )
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False, doc="사용자 ID")
    role = Column(
        String(20),  # Enum(ProjectMemberRole),
        default=ProjectMemberRole.DEVELOPER,
        nullable=False,
        doc="프로젝트에서의 멤버 역할",
    )
    joined_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="사용자가 프로젝트에 참여한 시점",
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="멤버십 활성화 여부",
    )

    # 관계
    project = relationship(
        "Project", back_populates="members", foreign_keys=[project_id]
    )
    user = relationship(
        "User", back_populates="project_memberships", foreign_keys=[user_id]
    )

    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    # 제약 조건
    __table_args__ = (
        UniqueConstraint(
            "project_id", "user_id", name="ux_project_members__project_user"
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ProjectMember(project_id={self.project_id}, "
            f"user_id={self.user_id}, role='{self.role}')>"
        )

    def can_manage_project(self) -> bool:
        """멤버가 프로젝트를 관리할 수 있는지 확인"""
        return self.role in [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
        ]

    def can_assign_tasks(self) -> bool:
        """멤버가 작업을 할당할 수 있는지 확인"""
        return self.role in [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
        ]


class ProjectComment(Base):
    """
    프로젝트 댓글 모델
    """

    __tablename__ = "project_comments"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="프로젝트 댓글의 고유 식별자",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="댓글 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="댓글을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="댓글 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="댓글을 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    project_id = Column(
        UUID, ForeignKey("projects.id"), nullable=False, doc="프로젝트 ID"
    )
    author_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="댓글 작성자 ID",
    )
    content = Column(Text, nullable=False, doc="댓글 내용")
    parent_id = Column(
        UUID,
        ForeignKey("project_comments.id"),
        nullable=True,
        doc="답글을 위한 부모 댓글 ID",
    )
    is_edited = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="댓글 편집 여부",
    )

    # 관계
    project = relationship(
        "Project", back_populates="comments", foreign_keys=[project_id]
    )
    author = relationship(
        "User", back_populates="project_comments", foreign_keys=[author_id]
    )
    parent = relationship(
        "ProjectComment",
        remote_side=[id],
        back_populates="replies",
        foreign_keys=[parent_id],
    )
    replies = relationship(
        "ProjectComment",
        back_populates="parent",
        cascade="all, delete-orphan",
    )

    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return (
            f"<ProjectComment(id={self.id}, project_id={self.project_id}, "
            f"author_id={self.author_id})>"
        )


class ProjectAttachment(Base):
    """
    프로젝트 첨부파일 모델
    """

    __tablename__ = "project_attachments"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="프로젝트 첨부파일의 고유 식별자",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="첨부파일 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="첨부파일을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="첨부파일 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="첨부파일을 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    project_id = Column(
        UUID, ForeignKey("projects.id"), nullable=False, doc="프로젝트 ID"
    )
    file_name = Column(String(255), nullable=False, doc="원본 파일명")
    file_path = Column(String(500), nullable=False, doc="파일 저장 경로")
    file_size = Column(Integer, nullable=False, doc="파일 크기 (바이트)")
    mime_type = Column(String(100), nullable=True, doc="파일의 MIME 타입")
    uploaded_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="파일을 업로드한 사용자",
    )
    description = Column(Text, nullable=True, doc="파일 설명")

    # 관계
    project = relationship(
        "Project", back_populates="attachments", foreign_keys=[project_id]
    )
    uploader = relationship(
        "User", back_populates="uploaded_attachments", foreign_keys=[uploaded_by]
    )

    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return (
            f"<ProjectAttachment(id={self.id}, filename='{self.file_name}', "
            f"project_id={self.project_id})>"
        )
