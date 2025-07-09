"""
상수 패키지

모든 상수 정의를 중앙에서 관리하고 쉽게 임포트할 수 있도록 구성합니다.

사용 예시:
    from constants import UserRole, ProjectStatus, TaskStatus
    from constants.user import UserRole
    from constants.project import ProjectStatus
    from constants.task import TaskStatus
"""

# ============================================================================
# 캘린더 관련 상수
# INTEGRATION_SETTINGS
# RECURRENCE_SETTINGS,
# ============================================================================
from .calendar import (
    CALENDAR_EMAIL_TEMPLATES,
    CALENDAR_PERMISSIONS,
    CALENDAR_SETTINGS,
    DEFAULT_ATTENDEE_STATUS,
    DEFAULT_CALENDAR_VIEW,
    DEFAULT_EVENT_STATUS,
    DEFAULT_EVENT_TYPE,
    DEFAULT_RECURRENCE_TYPE,
    DEFAULT_REMINDER,
    EVENT_LIMITS,
    EVENT_STATUS_COLORS,
    EVENT_TEMPLATES,
    EVENT_TYPE_COLORS,
    TIMEZONE_SETTINGS,
    CalendarView,
    EventAttendeeStatus,
    EventReminder,
    EventStatus,
    EventType,
    RecurrenceType,
)
from .calendar import NOTIFICATION_SETTINGS as CALENDAR_NOTIFICATION_SETTINGS

# ============================================================================
# 채팅 관련 상수
# ============================================================================
from .chat import (
    CHAT_LIMITS,
    CHAT_SETTINGS,
    CHAT_THEME_COLORS,
    CHAT_THEME_LABELS,
    CHAT_THEME_OPTIONS,
    DEFAULT_CHAT_THEME,
    DEFAULT_INPUT_MODE,
    DEFAULT_MESSAGE_ROLE,
    DEFAULT_MESSAGE_STATUS,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_SESSION_STATUS,
    INPUT_MODE_COLORS,
    INPUT_MODE_LABELS,
    INPUT_MODE_OPTIONS,
    MESSAGE_ROLE_COLORS,
    MESSAGE_ROLE_LABELS,
    MESSAGE_ROLE_OPTIONS,
    MESSAGE_STATUS_COLORS,
    MESSAGE_STATUS_LABELS,
    MESSAGE_STATUS_OPTIONS,
    OPENAI_MODEL_COLORS,
    OPENAI_MODEL_LABELS,
    OPENAI_MODEL_OPTIONS,
    SESSION_STATUS_COLORS,
    SESSION_STATUS_LABELS,
    SESSION_STATUS_OPTIONS,
    ChatTheme,
    InputMode,
    MessageRole,
    MessageStatus,
    OpenAIModel,
    SessionStatus,
)

# ============================================================================
# 프로젝트 관련 상수
# PROGRESS_CALCULATION,
# ============================================================================
from .project import BACKUP_SETTINGS as PROJECT_BACKUP_SETTINGS
from .project import (
    DEFAULT_PROJECT_PRIORITY,
    DEFAULT_PROJECT_STATUS,
    DEFAULT_PROJECT_TYPE,
    DEFAULT_PROJECT_VISIBILITY,
    MEMBER_LIMITS,
    PERMISSION_MATRIX,
    PROJECT_COLORS,
    PROJECT_EMAIL_TEMPLATES,
    PROJECT_LIMITS,
    PROJECT_TEMPLATES,
    ProjectMemberRole,
    ProjectPriority,
    ProjectStatus,
    ProjectType,
    ProjectVisibility,
)
from .project import NOTIFICATION_SETTINGS as PROJECT_NOTIFICATION_SETTINGS
from .project import STATUS_COLORS as PROJECT_STATUS_COLORS

