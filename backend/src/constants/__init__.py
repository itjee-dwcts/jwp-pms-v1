# ============================================================================
# constants/__init__.py - 상수 모듈 초기화 및 통합 임포트
# ============================================================================

"""
Constants Package

모든 상수 정의를 중앙에서 관리하고 쉽게 임포트할 수 있도록 구성합니다.

사용 예시:
    from constants import UserRole, ProjectStatus, TaskStatus
    from constants.user import UserRole
    from constants.project import ProjectStatus
    from constants.task import TaskStatus
"""

# ============================================================================
# 사용자 관련 상수
# ============================================================================
from .user import (
    UserRole,
    UserStatus,
    Permission,
    AccessLevel,
    TokenType,
    DEFAULT_USER_ROLE,
    DEFAULT_USER_STATUS,
    SYSTEM_USER_ID,
    ADMIN_USER_ID,
    EMAIL_TEMPLATES as USER_EMAIL_TEMPLATES,
    TOKEN_EXPIRY,
    PASSWORD_POLICY,
    USER_RATE_LIMITS,
    SESSION_SETTINGS,
    PROFILE_LIMITS,
    DEFAULT_TIMEZONE,
    SUPPORTED_TIMEZONES,
)

# ============================================================================
# 프로젝트 관련 상수
# ============================================================================
from .project import (
    ProjectStatus,
    ProjectPriority,
    ProjectMemberRole,
    ProjectType,
    ProjectVisibility,
    DEFAULT_PROJECT_STATUS,
    DEFAULT_PROJECT_PRIORITY,
    DEFAULT_PROJECT_TYPE,
    DEFAULT_PROJECT_VISIBILITY,
    PROJECT_LIMITS,
    MEMBER_LIMITS,
    PROJECT_TEMPLATES,
    NOTIFICATION_SETTINGS as PROJECT_NOTIFICATION_SETTINGS,
    BACKUP_SETTINGS as PROJECT_BACKUP_SETTINGS,
    PERMISSION_MATRIX,
    PROJECT_COLORS,
    STATUS_COLORS as PROJECT_STATUS_COLORS,
    PROGRESS_CALCULATION,
    PROJECT_EMAIL_TEMPLATES,
)

# ============================================================================
# 작업 관련 상수
# ============================================================================
from .task import (
    TaskStatus,
    TaskPriority,
    TaskType,
    TaskComplexity,
    DEFAULT_TASK_STATUS,
    DEFAULT_TASK_PRIORITY,
    DEFAULT_TASK_TYPE,
    DEFAULT_TASK_COMPLEXITY,
    TASK_LIMITS,
    STATUS_COLORS as TASK_STATUS_COLORS,
    PRIORITY_COLORS as TASK_PRIORITY_COLORS,
    TYPE_COLORS as TASK_TYPE_COLORS,
    TASK_TEMPLATES,
    AUTOMATION_RULES,
    NOTIFICATION_EVENTS as TASK_NOTIFICATION_EVENTS,
    METRICS_CONFIG,
    TASK_EMAIL_TEMPLATES,
    STATUS_TRANSITION_PERMISSIONS,
)

# ============================================================================
# 캘린더 관련 상수
# ============================================================================
from .calendar import (
    EventType,
    EventStatus,
    RecurrenceType,
    EventAttendeeStatus,
    EventReminder,
    CalendarView,
    DEFAULT_EVENT_STATUS,
    DEFAULT_EVENT_TYPE,
    DEFAULT_RECURRENCE_TYPE,
    DEFAULT_ATTENDEE_STATUS,
    DEFAULT_REMINDER,
    DEFAULT_CALENDAR_VIEW,
    EVENT_LIMITS,
    EVENT_TYPE_COLORS,
    EVENT_STATUS_COLORS,
    TIMEZONE_SETTINGS,
    CALENDAR_SETTINGS,
    NOTIFICATION_SETTINGS as CALENDAR_NOTIFICATION_SETTINGS,
    RECURRENCE_SETTINGS,
    EVENT_TEMPLATES,
    CALENDAR_PERMISSIONS,
    CALENDAR_EMAIL_TEMPLATES,
    INTEGRATION_SETTINGS,
)

# ============================================================================
# 시스템 관련 상수
# ============================================================================
from .system import (
    NotificationType,
    NotificationChannel,
    FileType,
    AttachmentContext,
    ActivityAction,
    ResourceType,
    LogLevel,
    MAX_FILE_SIZES,
    ALLOWED_EXTENSIONS,
    RATE_LIMITS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
    CACHE_TIMEOUTS,
    EMAIL_TEMPLATES as SYSTEM_EMAIL_TEMPLATES,
    SYSTEM_SETTINGS,
    SECURITY_SETTINGS,
    BACKUP_SETTINGS as SYSTEM_BACKUP_SETTINGS,
    MONITORING_SETTINGS,
    DEFAULT_NOTIFICATION_SETTINGS,
    SEARCH_SETTINGS,
    EXPORT_SETTINGS,
    ANALYTICS_SETTINGS,
    DEVELOPMENT_SETTINGS,
    PERFORMANCE_SETTINGS,
    API_SETTINGS,
    I18N_SETTINGS,
    THEME_SETTINGS,
    WEBHOOK_SETTINGS,
)

