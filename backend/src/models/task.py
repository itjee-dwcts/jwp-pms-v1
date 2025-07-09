"""
작업 모델

작업 관리를 위한 SQLAlchemy 모델
"""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from constants.task import TaskPriority, TaskStatus, TaskType
from core.base import Base
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

if TYPE_CHECKING:
    from models.user import User


class Task(Base):
    """
    작업 관리를 위한 작업 모델
    """

    __tablename__ = "tasks"

    # 고유 식별자 및 타임스탬프
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="작업 ID")
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="작업 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="작업을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="작업 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="작업을 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    title = Column(String(200), nullable=False, index=True, doc="작업 제목")
    description = Column(Text, nullable=True, doc="작업 설명")

    # 상태 및 우선순위
    status = Column(
        String(20),
        default=TaskStatus.TODO,
        nullable=False,
        index=True,
        doc="작업 상태",
    )
    priority = Column(
        String(20),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
        doc="작업 우선순위",
    )
    task_type = Column(
        String(20), default=TaskType.FEATURE, nullable=False, doc="작업 유형"
    )

    # 프로젝트 연관
    project_id = Column(
        UUID,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
        doc="연관된 프로젝트 ID",
    )

    # 작업 계층구조
    parent_id = Column(
        UUID,
        ForeignKey("tasks.id"),
        nullable=True,
        doc="하위 작업을 위한 상위 작업 ID",
    )

    # 시간 추적
    estimated_hours = Column(Integer, nullable=True, doc="완료까지 예상 시간")
    actual_hours = Column(Integer, default=0, nullable=False, doc="실제 소요 시간")

    # 일정
    start_date = Column(DateTime(timezone=True), nullable=True, doc="작업 시작일")
    due_date = Column(
        DateTime(timezone=True), nullable=True, index=True, doc="작업 마감일"
    )
    completed_at = Column(
        DateTime(timezone=True), nullable=True, doc="작업 완료 타임스탬프"
    )

    # 소유권
    owner_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="작업을 생성한 사용자",
    )

    # 추가 정보
    story_points = Column(
        Integer, nullable=True, doc="애자일 추정을 위한 스토리 포인트"
    )
    acceptance_criteria = Column(Text, nullable=True, doc="작업 완료를 위한 수락 기준")
    external_id = Column(
        String(100),
        nullable=True,
        index=True,
        doc="외부 시스템 ID (예: Jira 티켓)",
    )

    # 관계
    project = relationship("Project", back_populates="tasks")

    owner = relationship(
        "User", back_populates="created_tasks", foreign_keys=[owner_id]
    )
    creator = relationship("User")
    updater = relationship("User")

    parent_task = relationship(
        "Task",
        remote_side=lambda: Task.id,
        back_populates="subtasks",
    )

    subtasks = relationship(
        "Task", back_populates="parent_task", cascade="all, delete-orphan"
    )

    assignments = relationship(
        "TaskAssignment", back_populates="task", cascade="all, delete-orphan"
    )

    comments = relationship(
        "TaskComment", back_populates="task", cascade="all, delete-orphan"
    )

    attachments = relationship(
        "TaskAttachment", back_populates="task", cascade="all, delete-orphan"
    )

    time_logs = relationship(
        "TaskTimeLog", back_populates="task", cascade="all, delete-orphan"
    )

    tags = relationship("TaskTag", back_populates="task", cascade="all, delete-orphan")

    events = relationship("Event", back_populates="task")

    # 제약 조건
    __table_args__ = (
        CheckConstraint(
            "estimated_hours >= 0", name="ck_task_estimated_hours_positive"
        ),
        CheckConstraint("actual_hours >= 0", name="ck_task_actual_hours_positive"),
        CheckConstraint("story_points >= 0", name="ck_task_story_points_positive"),
        CheckConstraint("start_date <= due_date", name="ck_task_date_order"),
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"

    def assign_to(self, user: "User", assigned_by: "User"):
        """사용자에게 작업 할당"""
        # 이미 할당되었는지 확인
        existing = next(
            (a for a in self.assignments if a.user_id == user.id and a.is_active),
            None,
        )
        if existing:
            return existing

        # 새 할당 생성
        assignment = TaskAssignment(
            task_id=self.id,
            user_id=user.id,
            assigned_by=assigned_by.id,  # type: ignore
        )
        self.assignments.append(assignment)
        return assignment

    def unassign_from(self, user: "User"):
        """사용자에게서 작업 할당 해제"""
        for assignment in self.assignments:
            if assignment.user_id == user.id and assignment.is_active:
                assignment.is_active = False

    def mark_completed(self):
        """작업을 완료로 표시"""
        self.status = TaskStatus.DONE
        self.completed_at = datetime.now(timezone.utc)

    def calculate_actual_hours(self) -> int:
        """시간 로그에서 실제 시간 계산"""
        if not self.time_logs:
            return 0
        return sum(log.hours for log in self.time_logs)


class TaskAssignment(Base):
    """
    작업 할당 모델
    """

    __tablename__ = "task_assignments"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="할당 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="할당 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="할당을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="할당 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="할당을 마지막으로 업데이트한 사용자",
    )

    # 작업 및 사용자 연관
    task_id = Column(UUID, ForeignKey("tasks.id"), nullable=False, doc="작업 ID")
    user_id = Column(
        UUID, ForeignKey("users.id"), nullable=False, doc="할당된 사용자 ID"
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="할당이 활성화되어 있는지 여부",
    )

    # 관계
    task = relationship("Task", back_populates="assignments")
    assignee = relationship(
        "User", back_populates="task_assignments", foreign_keys=[user_id]
    )
    creator = relationship("User")
    updater = relationship("User")

    # 제약 조건
    __table_args__ = (
        UniqueConstraint("task_id", "user_id", name="uq_task_assignments_task_user"),
    )

    def __repr__(self) -> str:
        return f"<TaskAssignment(task_id={self.task_id}, user_id={self.user_id})>"


