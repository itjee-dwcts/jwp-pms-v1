"""
Task Models

SQLAlchemy models for task management.
"""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

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

from core.base import Base
from core.constants import TaskPriority, TaskStatus, TaskType

if TYPE_CHECKING:
    from models.user import User


class Task(Base):
    """
    Task model for task management
    """

    __tablename__ = "tasks"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="Task ID"
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Task creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the task",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Task last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the task",
    )

    # Basic Information
    title = Column(String(200), nullable=False, index=True, doc="Task title")
    description = Column(Text, nullable=True, doc="Task description")

    # Status and Priority
    # Enum(TaskStatus)
    status = Column(
        String(20),
        default=TaskStatus.TODO,
        nullable=False,
        index=True,
        doc="Task status",
    )
    priority = Column(
        String(20),
        default=TaskPriority.MEDIUM,
        nullable=False,
        index=True,
        doc="Task priority",
    )
    task_type = Column(
        String(20), default=TaskType.FEATURE, nullable=False, doc="Task type"
    )

    # Project Association
    project_id = Column(
        UUID,
        ForeignKey("projects.id"),
        nullable=False,
        index=True,
        doc="Associated project ID",
    )

    # Task Hierarchy
    parent_id = Column(
        UUID,
        ForeignKey("tasks.id"),
        nullable=True,
        doc="Parent task ID for subtasks",
    )

    # Time Tracking
    estimated_hours = Column(
        Integer, nullable=True, doc="Estimated hours to complete"
    )
    actual_hours = Column(
        Integer, default=0, nullable=False, doc="Actual hours spent"
    )

    # Timeline
    start_date = Column(
        DateTime(timezone=True), nullable=True, doc="Task start date"
    )
    due_date = Column(
        DateTime(timezone=True), nullable=True, index=True, doc="Task due date"
    )
    completed_at = Column(
        DateTime(timezone=True), nullable=True, doc="Task completion timestamp"
    )

    # Ownership
    owner_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="User who created the task",
    )

    # Additional Information
    story_points = Column(
        Integer, nullable=True, doc="Story points for agile estimation"
    )
    acceptance_criteria = Column(
        Text, nullable=True, doc="Acceptance criteria for task completion"
    )
    external_id = Column(
        String(100),
        nullable=True,
        index=True,
        doc="External system ID (e.g., Jira ticket)",
    )

    # Relationships
    project = relationship("Project", back_populates="tasks")

    owner = relationship(
        "User", back_populates="created_tasks", foreign_keys=[owner_id]
    )
    creator = relationship("User")
    updater = relationship("User")

    # parent_task = relationship
    # ("Task", remote_side=[Base.id], back_populates="subtasks")
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

    tags = relationship(
        "TaskTag", back_populates="task", cascade="all, delete-orphan"
    )

    events = relationship("Event", back_populates="task")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "estimated_hours >= 0", name="ck_task_estimated_hours_positive"
        ),
        CheckConstraint(
            "actual_hours >= 0", name="ck_task_actual_hours_positive"
        ),
        CheckConstraint(
            "story_points >= 0", name="ck_task_story_points_positive"
        ),
        CheckConstraint("start_date <= due_date", name="ck_task_date_order"),
    )

    def __repr__(self) -> str:
        return (
            f"<Task(id={self.id}, title='{self.title}', "
            f"status='{self.status}')>"
        )

    def assign_to(self, user: "User", assigned_by: "User"):
        """Assign task to a user"""
        # Check if already assigned
        existing = next(
            (
                a
                for a in self.assignments
                if a.user_id == user.id and a.is_active
            ),
            None,
        )
        if existing:
            return existing

        # Create new assignment
        assignment = TaskAssignment(
            task_id=self.id,
            user_id=user.id,
            assigned_by=assigned_by.id,  # type: ignore
        )
        self.assignments.append(assignment)
        return assignment

    def unassign_from(self, user: "User"):
        """Unassign task from a user"""
        for assignment in self.assignments:
            if assignment.user_id == user.id and assignment.is_active:
                assignment.is_active = False

    def mark_completed(self):
        """Mark task as completed"""
        self.status = TaskStatus.DONE
        self.completed_at = datetime.now(timezone.utc)

    def calculate_actual_hours(self) -> int:
        """Calculate actual hours from time logs"""
        if not self.time_logs:
            return 0
        return sum(log.hours for log in self.time_logs)