# ============================================================================
# 채팅 관련 상수 (기존 chat 상수 파일에서 임포트)
# ============================================================================
from .chat import (
    MESSAGE_ROLE,
    SESSION_STATUS,
    MESSAGE_STATUS,
    CHAT_THEME,
    OPENAI_MODEL,
    INPUT_MODE,
    MESSAGE_ROLE_LABELS,
    SESSION_STATUS_LABELS,
    MESSAGE_STATUS_LABELS,
    CHAT_THEME_LABELS,
    OPENAI_MODEL_LABELS,
    INPUT_MODE_LABELS,
    MESSAGE_ROLE_COLORS,
    SESSION_STATUS_COLORS,
    MESSAGE_STATUS_COLORS,
    CHAT_THEME_COLORS,
    OPENAI_MODEL_COLORS,
    INPUT_MODE_COLORS,
    MESSAGE_ROLE_OPTIONS,
    SESSION_STATUS_OPTIONS,
    MESSAGE_STATUS_OPTIONS,
    CHAT_THEME_OPTIONS,
    OPENAI_MODEL_OPTIONS,
    INPUT_MODE_OPTIONS,
    CHAT_LIMITS,
    CHAT_SETTINGS,
)

# ============================================================================
# 전체 상수 모음 (편의를 위한 그룹화)
# ============================================================================

# 모든 사용자 역할 관련 상수
USER_CONSTANTS = {
    "roles": UserRole,
    "statuses": UserStatus,
    "permissions": Permission,
    "access_levels": AccessLevel,
    "token_types": TokenType,
}

# 모든 프로젝트 관련 상수
PROJECT_CONSTANTS = {
    "statuses": ProjectStatus,
    "priorities": ProjectPriority,
    "member_roles": ProjectMemberRole,
    "types": ProjectType,
    "visibility": ProjectVisibility,
}

# 모든 작업 관련 상수
TASK_CONSTANTS = {
    "statuses": TaskStatus,
    "priorities": TaskPriority,
    "types": TaskType,
    "complexity": TaskComplexity,
}

# 모든 캘린더 관련 상수
CALENDAR_CONSTANTS = {
    "event_types": EventType,
    "event_statuses": EventStatus,
    "recurrence_types": RecurrenceType,
    "attendee_statuses": EventAttendeeStatus,
    "reminders": EventReminder,
    "views": CalendarView,
}

# 모든 시스템 관련 상수
SYSTEM_CONSTANTS = {
    "notification_types": NotificationType,
    "notification_channels": NotificationChannel,
    "file_types": FileType,
    "attachment_contexts": AttachmentContext,
    "activity_actions": ActivityAction,
    "resource_types": ResourceType,
    "log_levels": LogLevel,
}

# 모든 채팅 관련 상수
CHAT_CONSTANTS = {
    "message_roles": MESSAGE_ROLE,
    "session_statuses": SESSION_STATUS,
    "message_statuses": MESSAGE_STATUS,
    "themes": CHAT_THEME,
    "models": OPENAI_MODEL,
    "input_modes": INPUT_MODE,
}

# ============================================================================
# 유틸리티 함수들
# ============================================================================


def get_all_constants():
    """모든 상수 그룹을 딕셔너리로 반환"""
    return {
        "user": USER_CONSTANTS,
        "project": PROJECT_CONSTANTS,
        "task": TASK_CONSTANTS,
        "calendar": CALENDAR_CONSTANTS,
        "system": SYSTEM_CONSTANTS,
        "chat": CHAT_CONSTANTS,
    }


def get_constant_choices(constant_class):
    """상수 클래스의 choices 메서드 결과를 반환"""
    if hasattr(constant_class, "choices"):
        return constant_class.choices()
    return []


def get_constant_values(constant_class):
    """상수 클래스의 values 메서드 결과를 반환"""
    if hasattr(constant_class, "values"):
        return constant_class.values()
    return []


def validate_constant_value(constant_class, value):
    """상수 클래스에서 값이 유효한지 검증"""
    if hasattr(constant_class, "is_valid"):
        return constant_class.is_valid(value)
    return False


def get_choices_dict(constant_class):
    """상수 클래스의 choices를 딕셔너리로 변환"""
    if hasattr(constant_class, "choices"):
        return dict(constant_class.choices())
    return {}


def get_reverse_choices_dict(constant_class):
    """상수 클래스의 choices를 역순 딕셔너리로 변환 (label -> value)"""
    if hasattr(constant_class, "choices"):
        return {label: value for value, label in constant_class.choices()}
    return {}


# ============================================================================
# 상수 검증 함수들
# ============================================================================


def is_valid_user_role(role: str) -> bool:
    """유효한 사용자 역할인지 확인"""
    return UserRole.is_valid(role)


def is_valid_project_status(status: str) -> bool:
    """유효한 프로젝트 상태인지 확인"""
    return ProjectStatus.is_valid(status)