# ============================================================================
# 시스템 관련 상수
# ALLOWED_EXTENSIONS,
# CACHE_TIMEOUTS,
# DEVELOPMENT_SETTINGS,
# ============================================================================
from .system import (
    ANALYTICS_SETTINGS,
    API_SETTINGS,
    DEFAULT_FILE_TYPE,
    DEFAULT_LOG_LEVEL,
    DEFAULT_NOTIFICATION_SETTINGS,
    DEFAULT_NOTIFICATION_TYPE,
    DEFAULT_PAGE_SIZE,
    DEFAULT_SYSTEM_STATUS,
    EXPORT_SETTINGS,
    I18N_SETTINGS,
    MAX_FILE_SIZES,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
    MONITORING_SETTINGS,
    PERFORMANCE_SETTINGS,
    RATE_LIMITS,
    SEARCH_SETTINGS,
    SECURITY_SETTINGS,
    SYSTEM_SETTINGS,
    THEME_SETTINGS,
    WEBHOOK_SETTINGS,
    ActivityAction,
    AttachmentContext,
    FileType,
    LogLevel,
    NotificationChannel,
    NotificationType,
    ResourceType,
    SystemStatus,
)
from .system import BACKUP_SETTINGS as SYSTEM_BACKUP_SETTINGS
from .system import EMAIL_TEMPLATES as SYSTEM_EMAIL_TEMPLATES

# ============================================================================
# 작업 관련 상수
# AUTOMATION_RULES,
# METRICS_CONFIG,
# ============================================================================
from .task import (
    DEFAULT_TASK_COMPLEXITY,
    DEFAULT_TASK_PRIORITY,
    DEFAULT_TASK_STATUS,
    DEFAULT_TASK_TYPE,
    STATUS_TRANSITION_PERMISSIONS,
    TASK_EMAIL_TEMPLATES,
    TASK_LIMITS,
    TASK_TEMPLATES,
    TaskComplexity,
    TaskPriority,
    TaskStatus,
    TaskType,
)
from .task import NOTIFICATION_EVENTS as TASK_NOTIFICATION_EVENTS
from .task import PRIORITY_COLORS as TASK_PRIORITY_COLORS
from .task import STATUS_COLORS as TASK_STATUS_COLORS
from .task import TYPE_COLORS as TASK_TYPE_COLORS

# ============================================================================
# 사용자 관련 상수
# ADMIN_USER_ID,
# PASSWORD_POLICY,
# SUPPORTED_TIMEZONES,
# SYSTEM_USER_ID,
# TOKEN_EXPIRY,
# USER_RATE_LIMITS,
# ============================================================================
from .user import (
    DEFAULT_TIMEZONE,
    DEFAULT_USER_ROLE,
    DEFAULT_USER_STATUS,
    PROFILE_LIMITS,
    SESSION_SETTINGS,
    AccessLevel,
    Permission,
    TokenType,
    UserRole,
    UserStatus,
)
from .user import EMAIL_TEMPLATES as USER_EMAIL_TEMPLATES

# 이전 변수명과의 호환성을 위한 별칭
MESSAGE_ROLE = MessageRole
SESSION_STATUS = SessionStatus
MESSAGE_STATUS = MessageStatus
OPENAI_MODEL = OpenAIModel
INPUT_MODE = InputMode
CHAT_THEME = ChatTheme

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
    "system_statuses": SystemStatus,
}

