"""
채팅 관련 상수 정의

OpenAI API 연동 및 채팅 기능에 사용되는 모든 상수들
"""

from enum import Enum
from typing import List, Tuple


class MessageRole(str, Enum):
    """메시지 역할 상수"""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

    @classmethod
    def choices(cls) -> List[Tuple[str, str]]:
        """Django 스타일 선택지 반환"""
        return [
            (cls.USER, "사용자"),
            (cls.ASSISTANT, "AI 어시스턴트"),
            (cls.SYSTEM, "시스템"),
        ]

    @classmethod
    def values(cls) -> List[str]:
        """모든 값들의 리스트 반환"""
        return [choice.value for choice in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """유효한 값인지 확인"""
        return value in cls.values()


class SessionStatus(str, Enum):
    """채팅 세션 상태 상수"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

    @classmethod
    def choices(cls) -> List[Tuple[str, str]]:
        """Django 스타일 선택지 반환"""
        return [
            (cls.ACTIVE, "활성"),
            (cls.INACTIVE, "비활성"),
            (cls.ARCHIVED, "보관됨"),
        ]

    @classmethod
    def values(cls) -> List[str]:
        """모든 값들의 리스트 반환"""
        return [choice.value for choice in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """유효한 값인지 확인"""
        return value in cls.values()


class MessageStatus(str, Enum):
    """메시지 상태 상수"""

    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    ERROR = "error"

    @classmethod
    def choices(cls) -> List[Tuple[str, str]]:
        """Django 스타일 선택지 반환"""
        return [
            (cls.SENDING, "전송 중"),
            (cls.SENT, "전송됨"),
            (cls.DELIVERED, "전달됨"),
            (cls.ERROR, "오류"),
        ]

    @classmethod
    def values(cls) -> List[str]:
        """모든 값들의 리스트 반환"""
        return [choice.value for choice in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """유효한 값인지 확인"""
        return value in cls.values()


class OpenAIModel(str, Enum):
    """OpenAI 모델 상수"""

    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_4_VISION = "gpt-4-vision-preview"

    @classmethod
    def choices(cls) -> List[Tuple[str, str]]:
        """Django 스타일 선택지 반환"""
        return [
            (cls.GPT_3_5_TURBO, "GPT-3.5 Turbo"),
            (cls.GPT_4, "GPT-4"),
            (cls.GPT_4_TURBO, "GPT-4 Turbo"),
            (cls.GPT_4_VISION, "GPT-4 Vision"),
        ]

    @classmethod
    def values(cls) -> List[str]:
        """모든 값들의 리스트 반환"""
        return [choice.value for choice in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """유효한 값인지 확인"""
        return value in cls.values()


class InputMode(str, Enum):
    """입력 방식 상수"""

    TEXT = "text"
    VOICE = "voice"
    FILE = "file"

    @classmethod
    def choices(cls) -> List[Tuple[str, str]]:
        """Django 스타일 선택지 반환"""
        return [
            (cls.TEXT, "텍스트"),
            (cls.VOICE, "음성"),
            (cls.FILE, "파일"),
        ]

    @classmethod
    def values(cls) -> List[str]:
        """모든 값들의 리스트 반환"""
        return [choice.value for choice in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """유효한 값인지 확인"""
        return value in cls.values()
