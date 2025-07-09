"""
캘린더 Pydantic 스키마

캘린더 및 이벤트 관리를 위한 요청/응답 스키마입니다.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from constants.calendar import EventStatus, EventType, RecurrenceType
from schemas.user import UserPublic


class CalendarBase(BaseModel):
    """기본 캘린더 스키마"""

    name: str = Field(..., min_length=1, max_length=100, description="캘린더 이름")
    description: Optional[str] = Field(None, max_length=500, description="캘린더 설명")
    color: str = Field(
        default="#3b82f6", max_length=7, description="캘린더 색상 (16진수)"
    )
    is_public: bool = Field(default=False, description="공개 캘린더 여부")

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        """색상 형식 검증"""
        # 색상이 16진수 형식인지 확인 (예: #3b82f6)
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("색상은 16진수 형식이어야 합니다 (예: #3b82f6)")
        return v

    class Config:
        """CalendarBase 설정"""

        from_attributes = True


class CalendarCreateRequest(CalendarBase):
    """캘린더 생성 스키마"""


class CalendarUpdateRequest(BaseModel):
    """캘린더 수정 스키마"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=7)
    is_public: Optional[bool] = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        """색상 형식 검증"""
        # 색상이 16진수 형식인지 확인 (예: #3b82f6)
        if v is not None and (not v.startswith("#") or len(v) != 7):
            raise ValueError("색상은 16진수 형식이어야 합니다 (예: #3b82f6)")
        return v

    class Config:
        """CalendarUpdateRequest 설정"""

        from_attributes = True


class CalendarResponse(CalendarBase):
    """캘린더 응답 스키마"""

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: UserPublic

    class Config:
        """CalendarResponse 설정"""

        from_attributes = True


class EventBase(BaseModel):
    """기본 이벤트 스키마"""

    title: str = Field(..., min_length=1, max_length=200, description="이벤트 제목")
    description: Optional[str] = Field(None, max_length=2000, description="이벤트 설명")
    event_type: str = Field(default="meeting", description="이벤트 유형")
    status: str = Field(default="scheduled", description="이벤트 상태")

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v):
        """이벤트 유형 검증"""
        # 이벤트 유형이 정의된 유형 중 하나인지 확인
        valid_types = [
            EventType.MEETING,
            EventType.DEADLINE,
            EventType.MILESTONE,
            EventType.PERSONAL,
            EventType.HOLIDAY,
            EventType.REMINDER,
        ]
        if v not in valid_types:
            raise ValueError(
                f"이벤트 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
            )
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        """이벤트 상태 검증"""
        # 상태가 정의된 상태 중 하나인지 확인
        valid_statuses = [
            EventStatus.SCHEDULED,
            EventStatus.IN_PROGRESS,
            EventStatus.COMPLETED,
            EventStatus.CANCELLED,
            EventStatus.POSTPONED,
        ]
        if v not in valid_statuses:
            raise ValueError(
                f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
            )
        return v

    class Config:
        """EventBase 설정"""

        from_attributes = True


class EventCreateRequest(EventBase):
    """이벤트 생성 스키마"""

    calendar_id: int = Field(..., description="캘린더 ID")
    start_datetime: datetime = Field(..., description="이벤트 시작 날짜 및 시간")
    end_datetime: datetime = Field(..., description="이벤트 종료 날짜 및 시간")
    is_all_day: bool = Field(default=False, description="종일 이벤트 여부")
    location: Optional[str] = Field(None, max_length=200, description="이벤트 장소")
    recurrence_type: str = Field(default="none", description="반복 유형")
    recurrence_end_date: Optional[datetime] = Field(None, description="반복 종료 날짜")
    reminder_minutes: Optional[int] = Field(
        None, ge=0, description="이벤트 전 알림 시간(분)"
    )
    project_id: Optional[int] = Field(None, description="연관된 프로젝트 ID")
    task_id: Optional[int] = Field(None, description="연관된 작업 ID")
    attendee_ids: Optional[List[int]] = Field(
        default=[], description="참석자 사용자 ID 목록"
    )

    @field_validator("end_datetime")
    @classmethod
    def validate_end_datetime(cls, v, values):
        """종료 날짜시간 검증"""
        # 종료 날짜시간이 시작 날짜시간보다 늦은지 확인
        if "start_datetime" in values and v <= values["start_datetime"]:
            raise ValueError("종료 날짜시간은 시작 날짜시간보다 늦어야 합니다")
        return v

    @field_validator("recurrence_type")
    @classmethod
    def validate_recurrence_type(cls, v):
        """반복 유형 검증"""
        # 반복 유형이 정의된 유형 중 하나인지 확인
        valid_types = ["none", "daily", "weekly", "monthly", "yearly"]
        if v not in valid_types:
            raise ValueError(
                f"반복 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
            )
        return v

    class Config:
        """EventCreateRequest 설정"""

        from_attributes = True


