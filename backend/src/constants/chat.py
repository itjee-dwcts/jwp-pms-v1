"""
채팅 관련 상수 정의

OpenAI API 연동 및 채팅 기능에 사용되는 모든 상수들
"""


class MessageRole:
    """메시지 역할 상수"""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.USER, "사용자"),
            (cls.ASSISTANT, "AI 어시스턴트"),
            (cls.SYSTEM, "시스템"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.USER,
            cls.ASSISTANT,
            cls.SYSTEM,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_role_icon(cls, role: str) -> str:
        """역할별 아이콘 반환"""
        icons = {
            cls.USER: "👤",
            cls.ASSISTANT: "🤖",
            cls.SYSTEM: "⚙️",
        }
        return icons.get(role, "💬")

    @classmethod
    def can_edit_message(cls, role: str) -> bool:
        """메시지 수정 가능 여부 확인"""
        return role == cls.USER

    @classmethod
    def requires_response(cls, role: str) -> bool:
        """응답이 필요한 역할인지 확인"""
        return role in [cls.USER, cls.SYSTEM]


class SessionStatus:
    """채팅 세션 상태 상수"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    DELETED = "deleted"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ACTIVE, "활성"),
            (cls.INACTIVE, "비활성"),
            (cls.ARCHIVED, "보관됨"),
            (cls.DELETED, "삭제됨"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.ACTIVE,
            cls.INACTIVE,
            cls.ARCHIVED,
            cls.DELETED,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_accessible(cls, status: str) -> bool:
        """접근 가능한 상태인지 확인"""
        return status in [cls.ACTIVE, cls.INACTIVE, cls.ARCHIVED]

    @classmethod
    def can_send_message(cls, status: str) -> bool:
        """메시지 전송 가능한 상태인지 확인"""
        return status == cls.ACTIVE

    @classmethod
    def can_modify(cls, status: str) -> bool:
        """수정 가능한 상태인지 확인"""
        return status in [cls.ACTIVE, cls.INACTIVE]

    @classmethod
    def get_status_color(cls, status: str) -> str:
        """상태별 색상 반환"""
        colors = {
            cls.ACTIVE: "green",
            cls.INACTIVE: "gray",
            cls.ARCHIVED: "blue",
            cls.DELETED: "red",
        }
        return colors.get(status, "gray")


class MessageStatus:
    """메시지 상태 상수"""

    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ERROR = "error"
    FAILED = "failed"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.PENDING, "대기 중"),
            (cls.SENDING, "전송 중"),
            (cls.SENT, "전송됨"),
            (cls.DELIVERED, "전달됨"),
            (cls.READ, "읽음"),
            (cls.ERROR, "오류"),
            (cls.FAILED, "실패"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.PENDING,
            cls.SENDING,
            cls.SENT,
            cls.DELIVERED,
            cls.READ,
            cls.ERROR,
            cls.FAILED,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_success(cls, status: str) -> bool:
        """성공 상태인지 확인"""
        return status in [cls.SENT, cls.DELIVERED, cls.READ]

    @classmethod
    def is_error(cls, status: str) -> bool:
        """오류 상태인지 확인"""
        return status in [cls.ERROR, cls.FAILED]

    @classmethod
    def is_processing(cls, status: str) -> bool:
        """처리 중인 상태인지 확인"""
        return status in [cls.PENDING, cls.SENDING]

    @classmethod
    def can_retry(cls, status: str) -> bool:
        """재시도 가능한 상태인지 확인"""
        return status in [cls.ERROR, cls.FAILED]

    @classmethod
    def get_status_icon(cls, status: str) -> str:
        """상태별 아이콘 반환"""
        icons = {
            cls.PENDING: "⏳",
            cls.SENDING: "📤",
            cls.SENT: "✅",
            cls.DELIVERED: "📬",
            cls.READ: "👁️",
            cls.ERROR: "⚠️",
            cls.FAILED: "❌",
        }
        return icons.get(status, "❓")


class OpenAIModel:
    """OpenAI 모델 상수"""

    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_4_VISION = "gpt-4-vision-preview"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.GPT_3_5_TURBO, "GPT-3.5 Turbo"),
            (cls.GPT_4, "GPT-4"),
            (cls.GPT_4_TURBO, "GPT-4 Turbo"),
            (cls.GPT_4_VISION, "GPT-4 Vision"),
            (cls.GPT_4O, "GPT-4o"),
            (cls.GPT_4O_MINI, "GPT-4o Mini"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.GPT_3_5_TURBO,
            cls.GPT_4,
            cls.GPT_4_TURBO,
            cls.GPT_4_VISION,
            cls.GPT_4O,
            cls.GPT_4O_MINI,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def supports_vision(cls, model: str) -> bool:
        """비전 기능 지원 여부 확인"""
        return model in [cls.GPT_4_VISION, cls.GPT_4O]

    @classmethod
    def is_latest_model(cls, model: str) -> bool:
        """최신 모델인지 확인"""
        return model in [cls.GPT_4O, cls.GPT_4O_MINI, cls.GPT_4_TURBO]

    @classmethod
    def get_max_tokens(cls, model: str) -> int:
        """모델별 최대 토큰 수 반환"""
        token_limits = {
            cls.GPT_3_5_TURBO: 4096,
            cls.GPT_4: 8192,
            cls.GPT_4_TURBO: 128000,
            cls.GPT_4_VISION: 128000,
            cls.GPT_4O: 128000,
            cls.GPT_4O_MINI: 128000,
        }
        return token_limits.get(model, 4096)

    @classmethod
    def get_cost_per_token(cls, model: str) -> dict:
        """모델별 토큰당 비용 반환 (USD)"""
        costs = {
            cls.GPT_3_5_TURBO: {"input": 0.0015, "output": 0.002},
            cls.GPT_4: {"input": 0.03, "output": 0.06},
            cls.GPT_4_TURBO: {"input": 0.01, "output": 0.03},
            cls.GPT_4_VISION: {"input": 0.01, "output": 0.03},
            cls.GPT_4O: {"input": 0.005, "output": 0.015},
            cls.GPT_4O_MINI: {"input": 0.00015, "output": 0.0006},
        }
        return costs.get(model, {"input": 0.002, "output": 0.002})


class InputMode:
    """입력 방식 상수"""

    TEXT = "text"
    VOICE = "voice"
    FILE = "file"
    IMAGE = "image"
    CODE = "code"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.TEXT, "텍스트"),
            (cls.VOICE, "음성"),
            (cls.FILE, "파일"),
            (cls.IMAGE, "이미지"),
            (cls.CODE, "코드"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.TEXT,
            cls.VOICE,
            cls.FILE,
            cls.IMAGE,
            cls.CODE,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def requires_file_upload(cls, mode: str) -> bool:
        """파일 업로드가 필요한 모드인지 확인"""
        return mode in [cls.FILE, cls.IMAGE, cls.VOICE]

    @classmethod
    def supports_streaming(cls, mode: str) -> bool:
        """스트리밍을 지원하는 모드인지 확인"""
        return mode in [cls.TEXT, cls.CODE]

    @classmethod
    def get_mode_icon(cls, mode: str) -> str:
        """입력 모드별 아이콘 반환"""
        icons = {
            cls.TEXT: "💬",
            cls.VOICE: "🎤",
            cls.FILE: "📁",
            cls.IMAGE: "🖼️",
            cls.CODE: "💻",
        }
        return icons.get(mode, "💬")

    @classmethod
    def get_accepted_file_types(cls, mode: str) -> list:
        """입력 모드별 허용되는 파일 타입 반환"""
        file_types = {
            cls.FILE: [".txt", ".pdf", ".doc", ".docx", ".md"],
            cls.IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
            cls.VOICE: [".mp3", ".wav", ".m4a", ".ogg"],
            cls.CODE: [".py", ".js", ".html", ".css", ".json", ".xml"],
        }
        return file_types.get(mode, [])


class ChatTheme:
    """채팅 테마 상수"""

    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"
    HIGH_CONTRAST = "high_contrast"
    COLORFUL = "colorful"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.LIGHT, "라이트"),
            (cls.DARK, "다크"),
            (cls.AUTO, "자동"),
            (cls.HIGH_CONTRAST, "고대비"),
            (cls.COLORFUL, "컬러풀"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.LIGHT,
            cls.DARK,
            cls.AUTO,
            cls.HIGH_CONTRAST,
            cls.COLORFUL,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_theme_colors(cls, theme: str) -> dict:
        """테마별 색상 설정 반환"""
        colors = {
            cls.LIGHT: {
                "background": "#ffffff",
                "text": "#000000",
                "user_bubble": "#007bff",
                "assistant_bubble": "#f8f9fa",
            },
            cls.DARK: {
                "background": "#1a1a1a",
                "text": "#ffffff",
                "user_bubble": "#0d6efd",
                "assistant_bubble": "#343a40",
            },
            cls.HIGH_CONTRAST: {
                "background": "#000000",
                "text": "#ffffff",
                "user_bubble": "#ffff00",
                "assistant_bubble": "#ffffff",
            },
            cls.COLORFUL: {
                "background": "#f0f8ff",
                "text": "#333333",
                "user_bubble": "#ff6b6b",
                "assistant_bubble": "#4ecdc4",
            },
        }
        return colors.get(theme, colors[cls.LIGHT])


# ============================================================================
# 채팅 관련 기본값 및 제한
# ============================================================================

# 기본값
DEFAULT_MESSAGE_ROLE = MessageRole.USER
DEFAULT_SESSION_STATUS = SessionStatus.ACTIVE
DEFAULT_MESSAGE_STATUS = MessageStatus.PENDING
DEFAULT_OPENAI_MODEL = OpenAIModel.GPT_4O_MINI
DEFAULT_INPUT_MODE = InputMode.TEXT
DEFAULT_CHAT_THEME = ChatTheme.LIGHT

# 채팅 제한
CHAT_LIMITS = {
    "max_message_length": 8000,
    "max_messages_per_session": 1000,
    "max_file_size_mb": 25,
    "max_image_size_mb": 20,
    "max_voice_duration_minutes": 10,
    "max_sessions_per_user": 50,
    "rate_limit_messages_per_minute": 30,
    "rate_limit_messages_per_hour": 100,
}

# 색상 매핑
MESSAGE_ROLE_COLORS = {
    MessageRole.USER: "#007bff",
    MessageRole.ASSISTANT: "#28a745",
    MessageRole.SYSTEM: "#ffc107",
}

SESSION_STATUS_COLORS = {
    SessionStatus.ACTIVE: "#28a745",
    SessionStatus.INACTIVE: "#6c757d",
    SessionStatus.ARCHIVED: "#17a2b8",
    SessionStatus.DELETED: "#dc3545",
}

MESSAGE_STATUS_COLORS = {
    MessageStatus.PENDING: "#ffc107",
    MessageStatus.SENDING: "#17a2b8",
    MessageStatus.SENT: "#28a745",
    MessageStatus.DELIVERED: "#20c997",
    MessageStatus.READ: "#6f42c1",
    MessageStatus.ERROR: "#fd7e14",
    MessageStatus.FAILED: "#dc3545",
}

CHAT_THEME_COLORS = {
    ChatTheme.LIGHT: "#ffffff",
    ChatTheme.DARK: "#1a1a1a",
    ChatTheme.AUTO: "#f8f9fa",
    ChatTheme.HIGH_CONTRAST: "#000000",
    ChatTheme.COLORFUL: "#f0f8ff",
}

OPENAI_MODEL_COLORS = {
    OpenAIModel.GPT_3_5_TURBO: "#10b981",
    OpenAIModel.GPT_4: "#3b82f6",
    OpenAIModel.GPT_4_TURBO: "#8b5cf6",
    OpenAIModel.GPT_4_VISION: "#f59e0b",
    OpenAIModel.GPT_4O: "#ef4444",
    OpenAIModel.GPT_4O_MINI: "#06b6d4",
}

INPUT_MODE_COLORS = {
    InputMode.TEXT: "#6c757d",
    InputMode.VOICE: "#dc3545",
    InputMode.FILE: "#fd7e14",
    InputMode.IMAGE: "#20c997",
    InputMode.CODE: "#6f42c1",
}

# 라벨 매핑
MESSAGE_ROLE_LABELS = dict(MessageRole.choices())
SESSION_STATUS_LABELS = dict(SessionStatus.choices())
MESSAGE_STATUS_LABELS = dict(MessageStatus.choices())
CHAT_THEME_LABELS = dict(ChatTheme.choices())
OPENAI_MODEL_LABELS = dict(OpenAIModel.choices())
INPUT_MODE_LABELS = dict(InputMode.choices())

# 옵션 매핑 (프론트엔드용)
MESSAGE_ROLE_OPTIONS = [
    {"value": k, "label": v, "color": MESSAGE_ROLE_COLORS[k]}
    for k, v in MessageRole.choices()
]
SESSION_STATUS_OPTIONS = [
    {"value": k, "label": v, "color": SESSION_STATUS_COLORS[k]}
    for k, v in SessionStatus.choices()
]
MESSAGE_STATUS_OPTIONS = [
    {"value": k, "label": v, "color": MESSAGE_STATUS_COLORS[k]}
    for k, v in MessageStatus.choices()
]
CHAT_THEME_OPTIONS = [
    {"value": k, "label": v, "color": CHAT_THEME_COLORS[k]}
    for k, v in ChatTheme.choices()
]
OPENAI_MODEL_OPTIONS = [
    {"value": k, "label": v, "color": OPENAI_MODEL_COLORS[k]}
    for k, v in OpenAIModel.choices()
]
INPUT_MODE_OPTIONS = [
    {"value": k, "label": v, "color": INPUT_MODE_COLORS[k]}
    for k, v in InputMode.choices()
]

# 채팅 설정
CHAT_SETTINGS = {
    "auto_save_messages": True,
    "show_typing_indicator": True,
    "enable_message_reactions": True,
    "enable_message_editing": True,
    "enable_message_deletion": True,
    "show_timestamps": True,
    "enable_read_receipts": True,
    "auto_scroll_to_bottom": True,
    "enable_sound_notifications": True,
    "compress_old_sessions": True,
    "cleanup_after_days": 90,
}

# API 설정
API_SETTINGS = {
    "openai_api_timeout": 30,
    "max_retries": 3,
    "retry_delay": 1,
    "stream_responses": True,
    "temperature": 0.7,
    "max_tokens": 2000,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0,
}
