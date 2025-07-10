"""
채팅 모델 정의

OpenAI API와 연동하여 사용자와의 대화를 저장하고 관리하는 모델들
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DECIMAL,
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from constants.chat import (
    InputMode,
    MessageRole,
    MessageStatus,
    OpenAIModel,
    SessionStatus,
)
from core.database import Base


class ChatSession(Base):
    """
    채팅 세션 모델
    - 사용자별 대화 세션을 관리
    - 여러 메시지들이 하나의 세션에 속함
    """

    __tablename__ = "chat_sessions"

    # 기본 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="생성 타임스탬프",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 업데이트한 사용자",
    )

    title = Column(String(255), nullable=False, default="새 채팅")
    description = Column(Text, nullable=True)

    # 상태 정보
    status = Column(String(20), nullable=False, default=SessionStatus.ACTIVE)
    is_pinned = Column(Boolean, default=False, comment="고정 여부")
    is_favorite = Column(Boolean, default=False, comment="즐겨찾기 여부")

    # OpenAI 설정
    model = Column(String(20), nullable=False, default=OpenAIModel.GPT_3_5_TURBO)
    temperature = Column(String(10), default="0.7", comment="응답 창의성")
    max_tokens = Column(Integer, default=1000, comment="최대 토큰 수")
    system_prompt = Column(Text, nullable=True, comment="시스템 프롬프트")

    # 사용자 관계
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)

    # 메타데이터
    chat_meta = Column(JSON, nullable=True, comment="추가 설정 정보")
    tags = Column(JSON, nullable=True, comment="태그 목록")

    # 통계 정보
    message_count = Column(Integer, default=0, comment="메시지 개수")
    total_tokens = Column(Integer, default=0, comment="사용된 총 토큰")
    total_cost = Column(String(20), default="0.00", comment="사용 비용")

    # 시간 정보
    last_activity_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        comment="마지막 활동 시간",
    )

    # 관계 설정
    user = relationship("User", back_populates="chat_sessions", foreign_keys=[user_id])
    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self):
        return (
            f"<ChatSession(id={self.id}, title='{self.title}', user_id={self.user_id})>"
        )

    @property
    def is_active(self) -> bool:
        """세션이 활성 상태인지 확인"""
        return bool(self.status == SessionStatus.ACTIVE)

    @property
    def display_title(self) -> str:
        """표시할 제목 반환 (빈 제목일 경우 기본값)"""
        value = getattr(self, "title", None)
        if isinstance(value, str) and value.strip():
            return value
        return "새 채팅"


class ChatMessage(Base):
    """
    채팅 메시지 모델
    - 개별 대화 메시지를 저장
    - 사용자 메시지와 AI 응답을 모두 포함
    """

    __tablename__ = "chat_messages"

    # 기본 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="생성 타임스탬프",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 업데이트한 사용자",
    )

    content = Column(Text, nullable=False, comment="메시지 내용")
    role = Column(String(20), nullable=False, comment="메시지 역할")

    # 상태 정보
    status = Column(String(20), nullable=False, default=MessageStatus.SENT)
    is_edited = Column(Boolean, default=False, comment="편집 여부")
    is_deleted = Column(Boolean, default=False, comment="삭제 여부")

    # 세션 관계
    session_id = Column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False
    )

    # 사용자 관계 (메시지 작성자)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # OpenAI 응답 정보 (AI 메시지인 경우)
    model_used = Column(String(20), nullable=True, comment="사용된 모델")
    tokens_used = Column(Integer, nullable=True, comment="사용된 토큰 수")
    cost = Column(String(20), nullable=True, comment="비용")
    response_time = Column(Integer, nullable=True, comment="응답 시간(ms)")

    # 입력 모드 및 파일 정보
    input_mode = Column(String(20), default=InputMode.TEXT, comment="입력 방식")
    attachments = Column(JSON, nullable=True, comment="첨부파일 정보")

    # 메타데이터
    chat_meta = Column(JSON, nullable=True, comment="추가 정보")
    parent_message_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_messages.id"),
        nullable=True,
        comment="부모 메시지 ID (답글용)",
    )
    deleted_at = Column(DateTime, nullable=True, comment="삭제 시간")

    # 관계 설정
    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User", back_populates="chat_messages", foreign_keys=[user_id])
    parent = relationship(
        "ChatMessage",
        remote_side=[id],
        back_populates="replies",
    )
    replies = relationship(
        "ChatMessage",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role}, session_id={self.session_id})>"

    @property
    def is_user_message(self) -> bool:
        """사용자 메시지인지 확인"""
        return bool(self.role == MessageRole.USER)

    @property
    def is_assistant_message(self) -> bool:
        """AI 어시스턴트 메시지인지 확인"""
        return bool(self.role == MessageRole.ASSISTANT)

    @property
    def preview_content(self) -> str:
        """미리보기용 짧은 내용 반환"""
        content = getattr(self, "content", "")
        if isinstance(content, str) and len(content) <= 100:
            return content
        if isinstance(content, str):
            return content[:100] + "..."
        return ""


class ChatTemplate(Base):
    """
    채팅 템플릿 모델
    - 자주 사용하는 프롬프트나 대화 패턴을 저장
    - 사용자가 재사용할 수 있는 템플릿 제공
    """

    __tablename__ = "chat_templates"

    # 기본 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="생성 타임스탬프",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 업데이트한 사용자",
    )

    name = Column(String(255), nullable=False, comment="템플릿 이름")
    description = Column(Text, nullable=True, comment="템플릿 설명")
    content = Column(Text, nullable=False, comment="템플릿 내용")

    # 분류 및 태그
    category = Column(String(100), nullable=True, comment="카테고리")
    tags = Column(JSON, nullable=True, comment="태그 목록")

    # 사용자 관계
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 공개 설정
    is_public = Column(Boolean, default=False, comment="공개 여부")
    is_featured = Column(Boolean, default=False, comment="추천 여부")

    # 사용 통계
    usage_count = Column(Integer, default=0, comment="사용 횟수")
    likes_count = Column(Integer, default=0, comment="좋아요 수")

    # 관계 설정
    user = relationship("User", back_populates="chat_templates", foreign_keys=[user_id])

    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self):
        return (
            f"<ChatTemplate(id={self.id}, name='{self.name}', user_id={self.user_id})>"
        )


class ChatUsageStats(Base):
    """
    채팅 사용 통계 모델
    - OpenAI API 사용량 및 비용 추적
    - 일별/월별 통계 제공
    """

    __tablename__ = "chat_usage_stats"

    # 기본 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False,
        doc="생성 타임스탬프",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 업데이트 타임스탬프",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 업데이트한 사용자",
    )

    # 사용자 관계
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 통계 기간
    date = Column(DateTime, nullable=False, comment="통계 날짜")
    period_type = Column(
        String(20), nullable=False, default="daily", comment="기간 타입"
    )  # daily, weekly, monthly

    # 사용량 통계
    sessions_count = Column(Integer, default=0, comment="세션 수")
    messages_count = Column(Integer, default=0, comment="메시지 수")
    tokens_used = Column(Integer, default=0, comment="사용된 토큰")
    total_cost = Column(DECIMAL(10, 4), default=0.0000, comment="총 비용 (USD)")

    # 모델별 사용량
    model_usage = Column(JSON, nullable=True, comment="모델별 사용량")

    # 관계 설정
    user = relationship(
        "User", back_populates="chat_usage_stats", foreign_keys=[user_id]
    )

    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self):
        return (
            f"<ChatUsageStats(id={self.id}, user_id={self.user_id}, date={self.date})>"
        )