# 모든 채팅 관련 상수
CHAT_CONSTANTS = {
    "message_roles": MessageRole,
    "session_statuses": SessionStatus,
    "message_statuses": MessageStatus,
    "themes": ChatTheme,
    "models": OpenAIModel,
    "input_modes": InputMode,
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
    """상수 클래스의 choices를 역순 딕셔너리로 변환 (라벨 -> 값)"""
    if hasattr(constant_class, "choices"):
        return {label: value for value, label in constant_class.choices()}
    return {}


# ============================================================================
# 상수 검증 함수들
# ============================================================================


def is_valid_user_role(role: str) -> bool:
    """유효한 사용자 역할인지 확인"""
    return UserRole.is_valid(role)


def is_valid_user_status(status: str) -> bool:
    """유효한 사용자 상태인지 확인"""
    return UserStatus.is_valid(status)


def is_valid_project_status(status: str) -> bool:
    """유효한 프로젝트 상태인지 확인"""
    return ProjectStatus.is_valid(status)


def is_valid_project_priority(priority: str) -> bool:
    """유효한 프로젝트 우선순위인지 확인"""
    return ProjectPriority.is_valid(priority)


def is_valid_task_status(status: str) -> bool:
    """유효한 작업 상태인지 확인"""
    return TaskStatus.is_valid(status)


def is_valid_task_priority(priority: str) -> bool:
    """유효한 작업 우선순위인지 확인"""
    return TaskPriority.is_valid(priority)


def is_valid_event_type(event_type: str) -> bool:
    """유효한 이벤트 타입인지 확인"""
    return EventType.is_valid(event_type)


def is_valid_event_status(status: str) -> bool:
    """유효한 이벤트 상태인지 확인"""
    return EventStatus.is_valid(status)


def is_valid_file_type(file_type: str) -> bool:
    """유효한 파일 타입인지 확인"""
    return FileType.is_valid(file_type)


def is_valid_notification_type(notification_type: str) -> bool:
    """유효한 알림 타입인지 확인"""
    return NotificationType.is_valid(notification_type)


def is_valid_message_role(role: str) -> bool:
    """유효한 메시지 역할인지 확인"""
    return MessageRole.is_valid(role)


def is_valid_session_status(status: str) -> bool:
    """유효한 세션 상태인지 확인"""
    return SessionStatus.is_valid(status)


# ============================================================================
# 기본값 모음
# ============================================================================

DEFAULT_VALUES = {
    "user_role": DEFAULT_USER_ROLE,
    "user_status": DEFAULT_USER_STATUS,
    "project_status": DEFAULT_PROJECT_STATUS,
    "project_priority": DEFAULT_PROJECT_PRIORITY,
    "project_type": DEFAULT_PROJECT_TYPE,
    "project_visibility": DEFAULT_PROJECT_VISIBILITY,
    "task_status": DEFAULT_TASK_STATUS,
    "task_priority": DEFAULT_TASK_PRIORITY,
    "task_type": DEFAULT_TASK_TYPE,
    "task_complexity": DEFAULT_TASK_COMPLEXITY,
    "event_status": DEFAULT_EVENT_STATUS,
    "event_type": DEFAULT_EVENT_TYPE,
    "recurrence_type": DEFAULT_RECURRENCE_TYPE,
    "attendee_status": DEFAULT_ATTENDEE_STATUS,
    "reminder": DEFAULT_REMINDER,
    "calendar_view": DEFAULT_CALENDAR_VIEW,
    "notification_type": DEFAULT_NOTIFICATION_TYPE,
    "file_type": DEFAULT_FILE_TYPE,
    "log_level": DEFAULT_LOG_LEVEL,
    "system_status": DEFAULT_SYSTEM_STATUS,
    "message_role": DEFAULT_MESSAGE_ROLE,
    "session_status": DEFAULT_SESSION_STATUS,
    "message_status": DEFAULT_MESSAGE_STATUS,
    "openai_model": DEFAULT_OPENAI_MODEL,
    "input_mode": DEFAULT_INPUT_MODE,
    "chat_theme": DEFAULT_CHAT_THEME,
    "page_size": DEFAULT_PAGE_SIZE,
    "timezone": DEFAULT_TIMEZONE,
}

# ============================================================================
# 제한값 모음
# ============================================================================

LIMITS = {
    "user": PROFILE_LIMITS,
    "project": PROJECT_LIMITS,
    "project_members": MEMBER_LIMITS,
    "task": TASK_LIMITS,
    "event": EVENT_LIMITS,
    "chat": CHAT_LIMITS,
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
    "message_status": MESSAGE_STATUS_COLORS,
    "chat_theme": CHAT_THEME_COLORS,
    "openai_model": OPENAI_MODEL_COLORS,
    "input_mode": INPUT_MODE_COLORS,
}

# ============================================================================
# 라벨 모음
# ============================================================================

LABELS = {
    "user_role": dict(UserRole.choices()),
    "user_status": dict(UserStatus.choices()),
    "project_status": dict(ProjectStatus.choices()),
    "project_priority": dict(ProjectPriority.choices()),
    "project_member_role": dict(ProjectMemberRole.choices()),
    "project_type": dict(ProjectType.choices()),
    "project_visibility": dict(ProjectVisibility.choices()),
    "task_status": dict(TaskStatus.choices()),
    "task_priority": dict(TaskPriority.choices()),
    "task_type": dict(TaskType.choices()),
    "task_complexity": dict(TaskComplexity.choices()),
    "event_type": dict(EventType.choices()),
    "event_status": dict(EventStatus.choices()),
    "recurrence_type": dict(RecurrenceType.choices()),
    "attendee_status": dict(EventAttendeeStatus.choices()),
    "reminder": dict(EventReminder.choices()),
    "calendar_view": dict(CalendarView.choices()),
    "notification_type": dict(NotificationType.choices()),
    "notification_channel": dict(NotificationChannel.choices()),
    "file_type": dict(FileType.choices()),
    "attachment_context": dict(AttachmentContext.choices()),
    "activity_action": dict(ActivityAction.choices()),
    "resource_type": dict(ResourceType.choices()),
    "log_level": dict(LogLevel.choices()),
    "system_status": dict(SystemStatus.choices()),
    "message_role": MESSAGE_ROLE_LABELS,
    "session_status": SESSION_STATUS_LABELS,
    "message_status": MESSAGE_STATUS_LABELS,
    "chat_theme": CHAT_THEME_LABELS,
    "openai_model": OPENAI_MODEL_LABELS,
    "input_mode": INPUT_MODE_LABELS,
}

# ============================================================================
# 옵션 모음 (프론트엔드용)
# ============================================================================

OPTIONS = {
    "message_role": MESSAGE_ROLE_OPTIONS,
    "session_status": SESSION_STATUS_OPTIONS,
    "message_status": MESSAGE_STATUS_OPTIONS,
    "chat_theme": CHAT_THEME_OPTIONS,
    "openai_model": OPENAI_MODEL_OPTIONS,
    "input_mode": INPUT_MODE_OPTIONS,
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
    "user_session": SESSION_SETTINGS,
    "chat": CHAT_SETTINGS,
    "timezone": TIMEZONE_SETTINGS,
}

# ============================================================================
# 백업 설정 모음
# ============================================================================

BACKUP_SETTINGS_ALL = {
    "system": SYSTEM_BACKUP_SETTINGS,
    "project": PROJECT_BACKUP_SETTINGS,
}

# ============================================================================
# 알림 설정 모음
# ============================================================================

NOTIFICATION_SETTINGS_ALL = {
    "system": DEFAULT_NOTIFICATION_SETTINGS,
    "project": PROJECT_NOTIFICATION_SETTINGS,
    "task": TASK_NOTIFICATION_EVENTS,
    "calendar": CALENDAR_NOTIFICATION_SETTINGS,
}

# ============================================================================
# 이메일 템플릿 모음
# ============================================================================

EMAIL_TEMPLATES_ALL = {
    "system": SYSTEM_EMAIL_TEMPLATES,
    "user": USER_EMAIL_TEMPLATES,
    "project": PROJECT_EMAIL_TEMPLATES,
    "task": TASK_EMAIL_TEMPLATES,
    "calendar": CALENDAR_EMAIL_TEMPLATES,
}

# ============================================================================
# 권한 모음
# ============================================================================

PERMISSIONS = {
    "project": PERMISSION_MATRIX,
    "calendar": CALENDAR_PERMISSIONS,
    "status_transitions": STATUS_TRANSITION_PERMISSIONS,
}

# ============================================================================
# 템플릿 모음
# ============================================================================

TEMPLATES = {
    "project": PROJECT_TEMPLATES,
    "task": TASK_TEMPLATES,
    "event": EVENT_TEMPLATES,
}

# ============================================================================
# 버전 정보
# ============================================================================

CONSTANTS_VERSION = "1.0.0"
LAST_UPDATED = "2025-07-09"

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
    "SystemStatus",
    "MessageRole",
    "SessionStatus",
    "MessageStatus",
    "OpenAIModel",
    "InputMode",
    "ChatTheme",
    # 이전 변수명 호환성
    "MESSAGE_ROLE",
    "SESSION_STATUS",
    "MESSAGE_STATUS",
    "OPENAI_MODEL",
    "INPUT_MODE",
    "CHAT_THEME",
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
    "is_valid_user_status",
    "is_valid_project_status",
    "is_valid_project_priority",
    "is_valid_task_status",
    "is_valid_task_priority",
    "is_valid_event_type",
    "is_valid_event_status",
    "is_valid_file_type",
    "is_valid_notification_type",
    "is_valid_message_role",
    "is_valid_session_status",
    # 기본값, 제한값, 설정값
    "DEFAULT_VALUES",
    "LIMITS",
    "COLORS",
    "LABELS",
    "OPTIONS",
    "SETTINGS",
    "BACKUP_SETTINGS_ALL",
    "NOTIFICATION_SETTINGS_ALL",
    "EMAIL_TEMPLATES_ALL",
    "PERMISSIONS",
    "TEMPLATES",
    # 버전 정보
    "CONSTANTS_VERSION",
    "LAST_UPDATED",
]
