# ============================================================================
# constants/chat.py - 채팅 관련 상수 정의 (업데이트된 버전)
# ============================================================================

"""
Chat Related Constants

채팅, 메시지, OpenAI 모델 등 채팅 시스템 관련 상수들을 정의합니다.
기존 chat_constants_complete.py의 내용을 Python 클래스 방식으로 변환했습니다.
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
        return [cls.USER, cls.ASSISTANT, cls.SYSTEM]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_user_message(cls, role: str) -> bool:
        """사용자 메시지인지 확인"""
        return role == cls.USER

    @classmethod
    def is_assistant_message(cls, role: str) -> bool:
        """어시스턴트 메시지인지 확인"""
        return role == cls.ASSISTANT

    @classmethod
    def is_system_message(cls, role: str) -> bool:
        """시스템 메시지인지 확인"""
        return role == cls.SYSTEM


class SessionStatus:
    """세션 상태 상수"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ACTIVE, "활성"),
            (cls.INACTIVE, "비활성"),
            (cls.ARCHIVED, "보관됨"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.ACTIVE, cls.INACTIVE, cls.ARCHIVED]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_active(cls, status: str) -> bool:
        """세션이 활성 상태인지 확인"""
        return status == cls.ACTIVE

    @classmethod
    def can_send_message(cls, status: str) -> bool:
        """메시지를 보낼 수 있는 상태인지 확인"""
        return status == cls.ACTIVE


class MessageStatus:
    """메시지 상태 상수"""

    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    ERROR = "error"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.SENDING, "전송 중"),
            (cls.SENT, "전송됨"),
            (cls.DELIVERED, "배달됨"),
            (cls.ERROR, "오류"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.SENDING, cls.SENT, cls.DELIVERED, cls.ERROR]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_error(cls, status: str) -> bool:
        """오류 상태인지 확인"""
        return status == cls.ERROR

    @classmethod
    def is_successful(cls, status: str) -> bool:
        """성공적으로 처리된 상태인지 확인"""
        return status in [cls.SENT, cls.DELIVERED]


class ChatTheme:
    """채팅 테마 상수"""

    DEFAULT = "default"
    COMPACT = "compact"
    BUBBLE = "bubble"
    MINIMAL = "minimal"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.DEFAULT, "기본"),
            (cls.COMPACT, "컴팩트"),
            (cls.BUBBLE, "버블"),
            (cls.MINIMAL, "미니멀"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.DEFAULT, cls.COMPACT, cls.BUBBLE, cls.MINIMAL]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()


class OpenAIModel:
    """OpenAI 모델 상수"""

    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_4_VISION = "gpt-4-vision-preview"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.GPT_3_5_TURBO, "GPT-3.5 Turbo"),
            (cls.GPT_4, "GPT-4"),
            (cls.GPT_4_TURBO, "GPT-4 Turbo"),
            (cls.GPT_4_VISION, "GPT-4 Vision"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.GPT_3_5_TURBO, cls.GPT_4, cls.GPT_4_TURBO, cls.GPT_4_VISION]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_default_model(cls) -> str:
        """기본 모델 반환"""
        return cls.GPT_3_5_TURBO

    @classmethod
    def supports_vision(cls, model: str) -> bool:
        """비전 기능을 지원하는 모델인지 확인"""
        return model == cls.GPT_4_VISION

    @classmethod
    def get_max_tokens(cls, model: str) -> int:
        """모델별 최대 토큰 수 반환"""
        max_tokens = {
            cls.GPT_3_5_TURBO: 4096,
            cls.GPT_4: 8192,
            cls.GPT_4_TURBO: 128000,
            cls.GPT_4_VISION: 4096,
        }
        return max_tokens.get(model, 4096)


class InputMode:
    """채팅 입력 모드 상수"""

    TEXT = "text"
    VOICE = "voice"
    FILE = "file"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.TEXT, "텍스트"),
            (cls.VOICE, "음성"),
            (cls.FILE, "파일"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.TEXT, cls.VOICE, cls.FILE]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()


# ============================================================================
# 레거시 호환성을 위한 상수 딕셔너리들 (기존 TypeScript 형식)
# ============================================================================

MESSAGE_ROLE = {
    "USER": MessageRole.USER,
    "ASSISTANT": MessageRole.ASSISTANT,
    "SYSTEM": MessageRole.SYSTEM,
}

SESSION_STATUS = {
    "ACTIVE": SessionStatus.ACTIVE,
    "INACTIVE": SessionStatus.INACTIVE,
    "ARCHIVED": SessionStatus.ARCHIVED,
}

MESSAGE_STATUS = {
    "SENDING": MessageStatus.SENDING,
    "SENT": MessageStatus.SENT,
    "DELIVERED": MessageStatus.DELIVERED,
    "ERROR": MessageStatus.ERROR,
}

