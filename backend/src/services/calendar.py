"""
Calendar Service

Business logic for calendar and event management operations.
"""

import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, cast

from core.database import get_async_session
from models.calendar import Calendar, Event, EventAttendee
from models.project import Project
from models.task import Task
from models.user import User
from schemas.calendar import (
    CalendarCreateRequest,
    CalendarListResponse,
    CalendarResponse,
    CalendarStatsResponse,
    CalendarUpdateRequest,
    CalendarViewRequest,
    EventCreateRequest,
    EventDashboardResponse,
    EventListResponse,
    EventResponse,
    EventSearchRequest,
    EventUpdateRequest,
)
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import count
from utils.exceptions import AuthorizationError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class CalendarService:
    """Calendar and event management service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_calendar(
        self, calendar_data: CalendarCreateRequest, owner_id: int
    ) -> CalendarResponse:
        """Create a new calendar"""
        try:
            # Verify owner exists
            owner_result = await self.db.execute(
                select(User).where(User.id == owner_id)
            )
            owner = owner_result.scalar_one_or_none()
            if not owner:
                raise NotFoundError(f"Owner with ID {owner_id} not found")

            # Create calendar
            calendar = Calendar(
                name=calendar_data.name,
                description=calendar_data.description,
                color=calendar_data.color,
                is_public=calendar_data.is_public,
                owner_id=owner_id,
                created_by=owner_id,
                updated_by=owner_id,
            )

            self.db.add(calendar)
            await self.db.flush()  # Flush to get the ID

            await self.db.commit()

            # Fetch created calendar with relationships
            result = await self.db.execute(
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar.id)
            )
            created_calendar = result.scalar_one()

            logger.info("Calendar created successfully: %s", calendar.name)
            return CalendarResponse.model_validate(created_calendar)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to create calendar: %s", e)
            raise

    async def get_calendar_by_id(
        self, calendar_id: int, user_id: Optional[int] = None
    ) -> CalendarResponse:
        """Get calendar by ID"""
        try:
            # Build query with relationships
            query = (
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar_id)
            )

            result = await self.db.execute(query)
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(
                    f"Calendar with ID {calendar_id} not found"
                )

            calendar_owner_id = getattr(calendar, "owner_id", None)

            # If user_id is provided, check if they are the owner
            if user_id:
                if calendar_owner_id == user_id:
                    return CalendarResponse.model_validate(calendar)

            # If calendar is public, no need for user_id check
            calendar_is_public = getattr(calendar, "is_public", False)
            if calendar_is_public and user_id is None:
                return CalendarResponse.model_validate(calendar)

            # Check access permissions
            if (
                user_id
                and not calendar_is_public
                and calendar_owner_id != user_id
            ):
                raise AuthorizationError("Access denied to this calendar")

            return CalendarResponse.model_validate(calendar)

        except Exception as e:
            logger.error("Failed to get calendar %d: %s", calendar_id, e)
            raise

    async def update_calendar(
        self,
        calendar_id: int,
        calendar_data: CalendarUpdateRequest,
        user_id: int,
    ) -> CalendarResponse:
        """Update calendar information"""
        try:
            result = await self.db.execute(
                select(Calendar).where(Calendar.id == calendar_id)
            )
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(
                    f"Calendar with ID {calendar_id} not found"
                )

            calendar_owner_id = getattr(calendar, "owner_id", None)
            # Check if user is the owner
            if calendar_owner_id is None:
                raise NotFoundError(
                    f"Calendar with ID {calendar_id} has no owner"
                )

            # Check ownership
            if calendar_owner_id != user_id:
                raise AuthorizationError(
                    "Only calendar owner can update calendar"
                )

            # Update fields
            update_data = calendar_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(calendar, field, value)

            # Update metadata
            # Assuming `updated_by` is a field in Calendar model
            # This is a common pattern to track who made the last change
            # You may need to adjust based on your actual model definition
            setattr(calendar, "updated_by", user_id)
            setattr(calendar, "updated_at", datetime.utcnow())

            # calendar.updated_by = user_id
            # calendar.updated_at = datetime.utcnow()

            await self.db.commit()

            # Fetch updated calendar with relationships
            result = await self.db.execute(
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar_id)
            )
            updated_calendar = result.scalar_one()

            logger.info("Calendar updated successfully: %s", calendar.name)
            return CalendarResponse.model_validate(updated_calendar)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to update calendar %d: %s", calendar_id, e)
            raise

    async def delete_calendar(self, calendar_id: int, user_id: int) -> bool:
        """Delete calendar"""
        try:
            result = await self.db.execute(
                select(Calendar).where(Calendar.id == calendar_id)
            )
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(
                    f"Calendar with ID {calendar_id} not found"
                )

            calendar_owner_id = getattr(calendar, "owner_id", None)
            if calendar_owner_id is None:
                raise NotFoundError(
                    f"Calendar with ID {calendar_id} has no owner"
                )

            # Check ownership
            if calendar_owner_id != user_id:
                raise AuthorizationError(
                    "Only calendar owner can delete calendar"
                )

            # Delete calendar (will cascade to events)
            await self.db.delete(calendar)
            await self.db.commit()

            logger.info("Calendar deleted: %s", calendar.name)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to delete calendar %d: %s", calendar_id, e)
            raise

    async def list_calendars(
        self,
        page_no: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
    ) -> CalendarListResponse:
        """List calendars with pagination"""
        try:
            # Build base query
            query = select(Calendar).options(selectinload(Calendar.owner))

            # Apply access control
            if user_id:
                # User can see public calendars or their own calendars
                query = query.where(
                    or_(
                        Calendar.is_public.is_(True),
                        Calendar.owner_id == user_id,
                    )
                )
            else:
                # Anonymous users can only see public calendars
                query = query.where(Calendar.is_public.is_(True))

            # Get total count
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # Apply pagination and ordering
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(Calendar.created_at))
            )

            # Execute query
            result = await self.db.execute(query)
            calendars = result.scalars().all()

            # Calculate pagination info
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return CalendarListResponse(
                calendars=[
                    CalendarResponse.model_validate(calendar)
                    for calendar in calendars
                ],
                total_items=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
            )

        except Exception as e:
            logger.error("Failed to list calendars: %s", e)
            raise

    async def list_user_calendars(self, user_id: int) -> List[Calendar]:
        """
        list user calendars
        """
        result = await self.db.execute(
            select(Calendar).where(Calendar.user_id == user_id)
        )
        return list(result.scalars().all())

    async def create_event(
        self, event_data: EventCreateRequest, creator_id: int
    ) -> EventResponse:
        """Create a new event"""
        try:
            # Verify calendar exists and user has access
            calendar_result = await self.db.execute(
                select(Calendar).where(Calendar.id == event_data.calendar_id)
            )
            calendar = calendar_result.scalar_one_or_none()
            if not calendar:
                raise NotFoundError(
                    f"Calendar with ID {event_data.calendar_id} not found"
                )

            calendar_owner_id = getattr(calendar, "owner_id", None)
            if calendar_owner_id is None:
                raise NotFoundError(
                    f"Calendar with ID {event_data.calendar_id} has no owner"
                )

            # Check permission to create events in this calendar
            if not calendar_owner_id and calendar_owner_id != creator_id:
                raise AuthorizationError(
                    "No permission to create events in this calendar"
                )

            # Verify related resources if specified
            if event_data.project_id:
                project_result = await self.db.execute(
                    select(Project).where(Project.id == event_data.project_id)
                )
                if not project_result.scalar_one_or_none():
                    raise NotFoundError("Related project not found")

            if event_data.task_id:
                task_result = await self.db.execute(
                    select(Task).where(Task.id == event_data.task_id)
                )
                if not task_result.scalar_one_or_none():
                    raise NotFoundError("Related task not found")

            # Create event
            event = Event(
                title=event_data.title,
                description=event_data.description,
                event_type=event_data.event_type,
                status=event_data.status,
                start_datetime=event_data.start_datetime,
                end_datetime=event_data.end_datetime,
                is_all_day=event_data.is_all_day,
                location=event_data.location,
                recurrence_type=event_data.recurrence_type,
                recurrence_end_date=event_data.recurrence_end_date,
                reminder_minutes=event_data.reminder_minutes,
                calendar_id=event_data.calendar_id,
                project_id=event_data.project_id,
                task_id=event_data.task_id,
                creator_id=creator_id,
                created_by=creator_id,
                updated_by=creator_id,
            )

            self.db.add(event)
            await self.db.flush()

            event_id = getattr(event, "id", None)
            if event_id is None:
                raise ValidationError("Failed to create event, ID is not set")

            # Add attendees if specified
            if event_data.attendee_ids:
                for user_id in event_data.attendee_ids:
                    await self._add_event_attendee(event_id, user_id)

            await self.db.commit()

            # Fetch created event with relationships
            result = await self.db.execute(
                select(Event)
                .options(
                    selectinload(Event.creator),
                    selectinload(Event.calendar),
                    selectinload(Event.attendees).selectinload(
                        EventAttendee.user
                    ),
                )
                .where(Event.id == event.id)
            )
            created_event = result.scalar_one()

            logger.info("Event created successfully: %s", event.title)
            return EventResponse.model_validate(created_event)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to create event: %s", e)
            raise

    async def get_event_by_id(
        self, event_id: int, user_id: Optional[int] = None
    ) -> EventResponse:
        """Get event by ID"""
        try:
            # Build query with relationships
            query = (
                select(Event)
                .options(
                    selectinload(Event.creator),
                    selectinload(Event.calendar),
                    selectinload(Event.attendees).selectinload(
                        EventAttendee.user
                    ),
                )
                .where(Event.id == event_id)
            )

            result = await self.db.execute(query)
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"Event with ID {event_id} not found")

            # Check access permissions
            if user_id:
                has_access = await self._check_event_access(event_id, user_id)
                if not has_access:
                    raise AuthorizationError("Access denied to this event")

            return EventResponse.model_validate(event)

        except Exception as e:
            logger.error("Failed to get event %d: %s", event_id, e)
            raise

    async def update_event(
        self, event_id: int, event_data: EventUpdateRequest, user_id: int
    ) -> EventResponse:
        """Update event information"""
        try:
            # Check user has permission to update event
            has_access = await self._check_event_access(event_id, user_id)
            if not has_access:
                raise AuthorizationError("No permission to update this event")

            result = await self.db.execute(
                select(Event).where(Event.id == event_id)
            )
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"Event with ID {event_id} not found")

            # Update fields
            update_data = event_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(event, field, value)

            setattr(event, "updated_by", user_id)
            setattr(event, "updated_at", datetime.utcnow())

            # event.updated_by = user_id
            # event.updated_at = datetime.utcnow()

            await self.db.commit()

            # Fetch updated event with relationships
            result = await self.db.execute(
                select(Event)
                .options(
                    selectinload(Event.creator), selectinload(Event.calendar)
                )
                .where(Event.id == event_id)
            )
            updated_event = result.scalar_one()

            logger.info("Event updated successfully: %s", event.title)
            return EventResponse.model_validate(updated_event)

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to update event %d: %s", event_id, e)
            raise

    async def delete_event(self, event_id: int, user_id: int) -> bool:
        """Delete event"""
        try:
            # Check user has permission to delete event
            has_access = await self._check_event_access(event_id, user_id)
            if not has_access:
                raise AuthorizationError("No permission to delete this event")

            result = await self.db.execute(
                select(Event).where(Event.id == event_id)
            )
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"Event with ID {event_id} not found")

            # Delete event
            await self.db.delete(event)
            await self.db.commit()

            logger.info("Event deleted: %s", event.title)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to delete event %d: %s", event_id, e)
            raise

    async def list_events(
        self,
        page_no: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        search_params: Optional[EventSearchRequest] = None,
    ) -> EventListResponse:
        """List events with pagination and filters"""
        try:
            # Build base query
            query = select(Event).options(
                selectinload(Event.creator), selectinload(Event.calendar)
            )

            # Apply access control
            if user_id:
                accessible_calendars = await self._get_accessible_calendars(
                    user_id
                )
                query = query.where(
                    Event.calendar_id.in_(accessible_calendars)
                )
            else:
                # Anonymous users can only see events in public calendars
                public_calendars = await self.db.execute(
                    select(Calendar.id).where(Calendar.is_public.is_(True))
                )
                public_calendar_ids = [
                    row[0] for row in public_calendars.fetchall()
                ]
                query = query.where(Event.calendar_id.in_(public_calendar_ids))

            # Apply search filters
            if search_params:
                if search_params.query:
                    query = query.where(
                        or_(
                            Event.title.ilike(f"%{search_params.query}%"),
                            Event.description.ilike(
                                f"%{search_params.query}%"
                            ),
                        )
                    )

                if search_params.calendar_id:
                    query = query.where(
                        Event.calendar_id == search_params.calendar_id
                    )

                if search_params.event_type:
                    query = query.where(
                        Event.event_type == search_params.event_type
                    )

                if search_params.event_status:
                    query = query.where(
                        Event.status == search_params.event_status
                    )

                if search_params.start_date_from:
                    query = query.where(
                        Event.start_datetime >= search_params.start_date_from
                    )

                if search_params.start_date_to:
                    query = query.where(
                        Event.start_datetime <= search_params.start_date_to
                    )

                if search_params.project_id:
                    query = query.where(
                        Event.project_id == search_params.project_id
                    )

                if search_params.task_id:
                    query = query.where(Event.task_id == search_params.task_id)

                if search_params.is_all_day is not None:
                    query = query.where(
                        Event.is_all_day == search_params.is_all_day
                    )

            # Get total count
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # Apply pagination and ordering
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(Event.start_datetime)
            )

            # Execute query
            result = await self.db.execute(query)
            events = result.scalars().all()

            # Calculate pagination info
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return EventListResponse(
                events=[
                    EventResponse.model_validate(event) for event in events
                ],
                total_items=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
            )

        except Exception as e:
            logger.error("Failed to list events: %s", e)
            raise

    async def list_user_events(
        self,
        user_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        calendar_id: Optional[int] = None,
    ):
        """
        List events for a user, optionally filtered by date range and calendar.
        """

        stmt = select(Event).where(Event.user_id == user_id)
        if start_date:
            stmt = stmt.where(Event.start_datetime >= start_date)
        if end_date:
            stmt = stmt.where(Event.end_datetime <= end_date)
        if calendar_id:
            stmt = stmt.where(Event.calendar_id == calendar_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_calendar_view(
        self, view_request: CalendarViewRequest, user_id: Optional[int] = None
    ) -> EventListResponse:
        """Get events for calendar view"""
        try:
            # Build query
            query = select(Event).options(
                selectinload(Event.creator), selectinload(Event.calendar)
            )

            # Filter by date range
            query = query.where(
                and_(
                    Event.start_datetime >= view_request.start_date,
                    Event.start_datetime <= view_request.end_date,
                )
            )

            # Filter by calendars if specified
            if view_request.calendar_ids:
                query = query.where(
                    Event.calendar_id.in_(view_request.calendar_ids)
                )
            elif user_id:
                # Default to accessible calendars
                accessible_calendars = await self._get_accessible_calendars(
                    user_id
                )
                query = query.where(
                    Event.calendar_id.in_(accessible_calendars)
                )

            # Order by start time
            query = query.order_by(Event.start_datetime)

            # Execute query
            result = await self.db.execute(query)
            events = result.scalars().all()

            return EventListResponse(
                events=[
                    EventResponse.model_validate(event) for event in events
                ],
                total_items=len(events),
                page_no=1,
                page_size=len(events),
                total_pages=1,
            )

        except Exception as e:
            logger.error("Failed to get calendar view: %s", e)
            raise

    async def get_event_with_access_check(self, event_id: int, user_id: int):
        """
        Retrieve an event by ID and check if the user has access.
        """

        result = await self.db.execute(
            select(Event).where(Event.id == event_id, Event.user_id == user_id)
        )
        event = result.scalar_one_or_none()
        return event

    async def get_calendar_stats(
        self, user_id: Optional[int] = None
    ) -> CalendarStatsResponse:
        """Get calendar statistics"""
        try:
            # Build base query with access control
            accessible_calendars = []
            if user_id:
                accessible_calendars = await self._get_accessible_calendars(
                    user_id
                )
            else:
                public_result = await self.db.execute(
                    select(Calendar.id).where(Calendar.is_public.is_(True))
                )
                accessible_calendars = [
                    row[0] for row in public_result.fetchall()
                ]

            base_query = select(Event).where(
                Event.calendar_id.in_(accessible_calendars)
            )

            # Total events
            total_result = await self.db.execute(
                select(count()).select_from(base_query.subquery())
            )
            total_events = total_result.scalar()

            # Upcoming events (next 30 days)
            future_date = datetime.now(timezone.utc) + timedelta(days=30)
            upcoming_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        and_(
                            Event.start_datetime >= datetime.utcnow(),
                            Event.start_datetime <= future_date,
                        )
                    ).subquery()
                )
            )
            upcoming_events = upcoming_result.scalar()

            # Overdue events
            overdue_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        and_(
                            Event.end_datetime < datetime.utcnow(),
                            Event.status.in_(["scheduled", "in_progress"]),
                        )
                    ).subquery()
                )
            )
            overdue_events = overdue_result.scalar()

            # Events by type
            type_result = await self.db.execute(
                select(Event.event_type, count(Event.id))
                .select_from(base_query.subquery())
                .group_by(Event.event_type)
            )
            # events_by_type = dict(type_result.fetchall())
            events_by_type = {row[0]: row[1] for row in type_result.fetchall()}

            # Events by status
            status_result = await self.db.execute(
                select(Event.status, count(Event.id))
                .select_from(base_query.subquery())
                .group_by(Event.status)
            )
            # events_by_status = dict(status_result.fetchall())
            events_by_status = {
                row[0]: row[1] for row in status_result.fetchall()
            }

            # Events this week and month
            week_start = datetime.utcnow() - timedelta(
                days=datetime.utcnow().weekday()
            )
            month_start = datetime.utcnow().replace(day=1)

            week_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        Event.start_datetime >= week_start
                    ).subquery()
                )
            )
            events_this_week = week_result.scalar()

            month_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        Event.start_datetime >= month_start
                    ).subquery()
                )
            )
            events_this_month = month_result.scalar()

            return CalendarStatsResponse(
                total_events=total_events if total_events is not None else 0,
                upcoming_events=(
                    upcoming_events if upcoming_events is not None else 0
                ),
                overdue_events=(
                    overdue_events if overdue_events is not None else 0
                ),
                events_by_type=events_by_type,
                events_by_status=events_by_status,
                events_this_week=(
                    events_this_week if events_this_week is not None else 0
                ),
                events_this_month=(
                    events_this_month if events_this_month is not None else 0
                ),
            )

        except Exception as e:
            logger.error("Failed to get calendar stats: %s", e)
            raise

    async def get_event_dashboard(
        self, user_id: int
    ) -> EventDashboardResponse:
        """Get event dashboard data for user"""
        try:
            accessible_calendars = await self._get_accessible_calendars(
                user_id
            )
            base_query = select(Event).where(
                Event.calendar_id.in_(accessible_calendars)
            )

            # Today's events
            today_start = datetime.utcnow().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            today_end = today_start + timedelta(days=1)

            today_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_datetime >= today_start,
                        Event.start_datetime < today_end,
                    )
                )
                .order_by(Event.start_datetime)
            )
            today_events = today_result.scalars().all()

            # Upcoming events (next 7 days)
            week_end = today_end + timedelta(days=7)
            upcoming_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_datetime >= today_end,
                        Event.start_datetime <= week_end,
                    )
                )
                .order_by(Event.start_datetime)
                .limit(10)
            )
            upcoming_events = upcoming_result.scalars().all()

            # Recent events (last 7 days)
            week_start = today_start - timedelta(days=7)
            recent_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_datetime >= week_start,
                        Event.start_datetime < today_start,
                    )
                )
                .order_by(desc(Event.start_datetime))
                .limit(5)
            )
            recent_events = recent_result.scalars().all()

            # Overdue events
            overdue_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.end_datetime < datetime.utcnow(),
                        Event.status.in_(["scheduled", "in_progress"]),
                    )
                )
                .order_by(Event.end_datetime)
                .limit(5)
            )
            overdue_events = overdue_result.scalars().all()

            # Get stats
            event_stats = await self.get_calendar_stats(user_id)

            return EventDashboardResponse(
                today_events=[
                    EventResponse.model_validate(e) for e in today_events
                ],
                upcoming_events=[
                    EventResponse.model_validate(e) for e in upcoming_events
                ],
                recent_events=[
                    EventResponse.model_validate(e) for e in recent_events
                ],
                overdue_events=[
                    EventResponse.model_validate(e) for e in overdue_events
                ],
                event_stats=event_stats,
            )

        except Exception as e:
            logger.error("Failed to get event dashboard: %s", e)
            raise

    async def add_event_attendees(
        self, event_id: int, user_ids: List[int], added_by: int
    ) -> bool:
        """Add attendees to an event"""
        try:
            # Check permission
            has_access = await self._check_event_access(event_id, added_by)
            if not has_access:
                raise AuthorizationError("No permission to modify this event")

            # Verify event exists
            event_result = await self.db.execute(
                select(Event).where(Event.id == event_id)
            )
            event = event_result.scalar_one_or_none()
            if not event:
                raise NotFoundError("Event not found")

            # Add attendees
            for user_id in user_ids:
                await self._add_event_attendee(event_id, user_id)

            await self.db.commit()

            logger.info("Attendees added to event %d: %s", event_id, user_ids)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to add attendees to event %d: %s", event_id, e
            )
            raise

    async def remove_event_attendee(
        self, event_id: int, user_id: int, removed_by: int
    ) -> bool:
        """Remove attendee from an event"""
        try:
            # Check permission
            has_access = await self._check_event_access(event_id, removed_by)
            if not has_access:
                raise AuthorizationError("No permission to modify this event")

            # Find and remove attendee
            attendee_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.user_id == user_id,
                    )
                )
            )
            attendee = attendee_result.scalar_one_or_none()

            if attendee:
                await self.db.delete(attendee)
                await self.db.commit()
                logger.info(
                    "Attendee %d removed from event %d", user_id, event_id
                )
                return True

            return False

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to remove attendee from event %d: %s", event_id, e
            )
            raise

    async def _check_event_access(self, event_id: int, user_id: int) -> bool:
        """Check if user has access to event"""
        try:
            event_result = await self.db.execute(
                select(Event)
                .options(selectinload(Event.calendar))
                .where(Event.id == event_id)
            )
            event = event_result.scalar_one_or_none()

            if not event:
                return False

            event_creator_id = getattr(event, "creator_id", None)
            if event_creator_id is None:
                raise NotFoundError(f"Event with ID {event_id} has no creator")

            # Event creator has access
            if event_creator_id == user_id:
                return True

            # Calendar owner has access
            if event.calendar.owner_id == user_id:
                return True

            # Public calendar events are accessible
            if event.calendar.is_public:
                return True

            # Check if user is an attendee
            attendee_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.user_id == user_id,
                    )
                )
            )

            return attendee_result.scalar_one_or_none() is not None

        except Exception as e:
            logger.error("Failed to check event access: %s", e)
            return False

    async def _get_accessible_calendars(self, user_id: int) -> List[int]:
        """Get list of calendar IDs user has access to"""
        try:
            # Get public calendars
            public_result = await self.db.execute(
                select(Calendar.id).where(Calendar.is_public.is_(True))
            )
            public_calendars = [row[0] for row in public_result.fetchall()]

            # Get calendars owned by user
            owned_result = await self.db.execute(
                select(Calendar.id).where(Calendar.owner_id == user_id)
            )
            owned_calendars = [row[0] for row in owned_result.fetchall()]

            # Combine and deduplicate
            return list(set(public_calendars + owned_calendars))

        except Exception as e:
            logger.error("Failed to get accessible calendars: %s", e)
            return []

    async def _add_event_attendee(self, event_id: int, user_id: int):
        """Add an attendee to an event"""
        try:
            # Verify user exists
            user_result = await self.db.execute(
                select(User).where(User.id == user_id)
            )
            if not user_result.scalar_one_or_none():
                raise NotFoundError(f"User with ID {user_id} not found")

            # Check if already attending
            existing_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.user_id == user_id,
                    )
                )
            )
            if existing_result.scalar_one_or_none():
                return  # Already attending

            # Create attendee
            attendee = EventAttendee(
                event_id=event_id, user_id=user_id, response_status="pending"
            )

            self.db.add(attendee)
            await self.db.flush()

        except Exception as e:
            logger.error(
                "Failed to add attendee %s to event %s: %s",
                user_id,
                event_id,
                e,
            )
            raise


async def get_calendar_service(
    db: Optional[AsyncSession] = None,
) -> CalendarService:
    """Get calendar service instance"""
    if db is None:
        async for session in get_async_session():
            return CalendarService(session)
    return CalendarService(cast(AsyncSession, db))