def is_valid_task_status(status: str) -> bool:
    """유효한 작업 상태인지 확인"""
    return TaskStatus.is_valid(status)


def is_valid_event_type(event_type: str) -> bool:
    """유효한 이벤트 타입인지 확인"""
    return EventType.is_valid(event_type)


def is_valid_file_type(file_type: str) -> bool:
    """유효한 파일 타입인지 확인"""
    return FileType.is_valid(file_type)


# ============================================================================
# 기본값 모음
# ============================================================================

DEFAULT_VALUES = {
    "user_role": DEFAULT_USER_ROLE,
    "user_status": DEFAULT_USER_STATUS,
    "project_status": DEFAULT_PROJECT_STATUS,
    "project_priority": DEFAULT_PROJECT_PRIORITY,
    "task_status": DEFAULT_TASK_STATUS,
    "task_priority": DEFAULT_TASK_PRIORITY,
    "event_status": DEFAULT_EVENT_STATUS,
    "event_type": DEFAULT_EVENT_TYPE,
    "calendar_view": DEFAULT_CALENDAR_VIEW,
    "page_size": DEFAULT_PAGE_SIZE,
    "timezone": DEFAULT_TIMEZONE,
}

# ============================================================================
# 제한값 모음
# ============================================================================

LIMITS = {
    "user": PROFILE_LIMITS,
    "project": PROJECT_LIMITS,
    "task": TASK_LIMITS,
    "event": EVENT_LIMITS,
    "file_sizes": MAX_FILE_SIZES,
    "page_size": {
        "min": MIN_PAGE_SIZE,
        "max": MAX_PAGE_SIZE,
        "default": DEFAULT_PAGE_SIZE,
    },
    "rate_limits": RATE_LIMITS,
}

# ============================================================================
# 색상 모음
# ============================================================================

COLORS = {
    "project_priority": PROJECT_COLORS,
    "project_status": PROJECT_STATUS_COLORS,
    "task_status": TASK_STATUS_COLORS,
    "task_priority": TASK_PRIORITY_COLORS,
    "task_type": TASK_TYPE_COLORS,
    "event_type": EVENT_TYPE_COLORS,
    "event_status": EVENT_STATUS_COLORS,
    "message_role": MESSAGE_ROLE_COLORS,
    "session_status": SESSION_STATUS_COLORS,
}

# ============================================================================
# 설정 모음
# ============================================================================

SETTINGS = {
    "system": SYSTEM_SETTINGS,
    "security": SECURITY_SETTINGS,
    "performance": PERFORMANCE_SETTINGS,
    "api": API_SETTINGS,
    "i18n": I18N_SETTINGS,
    "theme": THEME_SETTINGS,
    "calendar": CALENDAR_SETTINGS,
    "notification": DEFAULT_NOTIFICATION_SETTINGS,
    "search": SEARCH_SETTINGS,
    "export": EXPORT_SETTINGS,
    "analytics": ANALYTICS_SETTINGS,
    "monitoring": MONITORING_SETTINGS,
    "webhook": WEBHOOK_SETTINGS,
}

# ============================================================================
# 버전 정보
# ============================================================================

CONSTANTS_VERSION = "1.0.0"
LAST_UPDATED = "2025-01-08"

__version__ = CONSTANTS_VERSION
__all__ = [
    # 상수 클래스들
    "UserRole",
    "UserStatus",
    "Permission",
    "AccessLevel",
    "TokenType",
    "ProjectStatus",
    "ProjectPriority",
    "ProjectMemberRole",
    "ProjectType",
    "ProjectVisibility",
    "TaskStatus",
    "TaskPriority",
    "TaskType",
    "TaskComplexity",
    "EventType",
    "EventStatus",
    "RecurrenceType",
    "EventAttendeeStatus",
    "EventReminder",
    "CalendarView",
    "NotificationType",
    "NotificationChannel",
    "FileType",
    "AttachmentContext",
    "ActivityAction",
    "ResourceType",
    "LogLevel",
    "MESSAGE_ROLE",
    "SESSION_STATUS",
    "MESSAGE_STATUS",
    "CHAT_THEME",
    "OPENAI_MODEL",
    "INPUT_MODE",
    # 상수 그룹들
    "USER_CONSTANTS",
    "PROJECT_CONSTANTS",
    "TASK_CONSTANTS",
    "CALENDAR_CONSTANTS",
    "SYSTEM_CONSTANTS",
    "CHAT_CONSTANTS",
    # 유틸리티 함수들
    "get_all_constants",
    "get_constant_choices",
    "get_constant_values",
    "validate_constant_value",
    "get_choices_dict",
    "get_reverse_choices_dict",
    # 검증 함수들
    "is_valid_user_role",
    "is_valid_project_status",
    "is_valid_task_status",
    "is_valid_event_type",
    "is_valid_file_type",
    # 기본값, 제한값, 설정값
    "DEFAULT_VALUES",
    "LIMITS",
    "COLORS",
    "SETTINGS",
    # 버전 정보
    "CONSTANTS_VERSION",
    "LAST_UPDATED",
]
