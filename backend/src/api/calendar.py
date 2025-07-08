"""
Calendar API Routes

Calendar and event management endpoints.
"""

import logging
from datetime import date
from typing import List, Optional

from core.database import get_async_session
from core.dependencies import get_current_active_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.user import User
from schemas.calendar import (
    CalendarResponse,
    EventCreateRequest,
    EventResponse,
    EventUpdateRequest,
)
from services.calendar import CalendarService
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/events", response_model=List[EventResponse])
async def list_events(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    calendar_id: Optional[int] = Query(None, description="Filter by calendar"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List events for current user
    """
    try:
        calendar_service = CalendarService(db)
        events = await calendar_service.list_user_events(
            user_id=int(str(current_user.id)),
            start_date=start_date,
            end_date=end_date,
            calendar_id=calendar_id,
        )

        return [EventResponse.model_validate(event) for event in events]

    except Exception as e:
        logger.error("Error listing events: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events",
        ) from e


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get event by ID
    """
    try:
        calendar_service = CalendarService(db)
        event = await calendar_service.get_event_with_access_check(
            event_id, int(str(current_user.id))
        )

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
            )

        return EventResponse.model_validate(event)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting event %s: %s", event_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event",
        ) from e


@router.post(
    "/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    event_data: EventCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create a new event
    """
    try:
        calendar_service = CalendarService(db)
        event = await calendar_service.create_event(
            event_data, int(str(current_user.id))
        )

        logger.info("Event created by %s: %s", current_user.name, event.title)

        return EventResponse.model_validate(event)

    except Exception as e:
        logger.error("Error creating event: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event",
        ) from e


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Update event
    """
    try:
        calendar_service = CalendarService(db)
        event = await calendar_service.update_event(
            event_id, event_data, int(str(current_user.id))
        )

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
            )

        logger.info("Event updated by %s: %s", current_user.name, event.title)

        return EventResponse.model_validate(event)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating event %s: %s", event_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update event",
        ) from e


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Delete event
    """
    try:
        calendar_service = CalendarService(db)
        success = await calendar_service.delete_event(
            event_id, int(str(current_user.id))
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
            )

        logger.info("Event deleted by %s: %s", current_user.name, event_id)

        return {"message": "Event deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting event %s: %s", event_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event",
        ) from e


@router.get("/calendars", response_model=List[CalendarResponse])
async def list_calendars(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    List calendars for current user
    """
    try:
        calendar_service = CalendarService(db)
        calendars = await calendar_service.list_user_calendars(
            int(str(current_user.id))
        )

        return [CalendarResponse.model_validate(calendar) for calendar in calendars]

    except Exception as e:
        logger.error("Error listing calendars: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve calendars",
        ) from e
