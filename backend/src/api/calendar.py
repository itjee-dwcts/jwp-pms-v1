"""
캘린더 API Routes

캘린더 및 일정 관리 엔드포인트
"""

import logging
from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from schemas.calendar import (
    CalendarCreateRequest,
    CalendarListResponse,
    CalendarResponse,
    CalendarStatsResponse,
    CalendarUpdateRequest,
    CalendarViewRequest,
    EventAttendeeRequest,
    EventCreateRequest,
    EventDashboardResponse,
    EventListResponse,
    EventResponse,
    EventSearchRequest,
    EventUpdateRequest,
)
from services.calendar import CalendarService
from utils.exceptions import AuthorizationError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# 일정 관리 API
# ============================================================================


@router.get("/events", response_model=EventListResponse)
async def list_events(
    page_no: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    search_text: Optional[str] = Query(None, description="제목 또는 설명으로 검색"),
    calendar_id: Optional[UUID] = Query(None, description="캘린더별 필터"),
    event_type: Optional[str] = Query(None, description="일정 유형별 필터"),
    event_status: Optional[str] = Query(None, description="일정 상태별 필터"),
    start_date_from: Optional[date] = Query(None, description="시작 날짜 범위 (시작)"),
    start_date_to: Optional[date] = Query(None, description="시작 날짜 범위 (끝)"),
    project_id: Optional[UUID] = Query(None, description="프로젝트별 필터"),
    task_id: Optional[UUID] = Query(None, description="작업별 필터"),
    is_all_day: Optional[bool] = Query(None, description="종일 일정 필터"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    현재 사용자가 접근 가능한 일정 목록 조회
    """
    try:
        print("[DEBUG] list_events 호출됨")
        print(f"[DEBUG] 사용자 ID: {current_user.id}")
        print(f"[DEBUG] 페이지 번호: {page_no}, 페이지 크기: {page_size}")
        print(f"[DEBUG] 검색 텍스트: {search_text}")
        print(
            f"[DEBUG] 필터 조건 - 캘린더ID: {calendar_id}, 일정유형: {event_type}, 일정상태: {event_status}"
        )
        print(f"[DEBUG] 날짜 범위: {start_date_from} ~ {start_date_to}")
        print(
            f"[DEBUG] 프로젝트ID: {project_id}, 작업ID: {task_id}, 종일일정: {is_all_day}"
        )

        logger.info("일정 목록 조회 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        def date_to_datetime(d):
            return datetime.combine(d, time.min) if d else None

        search_params = EventSearchRequest(
            query=search_text,
            calendar_id=calendar_id,
            event_type=event_type,
            event_status=event_status,
            start_date_from=date_to_datetime(start_date_from),
            start_date_to=date_to_datetime(start_date_to),
            project_id=project_id,
            task_id=task_id,
            is_all_day=is_all_day,
        )

        print(f"[DEBUG] 검색 파라미터 생성 완료: {search_params}")

        result = await calendar_service.list_events(
            user_id=UUID(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_params=search_params,
        )

        print(
            f"[DEBUG] 서비스 호출 완료, 결과: {len(result.events) if hasattr(result, 'events') else 'N/A'}개 일정"
        )
        return result

    except ValidationError as e:
        print(f"[ERROR] 유효성 검사 실패: {e}")
        logger.warning("일정 목록 조회 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        print(f"[ERROR] 데이터베이스 오류: {e}")
        logger.error("데이터베이스 오류로 일정 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        print(f"[ERROR] 예상치 못한 오류: {e}")
        logger.error("일정 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"일정 목록을 조회할 수 없습니다: {e}",
        ) from e


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    ID로 일정 조회
    """
    try:
        logger.info(
            "일정 조회 요청: event_id=%s, user_id=%s", event_id, current_user.id
        )
        calendar_service = CalendarService(db)

        event = await calendar_service.get_event_by_id(
            user_id=UUID(str(current_user.id)), event_id=event_id
        )

        return event

    except NotFoundError as e:
        logger.warning("일정을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("일정 접근 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 일정 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 %s 조회 오류: %s", event_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정을 조회할 수 없습니다",
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
    새 일정 생성
    """
    try:
        logger.info("일정 생성 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        event = await calendar_service.create_event(
            user_id=UUID(str(current_user.id)), event_data=event_data
        )

        logger.info("일정이 %s에 의해 생성됨: %s", current_user.name, event.title)
        return event

    except NotFoundError as e:
        logger.warning("연관 리소스를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("일정 생성 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ValidationError as e:
        logger.warning("일정 생성 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 일정 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 생성 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정을 생성할 수 없습니다",
        ) from e


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    event_data: EventUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    일정 수정
    """
    try:
        logger.info(
            "일정 수정 요청: event_id=%s, user_id=%s", event_id, current_user.id
        )
        calendar_service = CalendarService(db)

        event = await calendar_service.update_event(
            user_id=UUID(str(current_user.id)), event_id=event_id, event_data=event_data
        )

        logger.info("일정이 %s에 의해 수정됨: %s", current_user.name, event.title)
        return event

    except NotFoundError as e:
        logger.warning("일정을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("일정 수정 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ValidationError as e:
        logger.warning("일정 수정 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 일정 수정 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 %s 수정 오류: %s", event_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정을 수정할 수 없습니다",
        ) from e


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    일정 삭제
    """
    try:
        logger.info(
            "일정 삭제 요청: event_id=%s, user_id=%s", event_id, current_user.id
        )
        calendar_service = CalendarService(db)

        success = await calendar_service.delete_event(
            user_id=UUID(str(current_user.id)), event_id=event_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="일정을 찾을 수 없습니다",
            )

        logger.info("일정이 %s에 의해 삭제됨: %s", current_user.name, event_id)
        return {"message": "일정이 성공적으로 삭제되었습니다"}

    except NotFoundError as e:
        logger.warning("일정을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("일정 삭제 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 일정 삭제 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 %s 삭제 오류: %s", event_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정을 삭제할 수 없습니다",
        ) from e


# ============================================================================
# 캘린더 관리 API
# ============================================================================


@router.get("/calendars", response_model=CalendarListResponse)
async def list_calendars(
    page_no: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    현재 사용자의 캘린더 목록 조회
    """
    try:
        logger.info("캘린더 목록 조회 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        result = await calendar_service.list_calendars(
            user_id=UUID(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
        )

        return result

    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더 목록을 조회할 수 없습니다",
        ) from e


@router.post(
    "/calendars", response_model=CalendarResponse, status_code=status.HTTP_201_CREATED
)
async def create_calendar(
    calendar_data: CalendarCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새 캘린더 생성
    """
    try:
        logger.info("캘린더 생성 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        calendar = await calendar_service.create_calendar(
            user_id=UUID(str(current_user.id)), calendar_data=calendar_data
        )

        logger.info("캘린더가 %s에 의해 생성됨: %s", current_user.name, calendar.name)
        return calendar

    except NotFoundError as e:
        logger.warning("사용자를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ValidationError as e:
        logger.warning("캘린더 생성 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 생성 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더를 생성할 수 없습니다",
        ) from e


@router.get("/calendars/{calendar_id}", response_model=CalendarResponse)
async def get_calendar(
    calendar_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    ID로 캘린더 조회
    """
    try:
        logger.info(
            "캘린더 조회 요청: calendar_id=%s, user_id=%s", calendar_id, current_user.id
        )
        calendar_service = CalendarService(db)

        calendar = await calendar_service.get_calendar_by_id(
            user_id=UUID(str(current_user.id)), calendar_id=calendar_id
        )

        return calendar

    except NotFoundError as e:
        logger.warning("캘린더를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("캘린더 접근 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 %s 조회 오류: %s", calendar_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더를 조회할 수 없습니다",
        ) from e


@router.put("/calendars/{calendar_id}", response_model=CalendarResponse)
async def update_calendar(
    calendar_id: UUID,
    calendar_data: CalendarUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    캘린더 수정
    """
    try:
        logger.info(
            "캘린더 수정 요청: calendar_id=%s, user_id=%s", calendar_id, current_user.id
        )
        calendar_service = CalendarService(db)

        calendar = await calendar_service.update_calendar(
            user_id=UUID(str(current_user.id)),
            calendar_id=calendar_id,
            calendar_data=calendar_data,
        )

        logger.info("캘린더가 %s에 의해 수정됨: %s", current_user.name, calendar.name)
        return calendar

    except NotFoundError as e:
        logger.warning("캘린더를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("캘린더 수정 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ValidationError as e:
        logger.warning("캘린더 수정 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 수정 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 %s 수정 오류: %s", calendar_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더를 수정할 수 없습니다",
        ) from e


@router.delete("/calendars/{calendar_id}")
async def delete_calendar(
    calendar_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    캘린더 삭제
    """
    try:
        logger.info(
            "캘린더 삭제 요청: calendar_id=%s, user_id=%s", calendar_id, current_user.id
        )
        calendar_service = CalendarService(db)

        success = await calendar_service.delete_calendar(
            user_id=UUID(str(current_user.id)), calendar_id=calendar_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="캘린더를 찾을 수 없습니다",
            )

        logger.info("캘린더가 %s에 의해 삭제됨: %s", current_user.name, calendar_id)
        return {"message": "캘린더가 성공적으로 삭제되었습니다"}

    except NotFoundError as e:
        logger.warning("캘린더를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("캘린더 삭제 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 삭제 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 %s 삭제 오류: %s", calendar_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더를 삭제할 수 없습니다",
        ) from e


# ============================================================================
# 일정 참석자 관리 API
# ============================================================================


@router.post("/events/{event_id}/attendees")
async def add_event_attendees(
    event_id: UUID,
    attendee_data: EventAttendeeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    일정에 참석자 추가
    """
    try:
        logger.info(
            "일정 참석자 추가 요청: event_id=%s, user_id=%s", event_id, current_user.id
        )
        calendar_service = CalendarService(db)

        success = await calendar_service.add_event_attendees(
            user_id=UUID(str(current_user.id)),
            event_id=event_id,
            attendee_ids=attendee_data.attendee_ids,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="참석자를 추가할 수 없습니다",
            )

        logger.info("일정 %s에 참석자가 추가됨: %s", event_id, attendee_data.user_ids)
        return {"message": "참석자가 성공적으로 추가되었습니다"}

    except NotFoundError as e:
        logger.warning("일정을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("참석자 추가 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ValidationError as e:
        logger.warning("참석자 추가 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 참석자 추가 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 %s 참석자 추가 오류: %s", event_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="참석자를 추가할 수 없습니다",
        ) from e


@router.delete("/events/{event_id}/attendees/{user_id}")
async def remove_event_attendee(
    event_id: UUID,
    attendee_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    일정에서 참석자 제거
    """
    try:
        logger.info(
            "일정 참석자 제거 요청: event_id=%s, user_id=%s", event_id, attendee_id
        )
        calendar_service = CalendarService(db)

        success = await calendar_service.remove_event_attendee(
            user_id=UUID(str(current_user.id)),
            event_id=event_id,
            attendee_id=attendee_id,
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="참석자를 찾을 수 없습니다",
            )

        logger.info("일정 %s에서 참석자 %s가 제거됨", event_id, attendee_id)
        return {"message": "참석자가 성공적으로 제거되었습니다"}

    except NotFoundError as e:
        logger.warning("일정 또는 참석자를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("참석자 제거 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 참석자 제거 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 %s 참석자 %s 제거 오류: %s", event_id, attendee_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="참석자를 제거할 수 없습니다",
        ) from e


# ============================================================================
# 캘린더 뷰 및 통계 API
# ============================================================================


@router.post("/view", response_model=EventListResponse)
async def get_calendar_view(
    view_request: CalendarViewRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    캘린더 뷰 데이터 조회 (일/주/월/년 단위)
    """
    try:
        logger.info(
            "캘린더 뷰 조회 요청: user_id=%s, view_type=%s",
            current_user.id,
            view_request.view_type,
        )
        calendar_service = CalendarService(db)

        result = await calendar_service.get_calendar_view(
            user_id=UUID(str(current_user.id)), view_request=view_request
        )

        return result

    except ValidationError as e:
        logger.warning("캘린더 뷰 조회 유효성 검사 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 뷰 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 뷰 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더 뷰를 조회할 수 없습니다",
        ) from e


@router.get("/stats", response_model=CalendarStatsResponse)
async def get_calendar_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    캘린더 통계 조회
    """
    try:
        logger.info("캘린더 통계 조회 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        stats = await calendar_service.get_calendar_stats(
            user_id=UUID(str(current_user.id))
        )

        return stats

    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 캘린더 통계 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("캘린더 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캘린더 통계를 조회할 수 없습니다",
        ) from e


@router.get("/dashboard", response_model=EventDashboardResponse)
async def get_event_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    일정 대시보드 데이터 조회
    """
    try:
        logger.info("일정 대시보드 조회 요청: user_id=%s", current_user.id)
        calendar_service = CalendarService(db)

        dashboard = await calendar_service.get_event_dashboard(
            user_id=UUID(str(current_user.id))
        )

        return dashboard

    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 일정 대시보드 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("일정 대시보드 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="일정 대시보드를 조회할 수 없습니다",
        ) from e