CHAT_THEME = {
    "DEFAULT": ChatTheme.DEFAULT,
    "COMPACT": ChatTheme.COMPACT,
    "BUBBLE": ChatTheme.BUBBLE,
    "MINIMAL": ChatTheme.MINIMAL,
}

OPENAI_MODEL = {
    "GPT_3_5_TURBO": OpenAIModel.GPT_3_5_TURBO,
    "GPT_4": OpenAIModel.GPT_4,
    "GPT_4_TURBO": OpenAIModel.GPT_4_TURBO,
    "GPT_4_VISION": OpenAIModel.GPT_4_VISION,
}

INPUT_MODE = {
    "TEXT": InputMode.TEXT,
    "VOICE": InputMode.VOICE,
    "FILE": InputMode.FILE,
}

# ============================================================================
# 라벨 매핑
# ============================================================================

MESSAGE_ROLE_LABELS = dict(MessageRole.choices())
SESSION_STATUS_LABELS = dict(SessionStatus.choices())
MESSAGE_STATUS_LABELS = dict(MessageStatus.choices())
CHAT_THEME_LABELS = dict(ChatTheme.choices())
OPENAI_MODEL_LABELS = dict(OpenAIModel.choices())
INPUT_MODE_LABELS = dict(InputMode.choices())

# ============================================================================
# 색상 매핑
# ============================================================================

MESSAGE_ROLE_COLORS = {
    MessageRole.USER: "blue",
    MessageRole.ASSISTANT: "green",
    MessageRole.SYSTEM: "gray",
}

SESSION_STATUS_COLORS = {
    SessionStatus.ACTIVE: "green",
    SessionStatus.INACTIVE: "yellow",
    SessionStatus.ARCHIVED: "gray",
}

MESSAGE_STATUS_COLORS = {
    MessageStatus.SENDING: "yellow",
    MessageStatus.SENT: "green",
    MessageStatus.DELIVERED: "blue",
    MessageStatus.ERROR: "red",
}

CHAT_THEME_COLORS = {
    ChatTheme.DEFAULT: "blue",
    ChatTheme.COMPACT: "purple",
    ChatTheme.BUBBLE: "pink",
    ChatTheme.MINIMAL: "gray",
}

OPENAI_MODEL_COLORS = {
    OpenAIModel.GPT_3_5_TURBO: "green",
    OpenAIModel.GPT_4: "blue",
    OpenAIModel.GPT_4_TURBO: "purple",
    OpenAIModel.GPT_4_VISION: "orange",
}

INPUT_MODE_COLORS = {
    InputMode.TEXT: "blue",
    InputMode.VOICE: "green",
    InputMode.FILE: "orange",
}

# ============================================================================
# 옵션 배열
# ============================================================================

MESSAGE_ROLE_OPTIONS = [
    {"value": value, "label": label} for value, label in MessageRole.choices()
]
SESSION_STATUS_OPTIONS = [
    {"value": value, "label": label} for value, label in SessionStatus.choices()
]
MESSAGE_STATUS_OPTIONS = [
    {"value": value, "label": label} for value, label in MessageStatus.choices()
]
CHAT_THEME_OPTIONS = [
    {"value": value, "label": label} for value, label in ChatTheme.choices()
]
OPENAI_MODEL_OPTIONS = [
    {"value": value, "label": label} for value, label in OpenAIModel.choices()
]
INPUT_MODE_OPTIONS = [
    {"value": value, "label": label} for value, label in InputMode.choices()
]

# ============================================================================
# 채팅 제한 및 설정
# ============================================================================


class ChatLimits:
    """채팅 제한 상수"""

    MAX_MESSAGE_LENGTH = 4000
    MAX_TITLE_LENGTH = 255
    MAX_SESSIONS_PER_USER = 100
    MAX_MESSAGES_PER_SESSION = 1000
    MAX_HISTORY_MESSAGES = 50
    MAX_INPUT_HEIGHT = 120
    MIN_INPUT_HEIGHT = 52
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_CONCURRENT_REQUESTS = 5


class ChatSettings:
    """채팅 기본 설정 상수"""

    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS = 1000
    DEFAULT_MODEL = OpenAIModel.GPT_3_5_TURBO
    DEFAULT_THEME = ChatTheme.DEFAULT
    AUTO_SAVE_INTERVAL = 30000  # 30초
    TYPING_INDICATOR_DELAY = 1000  # 1초
    MESSAGE_RETRY_COUNT = 3
    SESSION_TIMEOUT = 24 * 60 * 60 * 1000  # 24시간