class TaskComment(Base):
    """
    작업 댓글 모델
    """

    __tablename__ = "task_comments"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="댓글 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="댓글 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
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
        nullable=True,
        doc="댓글을 마지막으로 업데이트한 사용자",
    )

    # 작업 및 사용자 연관
    task_id = Column(UUID, ForeignKey("tasks.id"), nullable=False, doc="작업 ID")
    author_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="댓글 작성자 ID",
    )
    content = Column(Text, nullable=False, doc="댓글 내용")
    parent_id = Column(
        UUID,
        ForeignKey("task_comments.id"),
        nullable=True,
        doc="답글을 위한 부모 댓글 ID",
    )
    is_edited = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="댓글이 편집되었는지 여부",
    )

    # 관계
    task = relationship("Task", back_populates="comments")
    author = relationship("User")
    creator = relationship("User")
    updater = relationship("User")
    parent = relationship(
        "TaskComment",
        remote_side=lambda: TaskComment.id,
        back_populates="replies",
    )
    replies = relationship(
        "TaskComment", back_populates="parent", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<TaskComment("
            f"id={self.id}, "
            f"task_id={self.task_id}, "
            f"author_id={self.author_id}"
            f")>"
        )


class TaskAttachment(Base):
    """
    작업 첨부파일 모델
    """

    __tablename__ = "task_attachments"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="첨부파일 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="첨부파일 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
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
        nullable=True,
        doc="첨부파일을 마지막으로 업데이트한 사용자",
    )

    # 작업 및 사용자 연관
    task_id = Column(UUID, ForeignKey("tasks.id"), nullable=False, doc="작업 ID")
    file_name = Column(String(255), nullable=False, doc="원본 파일명")
    file_path = Column(String(500), nullable=False, doc="파일 저장 경로")
    file_size = Column(Integer, nullable=False, doc="파일 크기 (바이트)")
    mime_type = Column(String(100), nullable=True, doc="파일의 MIME 타입")
    description = Column(Text, nullable=True, doc="파일 설명")

    # 관계
    task = relationship("Task", back_populates="attachments")
    creator = relationship("User")
    updater = relationship("User")

    def __repr__(self) -> str:
        return (
            f"<TaskAttachment(id={self.id}, filename='{self.file_name}', "
            f"task_id={self.task_id})>"
        )


class TaskTimeLog(Base):
    """
    작업 시간 추적 모델
    """

    __tablename__ = "task_time_logs"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="시간 로그 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="시간 로그 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="시간 로그를 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="시간 로그 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="시간 로그를 마지막으로 업데이트한 사용자",
    )

    # 작업 및 사용자 연관
    task_id = Column(UUID, ForeignKey("tasks.id"), nullable=False, doc="작업 ID")
    user_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="시간을 기록한 사용자",
    )
    hours = Column(Integer, nullable=False, doc="작업한 시간")
    description = Column(Text, nullable=True, doc="작업 설명")
    work_date = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        doc="작업이 수행된 날짜",
    )

    # 관계
    task = relationship("Task", back_populates="time_logs")
    user = relationship("User")
    creator = relationship("User")
    updater = relationship("User")

    # 제약 조건
    __table_args__ = (
        CheckConstraint("hours > 0", name="ck_task_time_log_hours_positive"),
    )

    def __repr__(self) -> str:
        return (
            f"<TaskTimeLog(id={self.id}, task_id={self.task_id}, hours={self.hours})>"
        )


class Tag(Base):
    """
    작업 분류를 위한 태그 모델
    """

    __tablename__ = "tags"

    # 고유 식별자 및 타임스탬프
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="태그 ID")
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="태그 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="태그를 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="태그 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="태그를 마지막으로 업데이트한 사용자",
    )

    # 기본 정보
    name = Column(String(50), unique=True, nullable=False, index=True, doc="태그 이름")
    color = Column(
        String(7), default="#3B82F6", nullable=False, doc="태그 색상 (16진수)"
    )
    description = Column(Text, nullable=True, doc="태그 설명")

    # 관계
    task_tags = relationship(
        "TaskTag", back_populates="tag", cascade="all, delete-orphan"
    )
    creator = relationship("User")
    updater = relationship("User")

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}')>"


class TaskTag(Base):
    """
    작업-태그 연관 모델
    """

    __tablename__ = "task_tags"

    # 고유 식별자 및 타임스탬프
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="작업태그 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="작업태그 생성 타임스탬프",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="태그를 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="작업태그 마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="태그를 마지막으로 업데이트한 사용자",
    )

    # 작업 및 태그 연관
    task_id = Column(UUID, ForeignKey("tasks.id"), nullable=False, doc="작업 ID")
    tag_id = Column(UUID, ForeignKey("tags.id"), nullable=False, doc="태그 ID")

    # 관계
    task = relationship("Task", back_populates="tags")
    tag = relationship("Tag", back_populates="task_tags")
    creator = relationship("User")
    updater = relationship("User")

    # 제약 조건
    __table_args__ = (
        UniqueConstraint("task_id", "tag_id", name="ux_task_tags_task_tag"),
    )

    def __repr__(self) -> str:
        return f"<TaskTag(task_id={self.task_id}, tag_id={self.tag_id})>"
