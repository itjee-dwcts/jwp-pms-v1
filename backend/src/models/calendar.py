"""
캘린더 모델

캘린더 및 이벤트 관리를 위한 SQLAlchemy 모델들입니다.
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
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from constants.calendar import (
    EventAttendeeStatus,
    EventReminder,
    EventStatus,
    EventType,
    RecurrenceType,
)
from core.base import Base

if TYPE_CHECKING:
    pass


class Calendar(Base):
    """
    이벤트 구성을 위한 캘린더 모델
    """

    __tablename__ = "calendars"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="캘린더 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="이 캘린더를 생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="이 캘린더를 마지막으로 수정한 사용자",
    )

    # 기본 정보
    name = Column(String(100), nullable=False, doc="캘린더 이름")
    description = Column(Text, nullable=True, doc="캘린더 설명")
    color = Column(
        String(7),
        default="#3B82F6",
        nullable=False,
        doc="캘린더 색상 (16진수)",
    )

    # 소유권 및 표시 여부
    owner_id = Column(UUID, ForeignKey("users.id"), nullable=False, doc="캘린더 소유자")
    is_default = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="사용자의 기본 캘린더 여부",
    )
    is_public = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="공개 캘린더 여부",
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="활성 캘린더 여부",
    )

    # 관계
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    owner = relationship("User", foreign_keys=[owner_id], back_populates="calendars")
    events = relationship(
        "Event", back_populates="calendar", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Calendar(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"


class Event(Base):
    """
    캘린더 이벤트 모델
    """

    __tablename__ = "events"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="이벤트 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="이 이벤트를 생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=datetime.now(timezone.utc),
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="이 이벤트를 마지막으로 수정한 사용자",
    )

    # 기본 정보
    title = Column(String(200), nullable=False, doc="이벤트 제목")
    description = Column(Text, nullable=True, doc="이벤트 설명")
    location = Column(String(200), nullable=True, doc="이벤트 장소")

    # 시간 정보
    start_time = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="이벤트 시작 시간",
    )
    end_time = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        doc="이벤트 종료 시간",
    )
    is_all_day = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="종일 이벤트 여부",
    )
    time_zone = Column(String(50), nullable=True, doc="이벤트 시간대")

    # 상태 및 유형
    event_type = Column(
        String(20),  # Enum(EventType),
        default=EventType.MEETING,
        nullable=False,
        doc="이벤트 유형",
    )
    status = Column(
        String(20),  # Enum(EventStatus),
        default=EventStatus.SCHEDULED,
        nullable=False,
        doc="이벤트 상태",
    )

    # 연관 관계
    calendar_id = Column(
        UUID,
        ForeignKey("calendars.id"),
        nullable=False,
        doc="연관된 캘린더",
    )
    project_id = Column(
        UUID,
        ForeignKey("projects.id"),
        nullable=True,
        doc="연관된 프로젝트 (선택적)",
    )
    task_id = Column(
        UUID,
        ForeignKey("tasks.id"),
        nullable=True,
        doc="연관된 작업 (선택적)",
    )
    owner_id = Column(UUID, ForeignKey("users.id"), nullable=False, doc="이벤트 소유자")

    # 반복 설정
    recurrence_type = Column(
        String(20),  # Enum(RecurrenceType),
        default=RecurrenceType.NONE,
        nullable=False,
        doc="반복 패턴",
    )
    recurrence_interval = Column(
        Integer,
        default=1,
        nullable=False,
        doc="반복 간격 (예: 매 2주)",
    )
    recurrence_end_date = Column(
        DateTime(timezone=True), nullable=True, doc="반복 종료 날짜"
    )
    parent_id = Column(
        UUID,
        ForeignKey("events.id"),
        nullable=True,
        doc="반복 인스턴스의 부모 이벤트",
    )

    # 알림 설정
    reminder_type = Column(
        String(20),  # Enum(EventReminder),
        default=EventReminder.NONE,
        nullable=False,
        doc="알림 유형 (예: 이메일, 푸시 알림)",
    )

    reminder_minutes = Column(Integer, nullable=True, doc="이벤트 전 알림 시간 (분)")

    # 회의 정보
    meeting_url = Column(String(500), nullable=True, doc="회의 URL (예: Zoom, Teams)")
    meeting_id = Column(String(100), nullable=True, doc="회의 ID")
    meeting_password = Column(String(100), nullable=True, doc="회의 비밀번호")

    # 관계
    calendar = relationship(
        "Calendar", foreign_keys=[calendar_id], back_populates="events"
    )
    project = relationship(
        "Project", foreign_keys=[project_id], back_populates="events"
    )
    task = relationship("Task", foreign_keys=[task_id], back_populates="events")
    owner = relationship("User", back_populates="owned_events", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    # parent_event = relationship("Event", remote_side=[Base.id])
    parent_event = relationship(
        "Event",
        remote_side=lambda: Event.id,
        back_populates="recurring_instances",
    )

    recurring_instances = relationship(
        "Event", back_populates="parent_event", cascade="all, delete-orphan"
    )

    attendees = relationship(
        "EventAttendee", back_populates="event", cascade="all, delete-orphan"
    )

    # 제약 조건
    __table_args__ = (
        CheckConstraint("start_time <= end_time", name="ck_event_time_order"),
        CheckConstraint(
            "recurrence_interval > 0",
            name="ck_event_recurrence_interval_positive",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Event(id={self.id}, title='{self.title}', start_time={self.start_time})>"
        )


class EventAttendee(Base):
    """
    이벤트 참석자 모델
    """

    __tablename__ = "event_attendees"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="참석자 ID",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="이 참석자 기록을 생성한 사용자",
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=datetime.now(timezone.utc),
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="이 참석자 기록을 마지막으로 수정한 사용자",
    )

    # 기본 정보
    event_id = Column(UUID, ForeignKey("events.id"), nullable=False, doc="이벤트 ID")
    user_id = Column(
        UUID, ForeignKey("users.id"), nullable=False, doc="참석자 사용자 ID"
    )
    status = Column(
        String(20),
        default=EventAttendeeStatus.INVITED,
        nullable=False,
        doc="참석 상태 (초대됨, 수락, 거절, 미정)",
    )
    response_at = Column(
        DateTime(timezone=True),
        nullable=True,
        doc="사용자가 초대에 응답한 시간",
    )
    is_organizer = Column(
        Boolean,
        default=False,
        nullable=False,
        doc="참석자가 주최자인지 여부",
    )

    # 관계
    event = relationship("Event", back_populates="attendees", foreign_keys=[event_id])
    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    def __repr__(self) -> str:
        return (
            f"<EventAttendee(event_id={self.event_id}, "
            f"user_id={self.user_id}, "
            f"status='{self.status}')>"
        )
