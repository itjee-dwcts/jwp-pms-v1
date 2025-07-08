# ============================================================================
# constants/system.py - 시스템 관련 상수 정의 (완성본)
# ============================================================================

"""
System Related Constants

알림, 파일, 활동 로그, 설정 등 시스템 전반에 관련된 상수들을 정의합니다.
"""


class NotificationType:
    """알림 타입 상수"""

    INFO = "info"  # 정보 알림
    WARNING = "warning"  # 경고 알림
    ERROR = "error"  # 오류 알림
    SUCCESS = "success"  # 성공 알림

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.INFO, "정보"),
            (cls.WARNING, "경고"),
            (cls.ERROR, "오류"),
            (cls.SUCCESS, "성공"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.INFO, cls.WARNING, cls.ERROR, cls.SUCCESS]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_type_color(cls, notification_type: str) -> str:
        """알림 타입별 색상 반환"""
        colors = {
            cls.INFO: "blue",
            cls.WARNING: "yellow",
            cls.ERROR: "red",
            cls.SUCCESS: "green",
        }
        return colors.get(notification_type, "gray")

    @classmethod
    def get_type_icon(cls, notification_type: str) -> str:
        """알림 타입별 아이콘 반환"""
        icons = {
            cls.INFO: "ℹ️",
            cls.WARNING: "⚠️",
            cls.ERROR: "❌",
            cls.SUCCESS: "✅",
        }
        return icons.get(notification_type, "📢")

    @classmethod
    def requires_immediate_attention(cls, notification_type: str) -> bool:
        """즉시 처리가 필요한 알림인지 확인"""
        return notification_type in [cls.ERROR, cls.WARNING]


