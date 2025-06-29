"""
Core Package

Core functionality and utilities.
"""

from .constants import (
    AccessLevel,
    ActivityAction,
    AttachmentContext,
    EventAttendeeStatus,
    EventReminder,
    EventStatus,
    EventType,
    FileType,
    NotificationChannel,
    NotificationType,
    Permission,
    ProjectMemberRole,
    ProjectPriority,
    ProjectStatus,
    RecurrenceType,
    ResourceType,
    TaskPriority,
    TaskStatus,
    TaskType,
    UserRole,
    UserStatus,
)

__all__ = [
    # User constants
    "UserRole",
    "UserStatus",
    # Project constants
    "ProjectStatus",
    "ProjectPriority",
    "ProjectMemberRole",
    # Task constants
    "TaskStatus",
    "TaskPriority",
    "TaskType",
    # Calendar constants
    "EventType",
    "EventStatus",
    "RecurrenceType",
    "EventAttendeeStatus",
    "EventReminder",
    # Other constants
    "NotificationType",
    "NotificationChannel",
    "FileType",
    "AttachmentContext",
    "ActivityAction",
    "ResourceType",
    "Permission",
    "AccessLevel",
]
