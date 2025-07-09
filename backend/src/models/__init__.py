"""
데이터베이스 모델 패키지

PMS 애플리케이션을 위한 SQLAlchemy 모델들입니다.
"""

# 베이스 클래스 가져오기
from core.base import Base

# 캘린더 모델
from .calendar import Calendar, Event, EventAttendee

# 프로젝트 모델
from .project import Project, ProjectAttachment, ProjectComment, ProjectMember

# 작업 모델
from .task import (
    Tag,
    Task,
    TaskAssignment,
    TaskAttachment,
    TaskComment,
    TaskTag,
    TaskTimeLog,
)

# 사용자 모델
from .user import User, UserActivityLog, UserSession

__all__ = [
    # 베이스 클래스
    "Base",
    # 사용자 모델
    "User",
    "UserActivityLog",
    "UserSession",
    # 프로젝트 모델
    "Project",
    "ProjectMember",
    "ProjectComment",
    "ProjectAttachment",
    # 작업 모델
    "Task",
    "TaskAssignment",
    "TaskComment",
    "TaskAttachment",
    "TaskTimeLog",
    "Tag",
    "TaskTag",
    # 캘린더 모델
    "Calendar",
    "Event",
    "EventAttendee",
]