class EventUpdateRequest(BaseModel):
    """이벤트 수정 스키마"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    event_type: Optional[str] = None
    status: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    location: Optional[str] = Field(None, max_length=200)
    recurrence_type: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    reminder_minutes: Optional[int] = Field(None, ge=0)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v):
        """이벤트 유형 검증"""
        # 이벤트 유형이 정의된 유형 중 하나인지 확인
        if v is not None:
            valid_types = [
                EventType.MEETING,
                EventType.DEADLINE,
                EventType.MILESTONE,
                EventType.PERSONAL,
                EventType.HOLIDAY,
                EventType.REMINDER,
            ]
            if v not in valid_types:
                raise ValueError(
                    f"이벤트 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
                )
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        """이벤트 상태 검증"""
        # 상태가 정의된 상태 중 하나인지 확인
        if v is not None:
            valid_statuses = [
                EventStatus.SCHEDULED,
                EventStatus.IN_PROGRESS,
                EventStatus.COMPLETED,
                EventStatus.CANCELLED,
                EventStatus.POSTPONED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    @field_validator("recurrence_type")
    @classmethod
    def validate_recurrence_type(cls, v):
        """반복 유형 검증"""
        # 반복 유형이 정의된 유형 중 하나인지 확인
        if v is not None:
            valid_types = [
                RecurrenceType.NONE,
                RecurrenceType.DAILY,
                RecurrenceType.WEEKLY,
                RecurrenceType.MONTHLY,
                RecurrenceType.YEARLY,
            ]
            if v not in valid_types:
                raise ValueError(
                    f"반복 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
                )
        return v

    class Config:
        """EventUpdateRequest 설정"""

        from_attributes = True


class EventAttendeeResponse(BaseModel):
    """이벤트 참석자 응답 스키마"""

    id: int
    event_id: int
    user_id: int
    response_status: str
    added_at: datetime
    user: UserPublic

    class Config:
        """EventAttendeeResponse 설정"""

        from_attributes = True


class EventResponse(EventBase):
    """이벤트 응답 스키마"""

    id: int
    calendar_id: int
    creator_id: int
    start_datetime: datetime
    end_datetime: datetime
    is_all_day: bool = False
    location: Optional[str] = None
    recurrence_type: str = "none"
    recurrence_end_date: Optional[datetime] = None
    reminder_minutes: Optional[int] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    creator: UserPublic
    calendar: CalendarResponse
    attendees: List[EventAttendeeResponse] = []

    class Config:
        """EventResponse 설정"""

        from_attributes = True


class EventListResponse(BaseModel):
    """이벤트 목록 응답 스키마"""

    events: List[EventResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int

    class Config:
        """EventListResponse 설정"""

        from_attributes = True


class CalendarListResponse(BaseModel):
    """캘린더 목록 응답 스키마"""

    calendars: List[CalendarResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int

    class Config:
        """CalendarListResponse 설정"""

        from_attributes = True


class EventSearchRequest(BaseModel):
    """이벤트 검색 요청 스키마"""

    query: Optional[str] = Field(None, description="검색 쿼리")
    calendar_id: Optional[int] = None
    event_type: Optional[str] = None
    event_status: Optional[str] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    end_date_from: Optional[datetime] = None
    end_date_to: Optional[datetime] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    is_all_day: Optional[bool] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v):
        """이벤트 유형 검증"""
        if v is not None:
            valid_types = [
                EventType.MEETING,
                EventType.DEADLINE,
                EventType.MILESTONE,
                EventType.PERSONAL,
                EventType.HOLIDAY,
                EventType.REMINDER,
            ]
            if v not in valid_types:
                raise ValueError(
                    f"이벤트 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
                )
        return v

    @field_validator("event_status")
    @classmethod
    def validate_status(cls, v):
        """이벤트 상태 검증"""
        if v is not None:
            valid_statuses = [
                EventStatus.SCHEDULED,
                EventStatus.IN_PROGRESS,
                EventStatus.COMPLETED,
                EventStatus.CANCELLED,
                EventStatus.POSTPONED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    class Config:
        """EventSearchRequest 설정"""

        from_attributes = True


class CalendarViewRequest(BaseModel):
    """캘린더 뷰 요청 스키마"""

    view_type: str = Field(
        default="month", description="뷰 유형: day, week, month, year"
    )
    start_date: datetime = Field(..., description="뷰 시작 날짜")
    end_date: datetime = Field(..., description="뷰 종료 날짜")
    calendar_ids: Optional[List[int]] = Field(None, description="포함할 캘린더 ID 목록")

    @field_validator("view_type")
    @classmethod
    def validate_view_type(cls, v):
        """뷰 유형 검증"""
        # 뷰 유형이 정의된 유형 중 하나인지 확인
        valid_types = [
            "day",
            "week",
            "month",
            "year",
        ]
        if v not in valid_types:
            raise ValueError(
                f"뷰 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
            )
        return v

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v, values):
        """종료 날짜 검증"""
        # 종료 날짜가 시작 날짜보다 늦은지 확인
        if "start_date" in values and v <= values["start_date"]:
            raise ValueError("종료 날짜는 시작 날짜보다 늦어야 합니다")
        return v

    class Config:
        """CalendarViewRequest 설정"""

        from_attributes = True


class CalendarStatsResponse(BaseModel):
    """캘린더 통계 스키마"""

    total_events: int
    upcoming_events: int
    overdue_events: int
    events_by_type: dict
    events_by_status: dict
    events_this_week: int
    events_this_month: int

    class Config:
        """CalendarStatsResponse 설정"""

        from_attributes = True


class EventDashboardResponse(BaseModel):
    """이벤트 대시보드 응답 스키마"""

    today_events: List[EventResponse]
    upcoming_events: List[EventResponse]
    recent_events: List[EventResponse]
    overdue_events: List[EventResponse]
    event_stats: CalendarStatsResponse

    class Config:
        """EventDashboardResponse 설정"""

        from_attributes = True


class EventAttendeeRequest(BaseModel):
    """이벤트 참석자 요청 스키마"""

    user_ids: List[int] = Field(..., description="참석자로 추가할 사용자 ID 목록")

    class Config:
        """EventAttendeeRequest 설정"""

        from_attributes = True


class EventAttendeeResponseUpdate(BaseModel):
    """참석자 응답 수정 스키마"""

    response_status: str = Field(
        ..., description="응답 상태: accepted, declined, tentative"
    )

    @field_validator("response_status")
    @classmethod
    def validate_response_status(cls, v):
        """응답 상태 검증"""
        # 응답 상태가 정의된 상태 중 하나인지 확인
        valid_statuses = [
            "accepted",
            "declined",
            "tentative",
            "pending",
        ]
        if v not in valid_statuses:
            raise ValueError(
                f"응답 상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
            )
        return v

    class Config:
        """EventAttendeeResponseUpdate 설정"""

        from_attributes = True


class RecurringEventResponse(BaseModel):
    """반복 이벤트 응답 스키마"""

    parent_event: EventResponse
    recurring_events: List[EventResponse]
    next_occurrence: Optional[datetime]
    total_occurrences: int

    class Config:
        """RecurringEventResponse 설정"""

        from_attributes = True