class TaskAssignment(Base):
    """
    Task assignment model
    """

    __tablename__ = "task_assignments"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Assignment ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Assignment creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the assignment",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Assignment last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the assignment",
    )

    # Task and User Association
    task_id = Column(
        UUID, ForeignKey("tasks.id"), nullable=False, doc="Task ID"
    )
    user_id = Column(
        UUID, ForeignKey("users.id"), nullable=False, doc="Assigned user ID"
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether the assignment is active",
    )

    # Relationships
    task = relationship("Task", back_populates="assignments")
    assignee = relationship(
        "User", back_populates="task_assignments", foreign_keys=[user_id]
    )
    creator = relationship("User")
    updater = relationship("User")

    # Constraints
    __table_args__ = (
        UniqueConstraint(
            "task_id", "user_id", name="uq_task_assignments_task_user"
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<TaskAssignment(task_id={self.task_id}, user_id={self.user_id})>"
        )


class TaskComment(Base):
    """
    Task comment model
    """

    __tablename__ = "task_comments"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Comment ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Comment creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the comment",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Comment last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the comment",
    )

    # Task and User Association
    task_id = Column(
        UUID, ForeignKey("tasks.id"), nullable=False, doc="Task ID"
    )
    author_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="Comment author ID",
    )
    content = Column(Text, nullable=False, doc="Comment content")
    parent_id = Column(
        UUID,
        ForeignKey("task_comments.id"),
        nullable=True,
        doc="Parent comment ID for replies",
    )
    is_edited = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether the comment has been edited",
    )

    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User")
    creator = relationship("User")
    updater = relationship("User")
    # parent = relationship("TaskComment", remote_side=[Base.id])
    parent = relationship(
        "TaskComment",
        remote_side=lambda: TaskComment.id,
        back_populates="recurring_instances",
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
    Task attachment model
    """

    __tablename__ = "task_attachments"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Attachment ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Attachment creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the attachment",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Attachment last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the attachment",
    )

    # Task and User Association
    task_id = Column(
        UUID, ForeignKey("tasks.id"), nullable=False, doc="Task ID"
    )
    file_name = Column(String(255), nullable=False, doc="Original filename")
    file_path = Column(String(500), nullable=False, doc="File storage path")
    file_size = Column(Integer, nullable=False, doc="File size in bytes")
    mime_type = Column(String(100), nullable=True, doc="MIME type of the file")
    description = Column(Text, nullable=True, doc="File description")

    # Relationships
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
    Task time tracking model
    """

    __tablename__ = "task_time_logs"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Time log ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Time log creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the time log",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Time log last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the time log",
    )

    # Task and User Association
    task_id = Column(
        UUID, ForeignKey("tasks.id"), nullable=False, doc="Task ID"
    )
    user_id = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=False,
        doc="User who logged the time",
    )
    hours = Column(Integer, nullable=False, doc="Hours worked")
    description = Column(Text, nullable=True, doc="Work description")
    work_date = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        doc="Date when work was performed",
    )

    # Relationships
    task = relationship("Task", back_populates="time_logs")
    user = relationship("User")
    creator = relationship("User")
    updater = relationship("User")

    # Constraints
    __table_args__ = (
        CheckConstraint("hours > 0", name="ck_task_time_log_hours_positive"),
    )

    def __repr__(self) -> str:
        return (
            f"<TaskTimeLog(id={self.id}, task_id={self.task_id}, "
            f"hours={self.hours})>"
        )


class Tag(Base):
    """
    Tag model for categorizing tasks
    """

    __tablename__ = "tags"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, doc="Tag ID"
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="Tag creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the tag",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="Tag last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the tag",
    )

    # Basic Information
    name = Column(
        String(50), unique=True, nullable=False, index=True, doc="Tag name"
    )
    color = Column(
        String(7), default="#3B82F6", nullable=False, doc="Tag color (hex)"
    )
    description = Column(Text, nullable=True, doc="Tag description")

    # Relationships
    task_tags = relationship(
        "TaskTag", back_populates="tag", cascade="all, delete-orphan"
    )
    creator = relationship("User")
    updater = relationship("User")

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}')>"


class TaskTag(Base):
    """
    Task-Tag association model
    """

    __tablename__ = "task_tags"

    # Unique identifier and timestamps
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="TaskTag ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="TaskTag creation timestamp",
    )
    created_by = Column(
        UUID,
        nullable=True,
        doc="User who created the tag",
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="TaskTag last update timestamp",
    )
    updated_by = Column(
        UUID,
        nullable=True,
        doc="User who last updated the tag",
    )

    # Task and Tag Association
    task_id = Column(
        UUID, ForeignKey("tasks.id"), nullable=False, doc="Task ID"
    )
    tag_id = Column(UUID, ForeignKey("tags.id"), nullable=False, doc="Tag ID")

    # Relationships
    task = relationship("Task", back_populates="tags")
    tag = relationship("Tag", back_populates="task_tags")
    creator = relationship("User")
    updater = relationship("User")

    # Constraints
    __table_args__ = (
        UniqueConstraint("task_id", "tag_id", name="ux_task_tags_task_tag"),
    )

    def __repr__(self) -> str:
        return f"<TaskTag(task_id={self.task_id}, tag_id={self.tag_id})>"