# 레거시 호환성을 위한 딕셔너리
CHAT_LIMITS = {
    "MAX_MESSAGE_LENGTH": ChatLimits.MAX_MESSAGE_LENGTH,
    "MAX_TITLE_LENGTH": ChatLimits.MAX_TITLE_LENGTH,
    "MAX_SESSIONS_PER_USER": ChatLimits.MAX_SESSIONS_PER_USER,
    "MAX_MESSAGES_PER_SESSION": ChatLimits.MAX_MESSAGES_PER_SESSION,
    "MAX_HISTORY_MESSAGES": ChatLimits.MAX_HISTORY_MESSAGES,
    "MAX_INPUT_HEIGHT": ChatLimits.MAX_INPUT_HEIGHT,
    "MIN_INPUT_HEIGHT": ChatLimits.MIN_INPUT_HEIGHT,
    "MAX_FILE_SIZE": ChatLimits.MAX_FILE_SIZE,
    "MAX_CONCURRENT_REQUESTS": ChatLimits.MAX_CONCURRENT_REQUESTS,
}

CHAT_SETTINGS = {
    "DEFAULT_TEMPERATURE": ChatSettings.DEFAULT_TEMPERATURE,
    "DEFAULT_MAX_TOKENS": ChatSettings.DEFAULT_MAX_TOKENS,
    "DEFAULT_MODEL": ChatSettings.DEFAULT_MODEL,
    "DEFAULT_THEME": ChatSettings.DEFAULT_THEME,
    "AUTO_SAVE_INTERVAL": ChatSettings.AUTO_SAVE_INTERVAL,
    "TYPING_INDICATOR_DELAY": ChatSettings.TYPING_INDICATOR_DELAY,
    "MESSAGE_RETRY_COUNT": ChatSettings.MESSAGE_RETRY_COUNT,
    "SESSION_TIMEOUT": ChatSettings.SESSION_TIMEOUT,
}

# ============================================================================
# 모델별 상세 정보
# ============================================================================

MODEL_CAPABILITIES = {
    OpenAIModel.GPT_3_5_TURBO: {
        "supports_vision": False,
        "supports_function_calling": True,
        "supports_streaming": True,
        "supports_json_mode": True,
        "context_window": 16385,
        "training_data_cutoff": "2021-09",
    },
    OpenAIModel.GPT_4: {
        "supports_vision": False,
        "supports_function_calling": True,
        "supports_streaming": True,
        "supports_json_mode": True,
        "context_window": 8192,
        "training_data_cutoff": "2021-09",
    },
    OpenAIModel.GPT_4_TURBO: {
        "supports_vision": False,
        "supports_function_calling": True,
        "supports_streaming": True,
        "supports_json_mode": True,
        "context_window": 128000,
        "training_data_cutoff": "2023-04",
    },
    OpenAIModel.GPT_4_VISION: {
        "supports_vision": True,
        "supports_function_calling": True,
        "supports_streaming": True,
        "supports_json_mode": False,
        "context_window": 128000,
        "training_data_cutoff": "2023-04",
    },
}

MODEL_PRICING = {
    OpenAIModel.GPT_3_5_TURBO: {
        "input_price_per_1k": 0.0015,
        "output_price_per_1k": 0.002,
    },
    OpenAIModel.GPT_4: {
        "input_price_per_1k": 0.03,
        "output_price_per_1k": 0.06,
    },
    OpenAIModel.GPT_4_TURBO: {
        "input_price_per_1k": 0.01,
        "output_price_per_1k": 0.03,
    },
    OpenAIModel.GPT_4_VISION: {
        "input_price_per_1k": 0.01,
        "output_price_per_1k": 0.03,
    },
}

# ============================================================================
# 채팅 알림 및 이벤트 설정
# ============================================================================

CHAT_NOTIFICATIONS = {
    "new_message": True,
    "typing_indicator": True,
    "session_created": True,
    "session_archived": True,
    "error_occurred": True,
    "ai_response_ready": True,
}

CHAT_EVENTS = {
    "message_sent": "message_sent",
    "message_received": "message_received",
    "typing_start": "typing_start",
    "typing_stop": "typing_stop",
    "session_created": "session_created",
    "session_updated": "session_updated",
    "session_archived": "session_archived",
    "error_occurred": "error_occurred",
}

# ============================================================================
# 채팅 이메일 템플릿
# ============================================================================

CHAT_EMAIL_TEMPLATES = {
    "chat_summary": "chat_summary.html",
    "session_export": "session_export.html",
    "ai_chat_invitation": "ai_chat_invitation.html",
    "chat_backup_complete": "chat_backup_complete.html",
}

# ============================================================================
# 기본값
# ============================================================================

DEFAULT_MESSAGE_ROLE = MessageRole.USER
DEFAULT_SESSION_STATUS = SessionStatus.ACTIVE
DEFAULT_MESSAGE_STATUS = MessageStatus.SENT
DEFAULT_CHAT_THEME = ChatTheme.DEFAULT
DEFAULT_OPENAI_MODEL = OpenAIModel.GPT_3_5_TURBO
DEFAULT_INPUT_MODE = InputMode.TEXT