class NotificationChannel:
    """알림 채널 상수"""

    EMAIL = "email"  # 이메일 알림
    IN_APP = "in_app"  # 앱 내 알림
    SMS = "sms"  # SMS 알림
    PUSH = "push"  # 푸시 알림
    WEBHOOK = "webhook"  # 웹훅 알림
    SLACK = "slack"  # 슬랙 알림

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.EMAIL, "이메일"),
            (cls.IN_APP, "앱 내 알림"),
            (cls.SMS, "SMS"),
            (cls.PUSH, "푸시 알림"),
            (cls.WEBHOOK, "웹훅"),
            (cls.SLACK, "슬랙"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.EMAIL,
            cls.IN_APP,
            cls.SMS,
            cls.PUSH,
            cls.WEBHOOK,
            cls.SLACK,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_real_time(cls, channel: str) -> bool:
        """실시간 알림 채널인지 확인"""
        return channel in [cls.IN_APP, cls.PUSH, cls.WEBHOOK]

    @classmethod
    def requires_configuration(cls, channel: str) -> bool:
        """설정이 필요한 채널인지 확인"""
        return channel in [cls.SMS, cls.WEBHOOK, cls.SLACK]


class FileType:
    """파일 타입 상수"""

    DOCUMENT = "document"  # 문서 파일
    SPREADSHEET = "spreadsheet"  # 스프레드시트 파일
    PRESENTATION = "presentation"  # 프레젠테이션 파일
    IMAGE = "image"  # 이미지 파일
    VIDEO = "video"  # 비디오 파일
    AUDIO = "audio"  # 오디오 파일
    ARCHIVE = "archive"  # 압축 파일
    CODE = "code"  # 소스 코드 파일
    OTHER = "other"  # 기타 파일 타입

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.DOCUMENT, "문서"),
            (cls.SPREADSHEET, "스프레드시트"),
            (cls.PRESENTATION, "프레젠테이션"),
            (cls.IMAGE, "이미지"),
            (cls.VIDEO, "비디오"),
            (cls.AUDIO, "오디오"),
            (cls.ARCHIVE, "압축 파일"),
            (cls.CODE, "소스 코드"),
            (cls.OTHER, "기타"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.DOCUMENT,
            cls.SPREADSHEET,
            cls.PRESENTATION,
            cls.IMAGE,
            cls.VIDEO,
            cls.AUDIO,
            cls.ARCHIVE,
            cls.CODE,
            cls.OTHER,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_media_file(cls, file_type: str) -> bool:
        """미디어 파일인지 확인"""
        return file_type in [cls.IMAGE, cls.VIDEO, cls.AUDIO]

    @classmethod
    def requires_preview(cls, file_type: str) -> bool:
        """미리보기가 가능한 파일 타입인지 확인"""
        return file_type in [cls.DOCUMENT, cls.IMAGE, cls.CODE]

    @classmethod
    def get_file_icon(cls, file_type: str) -> str:
        """파일 타입별 아이콘 반환"""
        icons = {
            cls.DOCUMENT: "📄",
            cls.SPREADSHEET: "📊",
            cls.PRESENTATION: "📽️",
            cls.IMAGE: "🖼️",
            cls.VIDEO: "🎥",
            cls.AUDIO: "🎵",
            cls.ARCHIVE: "🗜️",
            cls.CODE: "💻",
            cls.OTHER: "📁",
        }
        return icons.get(file_type, "📄")

    @classmethod
    def get_mime_types(cls, file_type: str) -> list[str]:
        """파일 타입별 MIME 타입 반환"""
        mime_types = {
            cls.DOCUMENT: [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-"
                "officedocument.wordprocessingml.document",
                "text/plain",
                "application/rtf",
            ],
            cls.SPREADSHEET: [
                "application/vnd.ms-excel",
                ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                "text/csv",
            ],
            cls.PRESENTATION: [
                "application/vnd.ms-powerpoint",
                (
                    "application/vnd.openxmlformats-officedocument."
                    "presentationml.presentation"
                ),
            ],
            cls.IMAGE: [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/bmp",
                "image/webp",
                "image/svg+xml",
            ],
            cls.VIDEO: [
                "video/mp4",
                "video/avi",
                "video/quicktime",
                "video/x-ms-wmv",
                "video/x-flv",
                "video/webm",
            ],
            cls.AUDIO: [
                "audio/mpeg",
                "audio/wav",
                "audio/flac",
                "audio/aac",
                "audio/ogg",
            ],
            cls.ARCHIVE: [
                "application/zip",
                "application/x-rar-compressed",
                "application/x-7z-compressed",
                "application/x-tar",
                "application/gzip",
            ],
            cls.CODE: [
                "text/x-python",
                "text/javascript",
                "text/html",
                "text/css",
                "text/x-java-source",
                "text/x-c",
                "text/x-php",
            ],
        }
        return mime_types.get(file_type, ["application/octet-stream"])


class AttachmentContext:
    """첨부파일 컨텍스트 상수"""

    PROJECT = "project"  # 프로젝트 첨부파일
    TASK = "task"  # 작업 첨부파일
    COMMENT = "comment"  # 댓글 첨부파일
    USER_PROFILE = "user_profile"  # 사용자 프로필 첨부파일
    EVENT = "event"  # 이벤트 첨부파일
    CHAT = "chat"  # 채팅 첨부파일

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.PROJECT, "프로젝트"),
            (cls.TASK, "작업"),
            (cls.COMMENT, "댓글"),
            (cls.USER_PROFILE, "사용자 프로필"),
            (cls.EVENT, "이벤트"),
            (cls.CHAT, "채팅"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.PROJECT,
            cls.TASK,
            cls.COMMENT,
            cls.USER_PROFILE,
            cls.EVENT,
            cls.CHAT,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_max_file_count(cls, context: str) -> int:
        """컨텍스트별 최대 파일 수 반환"""
        max_counts = {
            cls.PROJECT: 50,
            cls.TASK: 20,
            cls.COMMENT: 5,
            cls.USER_PROFILE: 1,
            cls.EVENT: 10,
            cls.CHAT: 10,
        }
        return max_counts.get(context, 10)

    @classmethod
    def get_max_file_size(cls, context: str) -> int:
        """컨텍스트별 최대 파일 크기 반환 (바이트)"""
        max_sizes = {
            cls.PROJECT: 50 * 1024 * 1024,  # 50MB
            cls.TASK: 20 * 1024 * 1024,  # 20MB
            cls.COMMENT: 10 * 1024 * 1024,  # 10MB
            cls.USER_PROFILE: 5 * 1024 * 1024,  # 5MB
            cls.EVENT: 15 * 1024 * 1024,  # 15MB
            cls.CHAT: 10 * 1024 * 1024,  # 10MB
        }
        return max_sizes.get(context, 10 * 1024 * 1024)


class ActivityAction:
    """활동 액션 상수"""

    CREATE = "create"  # 리소스 생성
    UPDATE = "update"  # 리소스 업데이트
    DELETE = "delete"  # 리소스 삭제
    VIEW = "view"  # 리소스 조회
    LOGIN = "login"  # 사용자 로그인
    LOGOUT = "logout"  # 사용자 로그아웃
    ASSIGN = "assign"  # 리소스 할당
    UNASSIGN = "unassign"  # 리소스 할당 해제
    COMMENT = "comment"  # 댓글 추가
    UPLOAD = "upload"  # 파일 업로드
    DOWNLOAD = "download"  # 파일 다운로드
    ARCHIVE = "archive"  # 리소스 보관
    RESTORE = "restore"  # 리소스 복원

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.CREATE, "생성"),
            (cls.UPDATE, "업데이트"),
            (cls.DELETE, "삭제"),
            (cls.VIEW, "조회"),
            (cls.LOGIN, "로그인"),
            (cls.LOGOUT, "로그아웃"),
            (cls.ASSIGN, "할당"),
            (cls.UNASSIGN, "할당 해제"),
            (cls.COMMENT, "댓글"),
            (cls.UPLOAD, "업로드"),
            (cls.DOWNLOAD, "다운로드"),
            (cls.ARCHIVE, "보관"),
            (cls.RESTORE, "복원"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.CREATE,
            cls.UPDATE,
            cls.DELETE,
            cls.VIEW,
            cls.LOGIN,
            cls.LOGOUT,
            cls.ASSIGN,
            cls.UNASSIGN,
            cls.COMMENT,
            cls.UPLOAD,
            cls.DOWNLOAD,
            cls.ARCHIVE,
            cls.RESTORE,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_destructive_action(cls, action: str) -> bool:
        """파괴적인 액션인지 확인"""
        return action in [cls.DELETE, cls.ARCHIVE]

    @classmethod
    def is_user_action(cls, action: str) -> bool:
        """사용자 관련 액션인지 확인"""
        return action in [cls.LOGIN, cls.LOGOUT]

    @classmethod
    def requires_audit_log(cls, action: str) -> bool:
        """감사 로그가 필요한 액션인지 확인"""
        return action in [
            cls.CREATE,
            cls.UPDATE,
            cls.DELETE,
            cls.ASSIGN,
            cls.UNASSIGN,
        ]

    @classmethod
    def get_action_icon(cls, action: str) -> str:
        """액션별 아이콘 반환"""
        icons = {
            cls.CREATE: "➕",
            cls.UPDATE: "✏️",
            cls.DELETE: "🗑️",
            cls.VIEW: "👀",
            cls.LOGIN: "🔐",
            cls.LOGOUT: "🚪",
            cls.ASSIGN: "👤",
            cls.UNASSIGN: "❌",
            cls.COMMENT: "💬",
            cls.UPLOAD: "⬆️",
            cls.DOWNLOAD: "⬇️",
            cls.ARCHIVE: "📦",
            cls.RESTORE: "🔄",
        }
        return icons.get(action, "📝")

    @classmethod
    def get_action_color(cls, action: str) -> str:
        """액션별 색상 반환"""
        colors = {
            cls.CREATE: "green",
            cls.UPDATE: "blue",
            cls.DELETE: "red",
            cls.VIEW: "gray",
            cls.LOGIN: "blue",
            cls.LOGOUT: "orange",
            cls.ASSIGN: "purple",
            cls.UNASSIGN: "yellow",
            cls.COMMENT: "cyan",
            cls.UPLOAD: "indigo",
            cls.DOWNLOAD: "teal",
            cls.ARCHIVE: "gray",
            cls.RESTORE: "lime",
        }
        return colors.get(action, "gray")


class ResourceType:
    """리소스 타입 상수"""

    USER = "user"  # 사용자 리소스
    PROJECT = "project"  # 프로젝트 리소스
    TASK = "task"  # 작업 리소스
    EVENT = "event"  # 이벤트 리소스
    COMMENT = "comment"  # 댓글 리소스
    FILE = "file"  # 파일 리소스
    CALENDAR = "calendar"  # 캘린더 리소스
    CHAT = "chat"  # 채팅 리소스
    NOTIFICATION = "notification"  # 알림 리소스

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.USER, "사용자"),
            (cls.PROJECT, "프로젝트"),
            (cls.TASK, "작업"),
            (cls.EVENT, "이벤트"),
            (cls.COMMENT, "댓글"),
            (cls.FILE, "파일"),
            (cls.CALENDAR, "캘린더"),
            (cls.CHAT, "채팅"),
            (cls.NOTIFICATION, "알림"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.USER,
            cls.PROJECT,
            cls.TASK,
            cls.EVENT,
            cls.COMMENT,
            cls.FILE,
            cls.CALENDAR,
            cls.CHAT,
            cls.NOTIFICATION,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def supports_comments(cls, resource_type: str) -> bool:
        """댓글을 지원하는 리소스인지 확인"""
        return resource_type in [cls.PROJECT, cls.TASK, cls.EVENT]

    @classmethod
    def supports_attachments(cls, resource_type: str) -> bool:
        """첨부파일을 지원하는 리소스인지 확인"""
        return resource_type in [
            cls.PROJECT,
            cls.TASK,
            cls.COMMENT,
            cls.EVENT,
            cls.CHAT,
        ]

    @classmethod
    def is_collaborative(cls, resource_type: str) -> bool:
        """협업 가능한 리소스인지 확인"""
        return resource_type in [cls.PROJECT, cls.TASK, cls.EVENT, cls.CHAT]

    @classmethod
    def get_resource_icon(cls, resource_type: str) -> str:
        """리소스 타입별 아이콘 반환"""
        icons = {
            cls.USER: "👤",
            cls.PROJECT: "📁",
            cls.TASK: "✅",
            cls.EVENT: "📅",
            cls.COMMENT: "💬",
            cls.FILE: "📎",
            cls.CALENDAR: "🗓️",
            cls.CHAT: "💭",
            cls.NOTIFICATION: "🔔",
        }
        return icons.get(resource_type, "📄")


class LogLevel:
    """로그 레벨 상수"""

    DEBUG = "debug"  # 디버그 레벨
    INFO = "info"  # 정보 레벨
    WARNING = "warning"  # 경고 레벨
    ERROR = "error"  # 오류 레벨
    CRITICAL = "critical"  # 치명적 오류 레벨

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.DEBUG, "디버그"),
            (cls.INFO, "정보"),
            (cls.WARNING, "경고"),
            (cls.ERROR, "오류"),
            (cls.CRITICAL, "치명적"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.DEBUG, cls.INFO, cls.WARNING, cls.ERROR, cls.CRITICAL]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_level_weight(cls, level: str) -> int:
        """로그 레벨의 가중치 반환 (높을수록 심각함)"""
        weights = {
            cls.DEBUG: 1,
            cls.INFO: 2,
            cls.WARNING: 3,
            cls.ERROR: 4,
            cls.CRITICAL: 5,
        }
        return weights.get(level, 2)

    @classmethod
    def requires_alert(cls, level: str) -> bool:
        """알림이 필요한 로그 레벨인지 확인"""
        return level in [cls.ERROR, cls.CRITICAL]

    @classmethod
    def get_level_color(cls, level: str) -> str:
        """로그 레벨별 색상 반환"""
        colors = {
            cls.DEBUG: "gray",
            cls.INFO: "blue",
            cls.WARNING: "yellow",
            cls.ERROR: "red",
            cls.CRITICAL: "purple",
        }
        return colors.get(level, "gray")


