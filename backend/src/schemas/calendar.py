# backend/src/schemas/calendar.py
"""
Calendar Pydantic Schemas

Request/Response schemas for calendar and event management.
"""

from datetime import datetime
from typing import List, Optional

from core.constants import EventStatus, EventType, RecurrenceType
from pydantic import BaseModel, Field, field_validator
from schemas.user import UserPublic


class CalendarBase(BaseModel):
    """Base calendar schema"""

    name: str = Field(
        ..., min_length=1, max_length=100, description="Calendar name"
    )
    description: Optional[str] = Field(
        None, max_length=500, description="Calendar description"
    )
    color: str = Field(
        default="#3b82f6", max_length=7, description="Calendar color (hex)"
    )
    is_public: bool = Field(
        default=False, description="Whether the calendar is public"
    )

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        """Validate color format"""
        # Ensure color is in hex format (e.g., #3b82f6)
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("Color must be in hex format (e.g., #3b82f6)")
        return v

    class Config:
        """Configuration for CalendarBase"""

        from_attributes = True


class CalendarCreateRequest(CalendarBase):
    """Schema for creating a calendar"""


class CalendarUpdateRequest(BaseModel):
    """Schema for updating a calendar"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=7)
    is_public: Optional[bool] = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        """Validate color format"""
        # Ensure color is in hex format (e.g., #3b82f6)
        if v is not None and (not v.startswith("#") or len(v) != 7):
            raise ValueError("Color must be in hex format (e.g., #3b82f6)")
        return v

    class Config:
        """Configuration for CalendarUpdateRequest"""

        from_attributes = True


class CalendarResponse(CalendarBase):
    """Schema for calendar response"""

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: UserPublic

    class Config:
        """Configuration for CalendarResponse"""

        from_attributes = True


class EventBase(BaseModel):
    """Base event schema"""

    title: str = Field(
        ..., min_length=1, max_length=200, description="Event title"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="Event description"
    )
    event_type: str = Field(default="meeting", description="Event type")
    status: str = Field(default="scheduled", description="Event status")

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v):
        """Validate event type"""
        # Ensure event type is one of the defined types
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
                f'Event type must be one of: {", ".join(valid_types)}'
            )
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        """Validate event status"""
        # Ensure status is one of the defined statuses
        valid_statuses = [
            EventStatus.SCHEDULED,
            EventStatus.IN_PROGRESS,
            EventStatus.COMPLETED,
            EventStatus.CANCELLED,
            EventStatus.POSTPONED,
        ]
        if v not in valid_statuses:
            raise ValueError(
                f'Status must be one of: {", ".join(valid_statuses)}'
            )
        return v

    class Config:
        """Configuration for EventBase"""

        from_attributes = True


class EventCreateRequest(EventBase):
    """Schema for creating an event"""

    calendar_id: int = Field(..., description="Calendar ID")
    start_datetime: datetime = Field(
        ..., description="Event start date and time"
    )
    end_datetime: datetime = Field(..., description="Event end date and time")
    is_all_day: bool = Field(
        default=False, description="Whether the event is all day"
    )
    location: Optional[str] = Field(
        None, max_length=200, description="Event location"
    )
    recurrence_type: str = Field(default="none", description="Recurrence type")
    recurrence_end_date: Optional[datetime] = Field(
        None, description="Recurrence end date"
    )
    reminder_minutes: Optional[int] = Field(
        None, ge=0, description="Reminder minutes before event"
    )
    project_id: Optional[int] = Field(None, description="Related project ID")
    task_id: Optional[int] = Field(None, description="Related task ID")
    attendee_ids: Optional[List[int]] = Field(
        default=[], description="List of attendee user IDs"
    )

    @field_validator("end_datetime")
    @classmethod
    def validate_end_datetime(cls, v, values):
        """Validate end datetime"""
        # Ensure end datetime is after start datetime
        if "start_datetime" in values and v <= values["start_datetime"]:
            raise ValueError("End datetime must be after start datetime")
        return v

    @field_validator("recurrence_type")
    @classmethod
    def validate_recurrence_type(cls, v):
        """Validate recurrence type"""
        # Ensure recurrence type is one of the defined types
        valid_types = ["none", "daily", "weekly", "monthly", "yearly"]
        if v not in valid_types:
            raise ValueError(
                f'Recurrence type must be one of: {", ".join(valid_types)}'
            )
        return v

    class Config:
        """Configuration for EventCreateRequest"""

        from_attributes = True


class EventUpdateRequest(BaseModel):
    """Schema for updating an event"""

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
        """Validate event type"""
        # Ensure event type is one of the defined types
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
                    f'Event type must be one of: {", ".join(valid_types)}'
                )
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        """Validate event status"""
        # Ensure status is one of the defined statuses
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
                    f'Status must be one of: {", ".join(valid_statuses)}'
                )
        return v

    @field_validator("recurrence_type")
    @classmethod
    def validate_recurrence_type(cls, v):
        """Validate recurrence type"""
        # Ensure recurrence type is one of the defined types
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
                    f'Recurrence type must be one of: {", ".join(valid_types)}'
                )
        return v

    class Config:
        """Configuration for EventUpdateRequest"""

        from_attributes = True


class EventAttendeeResponse(BaseModel):
    """Schema for event attendee response"""

    id: int
    event_id: int
    user_id: int
    response_status: str
    added_at: datetime
    user: UserPublic

    class Config:
        """Configuration for EventAttendeeResponse"""

        from_attributes = True


class EventResponse(EventBase):
    """Schema for event response"""

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
        """Configuration for EventResponse"""

        from_attributes = True


class EventListResponse(BaseModel):
    """Schema for event list response"""

    events: List[EventResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int

    class Config:
        """Configuration for EventListResponse"""

        from_attributes = True


class CalendarListResponse(BaseModel):
    """Schema for calendar list response"""

    calendars: List[CalendarResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int

    class Config:
        """Configuration for CalendarListResponse"""

        from_attributes = True


class EventSearchRequest(BaseModel):
    """Schema for event search request"""

    query: Optional[str] = Field(None, description="Search query")
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
        """Validate event type"""
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
                    f'Event type must be one of: {", ".join(valid_types)}'
                )
        return v

    @field_validator("event_status")
    @classmethod
    def validate_status(cls, v):
        """Validate event status"""
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
                    f'Status must be one of: {", ".join(valid_statuses)}'
                )
        return v

    class Config:
        """Configuration for EventSearchRequest"""

        from_attributes = True


class CalendarViewRequest(BaseModel):
    """Schema for calendar view request"""

    view_type: str = Field(
        default="month", description="View type: day, week, month, year"
    )
    start_date: datetime = Field(..., description="View start date")
    end_date: datetime = Field(..., description="View end date")
    calendar_ids: Optional[List[int]] = Field(
        None, description="Calendar IDs to include"
    )

    @field_validator("view_type")
    @classmethod
    def validate_view_type(cls, v):
        """Validate view type"""
        # Ensure view type is one of the defined types
        valid_types = [
            "day",
            "week",
            "month",
            "year",
        ]
        if v not in valid_types:
            raise ValueError(
                f'View type must be one of: {", ".join(valid_types)}'
            )
        return v

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v, values):
        """Validate end date"""
        # Ensure end date is after start date
        if "start_date" in values and v <= values["start_date"]:
            raise ValueError("End date must be after start date")
        return v

    class Config:
        """Configuration for CalendarViewRequest"""

        from_attributes = True


class CalendarStatsResponse(BaseModel):
    """Schema for calendar statistics"""

    total_events: int
    upcoming_events: int
    overdue_events: int
    events_by_type: dict
    events_by_status: dict
    events_this_week: int
    events_this_month: int

    class Config:
        """Configuration for CalendarStatsResponse"""

        from_attributes = True


class EventDashboardResponse(BaseModel):
    """Schema for event dashboard response"""

    today_events: List[EventResponse]
    upcoming_events: List[EventResponse]
    recent_events: List[EventResponse]
    overdue_events: List[EventResponse]
    event_stats: CalendarStatsResponse

    class Config:
        """Configuration for EventDashboardResponse"""

        from_attributes = True


class EventAttendeeRequest(BaseModel):
    """Schema for event attendee request"""

    user_ids: List[int] = Field(
        ..., description="List of user IDs to add as attendees"
    )

    class Config:
        """Configuration for EventAttendeeRequest"""

        from_attributes = True


class EventAttendeeResponseUpdate(BaseModel):
    """Schema for updating attendee response"""

    response_status: str = Field(
        ..., description="Response status: accepted, declined, tentative"
    )

    @field_validator("response_status")
    @classmethod
    def validate_response_status(cls, v):
        """Validate response status"""
        # Ensure response status is one of the defined statuses
        valid_statuses = [
            "accepted",
            "declined",
            "tentative",
            "pending",
        ]
        if v not in valid_statuses:
            raise ValueError(
                f'Response status must be one of: {", ".join(valid_statuses)}'
            )
        return v

    class Config:
        """Configuration for EventAttendeeResponseUpdate"""

        from_attributes = True


class RecurringEventResponse(BaseModel):
    """Schema for recurring event response"""

    parent_event: EventResponse
    recurring_events: List[EventResponse]
    next_occurrence: Optional[datetime]
    total_occurrences: int
    total_occurrences: int
    total_occurrences: int

    class Config:
        """Configuration for RecurringEventResponse"""

        from_attributes = True