class SystemStatus:
    """시스템 상태 상수"""

    ONLINE = "online"  # 온라인
    OFFLINE = "offline"  # 오프라인
    MAINTENANCE = "maintenance"  # 유지보수 중
    DEGRADED = "degraded"  # 성능 저하

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ONLINE, "온라인"),
            (cls.OFFLINE, "오프라인"),
            (cls.MAINTENANCE, "유지보수 중"),
            (cls.DEGRADED, "성능 저하"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.ONLINE, cls.OFFLINE, cls.MAINTENANCE, cls.DEGRADED]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_operational(cls, status: str) -> bool:
        """운영 가능한 상태인지 확인"""
        return status in [cls.ONLINE, cls.DEGRADED]

    @classmethod
    def requires_attention(cls, status: str) -> bool:
        """주의가 필요한 상태인지 확인"""
        return status in [cls.OFFLINE, cls.MAINTENANCE, cls.DEGRADED]


# ============================================================================
# 시스템 관련 기본값 및 제한
# ============================================================================

# 파일 크기 제한 (바이트)
MAX_FILE_SIZES = {
    FileType.IMAGE: 5 * 1024 * 1024,  # 5MB
    FileType.DOCUMENT: 10 * 1024 * 1024,  # 10MB
    FileType.SPREADSHEET: 10 * 1024 * 1024,  # 10MB
    FileType.PRESENTATION: 20 * 1024 * 1024,  # 20MB
    FileType.VIDEO: 100 * 1024 * 1024,  # 100MB
    FileType.AUDIO: 50 * 1024 * 1024,  # 50MB
    FileType.ARCHIVE: 50 * 1024 * 1024,  # 50MB
    FileType.CODE: 1 * 1024 * 1024,  # 1MB
    FileType.OTHER: 10 * 1024 * 1024,  # 10MB
}

# 파일 타입별 허용 확장자
ALLOWED_EXTENSIONS = {
    FileType.IMAGE: {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"},
    FileType.DOCUMENT: {".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"},
    FileType.SPREADSHEET: {".xls", ".xlsx", ".csv", ".ods"},
    FileType.PRESENTATION: {".ppt", ".pptx", ".odp"},
    FileType.VIDEO: {".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"},
    FileType.AUDIO: {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"},
    FileType.ARCHIVE: {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"},
    FileType.CODE: {
        ".py",
        ".js",
        ".html",
        ".css",
        ".java",
        ".cpp",
        ".c",
        ".php",
        ".rb",
        ".go",
    },
}

# API 요청 제한
RATE_LIMITS = {
    "auth": "10/minute",
    "api": "100/minute",
    "upload": "5/minute",
    "export": "3/minute",
    "chat": "50/minute",
    "search": "30/minute",
}

# 페이지네이션 기본값
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 5

# 캐시 타임아웃 (초)
CACHE_TIMEOUTS = {
    "user_profile": 300,  # 5분
    "project_list": 60,  # 1분
    "task_list": 30,  # 30초
    "dashboard": 120,  # 2분
    "statistics": 600,  # 10분
    "file_metadata": 1800,  # 30분
    "system_settings": 3600,  # 1시간
}

# 이메일 템플릿
EMAIL_TEMPLATES = {
    "welcome": "welcome.html",
    "password_reset": "password_reset.html",
    "email_verification": "email_verification.html",
    "task_assigned": "task_assigned.html",
    "project_invitation": "project_invitation.html",
    "deadline_reminder": "deadline_reminder.html",
    "system_maintenance": "system_maintenance.html",
    "security_alert": "security_alert.html",
}

# 시스템 설정
SYSTEM_SETTINGS = {
    "maintenance_mode": False,
    "registration_enabled": True,
    "email_verification_required": True,
    "max_login_attempts": 5,
    "session_timeout": 3600,  # 1시간
    "password_reset_timeout": 1800,  # 30분
    "file_retention_days": 365,  # 1년
    "log_retention_days": 90,  # 3개월
}

# 보안 설정
SECURITY_SETTINGS = {
    "require_2fa": False,
    "password_min_length": 8,
    "password_require_uppercase": True,
    "password_require_lowercase": True,
    "password_require_numbers": True,
    "password_require_symbols": True,
    "session_secure_cookie": True,
    "csrf_protection": True,
    "rate_limiting": True,
}

# 백업 설정
BACKUP_SETTINGS = {
    "auto_backup": True,
    "backup_frequency": "daily",  # hourly, daily, weekly
    "backup_retention": 30,  # 30일
    "backup_compression": True,
    "backup_encryption": True,
    "backup_verification": True,
}

# 모니터링 설정
MONITORING_SETTINGS = {
    "health_check_interval": 60,  # 1분
    "performance_monitoring": True,
    "error_tracking": True,
    "uptime_monitoring": True,
    "disk_usage_alert_threshold": 80,  # 80%
    "memory_usage_alert_threshold": 85,  # 85%
    "cpu_usage_alert_threshold": 90,  # 90%
}

# 알림 기본 설정
DEFAULT_NOTIFICATION_SETTINGS = {
    "email_notifications": True,
    "push_notifications": True,
    "desktop_notifications": True,
    "mobile_notifications": True,
    "digest_frequency": "daily",
    "quiet_hours_enabled": True,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
}

# 검색 설정
SEARCH_SETTINGS = {
    "search_results_per_page": 10,
    "max_search_results": 100,
    "search_timeout": 5,  # 5초
    "enable_fuzzy_search": True,
    "search_history_retention": 30,  # 30일
    "index_update_frequency": "realtime",  # realtime, hourly, daily
}

# 내보내기 설정
EXPORT_SETTINGS = {
    "max_export_records": 10000,
    "export_timeout": 300,  # 5분
    "supported_formats": ["csv", "xlsx", "json", "pdf"],
    "async_export_threshold": 1000,  # 1000개 이상 비동기 처리
    "export_retention_hours": 24,  # 24시간
}

# 통계 및 분석 설정
ANALYTICS_SETTINGS = {
    "track_user_activity": True,
    "track_performance_metrics": True,
    "anonymize_data": True,
    "data_retention_months": 12,  # 12개월
    "real_time_analytics": True,
    "export_analytics": True,
}

# 개발 환경 설정
DEVELOPMENT_SETTINGS = {
    "debug_mode": False,
    "profiling_enabled": False,
    "test_data_enabled": False,
    "mock_external_services": False,
    "auto_reload": False,
    "detailed_error_pages": False,
}

# 성능 최적화 설정
PERFORMANCE_SETTINGS = {
    "enable_caching": True,
    "cache_backend": "redis",  # redis, memcached, memory
    "enable_compression": True,
    "lazy_loading": True,
    "prefetch_related": True,
    "connection_pooling": True,
    "query_optimization": True,
}

# API 설정
API_SETTINGS = {
    "api_version": "v1",
    "cors_enabled": True,
    "cors_origins": ["http://localhost:3000"],
    "api_documentation": True,
    "request_logging": True,
    "response_compression": True,
    "api_key_required": False,
}

# 국제화 설정
I18N_SETTINGS = {
    "default_language": "ko",
    "supported_languages": ["ko", "en", "ja", "zh"],
    "timezone_support": True,
    "date_format": "YYYY-MM-DD",
    "time_format": "HH:mm:ss",
    "currency_format": "KRW",
}

# 테마 설정
THEME_SETTINGS = {
    "default_theme": "light",
    "supported_themes": ["light", "dark", "auto"],
    "custom_themes": True,
    "theme_persistence": True,
    "user_theme_override": True,
}

# 웹훅 설정
WEBHOOK_SETTINGS = {
    "max_webhooks_per_user": 10,
    "webhook_timeout": 30,  # 30초
    "retry_attempts": 3,
    "retry_backoff": "exponential",
    "webhook_verification": True,
    "payload_size_limit": 1024 * 1024,  # 1MB
}

# 데이터베이스 설정
DATABASE_SETTINGS = {
    "connection_pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600,
    "query_timeout": 30,
    "slow_query_threshold": 1.0,  # 1초
}

# 로깅 설정
LOGGING_SETTINGS = {
    "log_level": LogLevel.INFO,
    "log_format": "json",  # json, text
    "log_rotation": "daily",
    "log_retention_days": 30,
    "sensitive_data_masking": True,
    "structured_logging": True,
}

# 보안 헤더 설정
SECURITY_HEADERS = {
    "strict_transport_security": "max-age=31536000; includeSubDomains",
    "content_security_policy": "default-src 'self'",
    "x_frame_options": "DENY",
    "x_content_type_options": "nosniff",
    "referrer_policy": "strict-origin-when-cross-origin",
}

# 미디어 설정
MEDIA_SETTINGS = {
    "upload_path": "/uploads",
    "allowed_domains": ["localhost", "*.example.com"],
    "image_optimization": True,
    "thumbnail_sizes": [50, 100, 200, 400],
    "video_processing": False,
    "cdn_enabled": False,
}

# 작업 큐 설정
QUEUE_SETTINGS = {
    "default_queue": "default",
    "high_priority_queue": "high",
    "low_priority_queue": "low",
    "max_retries": 3,
    "retry_delay": 60,  # 60초
    "worker_concurrency": 4,
}

# 외부 서비스 통합 설정
INTEGRATION_SETTINGS = {
    "email_service": {
        "provider": "smtp",
        "timeout": 30,
        "max_recipients": 100,
    },
    "storage_service": {
        "provider": "local",  # local, s3, gcs
        "backup_enabled": True,
    },
    "search_service": {
        "provider": "database",  # database, elasticsearch
        "indexing_enabled": True,
    },
}

# 기본값
DEFAULT_NOTIFICATION_TYPE = NotificationType.INFO
DEFAULT_FILE_TYPE = FileType.OTHER
DEFAULT_LOG_LEVEL = LogLevel.INFO
DEFAULT_SYSTEM_STATUS = SystemStatus.ONLINE

# 시스템 제한값
SYSTEM_LIMITS = {
    "max_users": 10000,
    "max_projects_per_user": 100,
    "max_tasks_per_project": 1000,
    "max_file_uploads_per_day": 1000,
    "max_api_requests_per_hour": 10000,
    "max_concurrent_sessions": 1000,
}

# 알림 제한값
NOTIFICATION_LIMITS = {
    "max_notifications_per_user": 1000,
    "max_email_per_hour": 100,
    "max_push_notifications_per_day": 500,
    "notification_batch_size": 100,
}

# 파일 처리 설정
FILE_PROCESSING = {
    "virus_scanning": True,
    "metadata_extraction": True,
    "duplicate_detection": True,
    "automatic_cleanup": True,
    "thumbnail_generation": True,
}

# 감사 로그 설정
AUDIT_LOG_SETTINGS = {
    "enabled": True,
    "log_user_actions": True,
    "log_admin_actions": True,
    "log_system_events": True,
    "retention_period": 365,  # 1년
    "anonymize_after_days": 30,
}

# 시스템 메트릭 설정
METRICS_SETTINGS = {
    "collect_performance_metrics": True,
    "collect_usage_metrics": True,
    "collect_error_metrics": True,
    "metrics_retention_days": 90,
    "real_time_metrics": True,
}

# 기능 플래그 설정
FEATURE_FLAGS = {
    "new_dashboard": False,
    "advanced_search": True,
    "real_time_notifications": True,
    "file_versioning": False,
    "ai_assistance": True,
    "collaboration_tools": True,
}

# 시스템 알림 템플릿
SYSTEM_NOTIFICATION_TEMPLATES = {
    "system_maintenance": "시스템 점검이 예정되어 있습니다.",
    "service_degradation": "서비스 성능이 저하되고 있습니다.",
    "security_alert": "보안 위험이 감지되었습니다.",
    "backup_completed": "시스템 백업이 완료되었습니다.",
    "update_available": "새 업데이트가 사용 가능합니다.",
}

# 오류 코드 매핑
ERROR_CODES = {
    "VALIDATION_ERROR": 1001,
    "AUTHENTICATION_ERROR": 1002,
    "AUTHORIZATION_ERROR": 1003,
    "NOT_FOUND_ERROR": 1004,
    "RATE_LIMIT_ERROR": 1005,
    "INTERNAL_SERVER_ERROR": 1006,
    "SERVICE_UNAVAILABLE": 1007,
    "FILE_TOO_LARGE": 1008,
    "INVALID_FILE_TYPE": 1009,
    "QUOTA_EXCEEDED": 1010,
}

# 시스템 상태 확인 엔드포인트
HEALTH_CHECK_ENDPOINTS = {
    "database": "/health/database",
    "redis": "/health/redis",
    "storage": "/health/storage",
    "email": "/health/email",
    "external_apis": "/health/external",
}

# 시스템 이벤트 타입
SYSTEM_EVENTS = {
    "startup": "system_startup",
    "shutdown": "system_shutdown",
    "maintenance_start": "maintenance_start",
    "maintenance_end": "maintenance_end",
    "backup_start": "backup_start",
    "backup_complete": "backup_complete",
    "update_start": "update_start",
    "update_complete": "update_complete",
}

# 시스템 권한
SYSTEM_PERMISSIONS = {
    "system_admin": [
        "view_system_logs",
        "manage_users",
        "system_maintenance",
        "backup_restore",
        "configure_settings",
    ],
    "admin": [
        "view_analytics",
        "manage_projects",
        "manage_users",
        "export_data",
    ],
    "moderator": [
        "moderate_content",
        "view_reports",
        "manage_notifications",
    ],
}

# 색상 테마
SYSTEM_COLORS = {
    NotificationType.INFO: "#3B82F6",  # 파란색
    NotificationType.WARNING: "#F59E0B",  # 주황색
    NotificationType.ERROR: "#EF4444",  # 빨간색
    NotificationType.SUCCESS: "#10B981",  # 녹색
    LogLevel.DEBUG: "#6B7280",  # 회색
    LogLevel.INFO: "#3B82F6",  # 파란색
    LogLevel.WARNING: "#F59E0B",  # 주황색
    LogLevel.ERROR: "#EF4444",  # 빨간색
    LogLevel.CRITICAL: "#7C3AED",  # 보라색
    SystemStatus.ONLINE: "#10B981",  # 녹색
    SystemStatus.OFFLINE: "#EF4444",  # 빨간색
    SystemStatus.MAINTENANCE: "#F59E0B",  # 주황색
    SystemStatus.DEGRADED: "#F59E0B",  # 주황색
}

# 시스템 아이콘
SYSTEM_ICONS = {
    NotificationType.INFO: "🔵",
    NotificationType.WARNING: "🟡",
    NotificationType.ERROR: "🔴",
    NotificationType.SUCCESS: "🟢",
    LogLevel.DEBUG: "🔍",
    LogLevel.INFO: "ℹ️",
    LogLevel.WARNING: "⚠️",
    LogLevel.ERROR: "❌",
    LogLevel.CRITICAL: "🚨",
    SystemStatus.ONLINE: "🟢",
    SystemStatus.OFFLINE: "🔴",
    SystemStatus.MAINTENANCE: "🔧",
    SystemStatus.DEGRADED: "⚡",
}

# 시스템 통계 카테고리
SYSTEM_STATS_CATEGORIES = {
    "users": "사용자 통계",
    "projects": "프로젝트 통계",
    "tasks": "작업 통계",
    "files": "파일 통계",
    "performance": "성능 통계",
    "security": "보안 통계",
}

# 기본 시스템 관리자 정보
DEFAULT_SYSTEM_ADMIN = {
    "username": "system",
    "email": "system@example.com",
    "role": "system_admin",
    "is_active": True,
    "created_by_system": True,
}
