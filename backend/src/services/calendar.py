"""
캘린더 서비스

캘린더 및 일정 관리 작업을 위한 비즈니스 로직
"""

import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, cast
from uuid import UUID

from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.functions import count

from core.database import get_async_session
from models.calendar import Calendar, Event, EventAttendee
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
from services.user import UserService
from utils.exceptions import AuthorizationError, NotFoundError, ValidationError

logger = logging.getLogger(__name__)


class CalendarService:
    """캘린더 및 일정 관리 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(self.db)

    async def create_calendar(
        self, user_id: UUID, calendar_data: CalendarCreateRequest
    ) -> CalendarResponse:
        """새 캘린더 생성"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            if not calendar_data.owner_id:
                calendar_data.owner_id = user_id

            owner = await self.user_service.get_user_by_id(calendar_data.owner_id)
            if not owner:
                raise NotFoundError(
                    f"ID {calendar_data.owner_id}인 소유자를 찾을 수 없습니다"
                )

            # 캘린더 생성
            calendar = Calendar(
                name=calendar_data.name,
                description=calendar_data.description,
                color=calendar_data.color,
                is_public=calendar_data.is_public,
                is_default=calendar_data.is_default,
                is_active=calendar_data.is_active,
                owner_id=calendar_data.owner_id,
                created_by=user_id,
            )

            self.db.add(calendar)
            await self.db.flush()  # ID를 가져오기 위해 플러시

            await self.db.commit()

            # 관계와 함께 생성된 캘린더 조회
            result = await self.db.execute(
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar.id)
            )
            created_calendar = result.scalar_one()

            logger.info("캘린더가 성공적으로 생성됨: %s", calendar.name)
            return CalendarResponse.model_validate(created_calendar)

        except Exception as e:
            await self.db.rollback()
            logger.error("캘린더 생성 실패: %s", e)
            raise

    async def get_calendar_by_id(
        self, user_id: UUID, calendar_id: UUID, owner_id: Optional[UUID] = None
    ) -> CalendarResponse:
        """ID로 캘린더 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 관계와 함께 쿼리 작성
            query = (
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar_id)
            )

            result = await self.db.execute(query)
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(f"ID {calendar_id}인 캘린더를 찾을 수 없습니다")

            calendar_owner_id = getattr(calendar, "owner_id", None)

            # user_id가 제공된 경우, 소유자인지 확인
            if owner_id:
                if calendar_owner_id == owner_id:
                    return CalendarResponse.model_validate(calendar)

            # 캘린더가 공개인 경우, owner_id 확인 불필요
            calendar_is_public = getattr(calendar, "is_public", False)
            if calendar_is_public and owner_id is None:
                return CalendarResponse.model_validate(calendar)

            # 접근 권한 확인
            if owner_id and not calendar_is_public and calendar_owner_id != owner_id:
                raise AuthorizationError("이 캘린더에 대한 접근이 거부되었습니다")

            return CalendarResponse.model_validate(calendar)

        except Exception as e:
            logger.error("캘린더 %d 조회 실패: %s", calendar_id, e)
            raise

    async def update_calendar(
        self, user_id: UUID, calendar_id: UUID, calendar_data: CalendarUpdateRequest
    ) -> CalendarResponse:
        """캘린더 정보 수정"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            result = await self.db.execute(
                select(Calendar).where(Calendar.id == calendar_id)
            )
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(f"ID {calendar_id}인 캘린더를 찾을 수 없습니다")

            calendar_owner_id = getattr(calendar, "owner_id", None)
            # 사용자가 소유자인지 확인
            if calendar_owner_id is None:
                raise NotFoundError(f"ID {calendar_id}인 캘린더에 소유자가 없습니다")

            # 소유권 확인
            if calendar_owner_id != user_id:
                raise AuthorizationError("캘린더 소유자만 캘린더를 수정할 수 있습니다")

            # 필드 업데이트
            update_data = calendar_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(calendar, field, value)

            # 메타데이터 업데이트
            calendar.updated_by = user_id
            calendar.updated_at = datetime.now(timezone.utc)

            await self.db.commit()

            # 관계와 함께 업데이트된 캘린더 조회
            result = await self.db.execute(
                select(Calendar)
                .options(selectinload(Calendar.owner))
                .where(Calendar.id == calendar_id)
            )
            updated_calendar = result.scalar_one()

            logger.info("캘린더가 성공적으로 업데이트됨: %s", calendar.name)
            return CalendarResponse.model_validate(updated_calendar)

        except Exception as e:
            await self.db.rollback()
            logger.error("캘린더 %d 업데이트 실패: %s", calendar_id, e)
            raise

    async def delete_calendar(self, user_id: UUID, calendar_id: UUID) -> bool:
        """캘린더 삭제"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            result = await self.db.execute(
                select(Calendar).where(Calendar.id == calendar_id)
            )
            calendar = result.scalar_one_or_none()

            if not calendar:
                raise NotFoundError(f"ID {calendar_id}인 캘린더를 찾을 수 없습니다")

            calendar_owner_id = getattr(calendar, "owner_id", None)
            if calendar_owner_id is None:
                raise NotFoundError(f"ID {calendar_id}인 캘린더에 소유자가 없습니다")

            # 소유권 확인
            if calendar_owner_id != user_id:
                raise AuthorizationError("캘린더 소유자만 캘린더를 삭제할 수 있습니다")

            # 캘린더 삭제 (일정들도 연쇄 삭제됨)
            await self.db.delete(calendar)
            await self.db.commit()

            logger.info("캘린더 삭제됨: %s", calendar.name)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("캘린더 %d 삭제 실패: %s", calendar_id, e)
            raise

    async def list_calendars(
        self,
        user_id: UUID,
        page_no: int = 1,
        page_size: int = 20,
        owner_id: Optional[UUID] = None,
    ) -> CalendarListResponse:
        """페이지네이션이 적용된 캘린더 목록 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 기본 쿼리 작성
            query = select(Calendar).options(selectinload(Calendar.owner))

            # 접근 제어 적용
            if owner_id:
                # 사용자는 공개 캘린더 또는 자신의 캘린더를 볼 수 있음
                query = query.where(
                    or_(
                        Calendar.is_public.is_(True),
                        Calendar.owner_id == owner_id,
                    )
                )
            else:
                # 익명 사용자는 공개 캘린더만 볼 수 있음
                query = query.where(Calendar.is_public.is_(True))

            # 전체 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(Calendar.created_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            calendars = result.scalars().all()

            # 페이지네이션 정보 계산
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return CalendarListResponse(
                calendars=[
                    CalendarResponse.model_validate(calendar) for calendar in calendars
                ],
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
                total_items=total_items if total_items is not None else 0,
            )

        except Exception as e:
            logger.error("캘린더 목록 조회 실패: %s", e)
            raise

    async def list_user_calendars(self, user_id: UUID) -> List[Calendar]:
        """사용자 캘린더 목록 조회"""
        result = await self.db.execute(
            select(Calendar).where(Calendar.owner_id == user_id)
        )
        return list(result.scalars().all())

    async def create_event(
        self, user_id: UUID, event_data: EventCreateRequest
    ) -> EventResponse:
        """새 일정 생성"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 캘린더 존재 및 사용자 접근 권한 확인
            calendar = await self.get_calendar_by_id(
                user_id, event_data.calendar_id, user_id
            )
            if not calendar:
                raise NotFoundError(
                    f"ID {event_data.calendar_id}인 캘린더를 찾을 수 없습니다"
                )

            if calendar.owner_id != user.id:
                raise AuthorizationError("이 캘린더에 대한 접근 권한이 없습니다")

            # 일정 생성
            event = Event(
                title=event_data.title,
                description=event_data.description,
                event_type=event_data.event_type,
                status=event_data.status,
                start_time=event_data.start_time,
                end_time=event_data.end_time,
                is_all_day=event_data.is_all_day,
                location=event_data.location,
                recurrence_type=event_data.recurrence_type,
                recurrence_end_date=event_data.recurrence_end_date,
                reminder_minutes=event_data.reminder_minutes,
                calendar_id=event_data.calendar_id,
                project_id=event_data.project_id,
                task_id=event_data.task_id,
                owner_id=user.id,
                created_by=user.id,
            )

            self.db.add(event)
            await self.db.flush()

            event_id = getattr(event, "id", None)
            if event_id is None:
                raise ValidationError("일정 생성 실패, ID가 설정되지 않았습니다")

            # 지정된 경우 참석자 추가
            if event_data.attendee_ids:
                for attendee_id in event_data.attendee_ids:
                    await self._add_event_attendee(user_id, event_id, attendee_id)

            await self.db.commit()

            # 관계와 함께 생성된 일정 조회
            result = await self.db.execute(
                select(Event)
                .options(
                    selectinload(Event.creator),
                    selectinload(Event.calendar),
                    selectinload(Event.attendees).selectinload(EventAttendee.user),
                )
                .where(Event.id == event.id)
            )
            created_event = result.scalar_one()

            logger.info("일정이 성공적으로 생성됨: %s", event.title)
            return EventResponse.model_validate(created_event)

        except Exception as e:
            await self.db.rollback()
            logger.error("일정 생성 실패: %s", e)
            raise

    async def get_event_by_id(self, user_id: UUID, event_id: UUID) -> EventResponse:
        """ID로 일정 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 관계와 함께 쿼리 작성
            query = (
                select(Event)
                .options(
                    selectinload(Event.creator),
                    selectinload(Event.calendar),
                    selectinload(Event.attendees).selectinload(EventAttendee.user),
                )
                .where(Event.id == event_id)
            )

            result = await self.db.execute(query)
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"ID {event_id}인 일정을 찾을 수 없습니다")

            # 접근 권한 확인
            if user_id:
                has_access = await self._check_event_access(user_id, event_id)
                if not has_access:
                    raise AuthorizationError("이 일정에 대한 접근이 거부되었습니다")

            return EventResponse.model_validate(event)

        except Exception as e:
            logger.error("일정 %d 조회 실패: %s", event_id, e)
            raise

    async def update_event(
        self, user_id: UUID, event_id: UUID, event_data: EventUpdateRequest
    ) -> EventResponse:
        """일정 정보 수정"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 일정을 수정할 권한이 있는지 확인
            has_access = await self._check_event_access(user_id, event_id)
            if not has_access:
                raise AuthorizationError("이 일정을 수정할 권한이 없습니다")

            result = await self.db.execute(select(Event).where(Event.id == event_id))
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"ID {event_id}인 일정을 찾을 수 없습니다")

            # 필드 업데이트
            update_data = event_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(event, field, value)

            event.updated_by = user_id
            event.updated_at = datetime.now(timezone.utc)

            await self.db.commit()

            # 관계와 함께 업데이트된 일정 조회
            result = await self.db.execute(
                select(Event)
                .options(selectinload(Event.creator), selectinload(Event.calendar))
                .where(Event.id == event_id)
            )
            updated_event = result.scalar_one()

            logger.info("일정이 성공적으로 업데이트됨: %s", event.title)
            return EventResponse.model_validate(updated_event)

        except Exception as e:
            await self.db.rollback()
            logger.error("일정 %d 업데이트 실패: %s", event_id, e)
            raise

    async def delete_event(self, user_id: UUID, event_id: UUID) -> bool:
        """일정 삭제"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자가 일정을 삭제할 권한이 있는지 확인
            has_access = await self._check_event_access(user_id, event_id)
            if not has_access:
                raise AuthorizationError("이 일정을 삭제할 권한이 없습니다")

            result = await self.db.execute(select(Event).where(Event.id == event_id))
            event = result.scalar_one_or_none()

            if not event:
                raise NotFoundError(f"ID {event_id}인 일정을 찾을 수 없습니다")

            # 일정 삭제
            await self.db.delete(event)
            await self.db.commit()

            logger.info("일정 삭제됨: %s", event.title)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("일정 %d 삭제 실패: %s", event_id, e)
            raise

    async def list_events(
        self,
        user_id: UUID,
        page_no: int = 1,
        page_size: int = 20,
        search_params: Optional[EventSearchRequest] = None,
    ) -> EventListResponse:
        """페이지네이션 및 필터가 적용된 일정 목록 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            print("[DEBUG] list_events 서비스 호출됨")
            print(f"[DEBUG] 파라미터 - page_no: {page_no}, page_size: {page_size}")
            print(f"[DEBUG] user_id: {user_id}")
            print(f"[DEBUG] search_params: {search_params}")

            # 기본 쿼리 작성
            query = select(Event).options(
                selectinload(Event.creator), selectinload(Event.calendar)
            )
            print("[DEBUG] 기본 쿼리 생성 완료")

            # 접근 제어 적용
            if user_id:
                print("[DEBUG] user_id가 있어서 접근 가능한 캘린더 조회 중...")
                accessible_calendars = await self._get_accessible_calendars(user_id)
                print(f"[DEBUG] 접근 가능한 캘린더 목록: {accessible_calendars}")
                query = query.where(Event.calendar_id.in_(accessible_calendars))
            else:
                print("[DEBUG] 익명 사용자 - 공개 캘린더만 조회")
                # 익명 사용자는 공개 캘린더의 일정만 볼 수 있음
                public_calendars = await self.db.execute(
                    select(Calendar.id).where(Calendar.is_public.is_(True))
                )
                public_calendar_ids = [row[0] for row in public_calendars.fetchall()]
                print(f"[DEBUG] 공개 캘린더 ID 목록: {public_calendar_ids}")
                query = query.where(Event.calendar_id.in_(public_calendar_ids))

            # 검색 필터 적용
            if search_params:
                print("[DEBUG] 검색 필터 적용 시작")
                if search_params.query:
                    print(f"[DEBUG] 텍스트 검색 필터: {search_params.query}")
                    query = query.where(
                        or_(
                            Event.title.ilike(f"%{search_params.query}%"),
                            Event.description.ilike(f"%{search_params.query}%"),
                        )
                    )

                if search_params.calendar_id:
                    print(f"[DEBUG] 캘린더 ID 필터: {search_params.calendar_id}")
                    query = query.where(Event.calendar_id == search_params.calendar_id)

                if search_params.event_type:
                    print(f"[DEBUG] 일정 유형 필터: {search_params.event_type}")
                    query = query.where(Event.event_type == search_params.event_type)

                if search_params.event_status:
                    print(f"[DEBUG] 일정 상태 필터: {search_params.event_status}")
                    query = query.where(Event.status == search_params.event_status)

                if search_params.start_date_from:
                    print(
                        f"[DEBUG] 시작 날짜 From 필터: {search_params.start_date_from}"
                    )
                    query = query.where(
                        Event.start_time >= search_params.start_date_from
                    )

                if search_params.start_date_to:
                    print(f"[DEBUG] 시작 날짜 To 필터: {search_params.start_date_to}")
                    query = query.where(Event.start_time <= search_params.start_date_to)

                if search_params.project_id:
                    print(f"[DEBUG] 프로젝트 ID 필터: {search_params.project_id}")
                    query = query.where(Event.project_id == search_params.project_id)

                if search_params.task_id:
                    print(f"[DEBUG] 작업 ID 필터: {search_params.task_id}")
                    query = query.where(Event.task_id == search_params.task_id)

                if search_params.is_all_day is not None:
                    print(f"[DEBUG] 종일 일정 필터: {search_params.is_all_day}")
                    query = query.where(Event.is_all_day == search_params.is_all_day)

            print("[DEBUG] 모든 필터 적용 완료")

            # 전체 개수 조회
            print("[DEBUG] 전체 개수 조회 시작")
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()
            print(f"[DEBUG] 전체 일정 개수: {total_items}")

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            print(f"[DEBUG] 페이지네이션 적용 - offset: {offset}, limit: {page_size}")
            query = query.offset(offset).limit(page_size).order_by(Event.start_time)

            # 쿼리 실행
            print("[DEBUG] 최종 쿼리 실행 시작")
            result = await self.db.execute(query)
            events = result.scalars().all()
            print(f"[DEBUG] 조회된 일정 개수: {len(events)}")

            # 페이지네이션 정보 계산
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size
            print(f"[DEBUG] 계산된 총 페이지 수: {total_pages}")

            response = EventListResponse(
                events=[EventResponse.model_validate(event) for event in events],
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
                total_items=total_items if total_items is not None else 0,
            )

            print(f"[DEBUG] 응답 객체 생성 완료 - 일정 수: {len(response.events)}")
            return response

        except Exception as e:
            print(f"[ERROR] list_events 서비스에서 오류 발생: {e}")
            logger.error("list_events - 일정 목록 조회 실패: %s", e)
            raise

    async def list_user_events(
        self,
        user_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        calendar_id: Optional[UUID] = None,
    ):
        """사용자의 일정 목록 조회, 선택적으로 날짜 범위 및 캘린더 필터 적용"""

        # 사용자가 존재하는지 검증
        user = await self.user_service.get_user_by_id(user_id)
        if not user:
            raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

        stmt = select(Event).where(Event.owner_id == user_id)
        if start_date:
            stmt = stmt.where(Event.start_time >= start_date)
        if end_date:
            stmt = stmt.where(Event.end_time <= end_date)
        if calendar_id:
            stmt = stmt.where(Event.calendar_id == calendar_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_calendar_view(
        self, user_id: UUID, view_request: CalendarViewRequest
    ) -> EventListResponse:
        """캘린더 뷰를 위한 일정 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 쿼리 작성
            query = select(Event).options(
                selectinload(Event.creator), selectinload(Event.calendar)
            )

            # 날짜 범위로 필터링
            query = query.where(
                and_(
                    Event.start_time >= view_request.start_date,
                    Event.start_time <= view_request.end_date,
                )
            )

            # 지정된 경우 캘린더로 필터링
            if view_request.calendar_ids:
                query = query.where(Event.calendar_id.in_(view_request.calendar_ids))
            elif user_id:
                # 기본적으로 접근 가능한 캘린더로 설정
                accessible_calendars = await self._get_accessible_calendars(user_id)
                query = query.where(Event.calendar_id.in_(accessible_calendars))

            # 시작 시간으로 정렬
            query = query.order_by(Event.start_time)

            # 쿼리 실행
            result = await self.db.execute(query)
            events = result.scalars().all()

            return EventListResponse(
                events=[EventResponse.model_validate(event) for event in events],
                total_items=len(events),
                page_no=1,
                page_size=len(events),
                total_pages=1,
            )

        except Exception as e:
            logger.error("캘린더 뷰 조회 실패: %s", e)
            raise

    async def get_event_with_access_check(self, user_id: UUID, event_id: UUID):
        """ID로 일정을 조회하고 사용자의 접근 권한을 확인"""
        result = await self.db.execute(
            select(Event).where(Event.id == event_id, Event.owner_id == user_id)
        )
        event = result.scalar_one_or_none()
        return event

    async def get_calendar_stats(self, user_id: UUID) -> CalendarStatsResponse:
        """캘린더 통계 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 접근 제어가 적용된 기본 쿼리 작성
            accessible_calendars = []
            if user_id:
                accessible_calendars = await self._get_accessible_calendars(user_id)
            else:
                public_result = await self.db.execute(
                    select(Calendar.id).where(Calendar.is_public.is_(True))
                )
                accessible_calendars = [row[0] for row in public_result.fetchall()]

            base_query = select(Event).where(
                Event.calendar_id.in_(accessible_calendars)
            )

            # 전체 일정 수
            total_result = await self.db.execute(
                select(count()).select_from(base_query.subquery())
            )
            total_events = total_result.scalar()

            # 다가오는 일정 (다음 30일)
            future_date = datetime.now(timezone.utc) + timedelta(days=30)
            upcoming_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(
                        and_(
                            Event.start_time >= datetime.utcnow(),
                            Event.start_time <= future_date,
                        )
                    ).subquery()
                )
            )
            upcoming_events = upcoming_result.scalar()

            # 지연된 일정
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

            # 유형별 일정
            type_result = await self.db.execute(
                select(Event.event_type, count(Event.id))
                .select_from(base_query.subquery())
                .group_by(Event.event_type)
            )
            events_by_type = {row[0]: row[1] for row in type_result.fetchall()}

            # 상태별 일정
            status_result = await self.db.execute(
                select(Event.status, count(Event.id))
                .select_from(base_query.subquery())
                .group_by(Event.status)
            )
            events_by_status = {row[0]: row[1] for row in status_result.fetchall()}

            # 이번 주 및 이번 달 일정
            week_start = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
            month_start = datetime.utcnow().replace(day=1)

            week_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Event.start_time >= week_start).subquery()
                )
            )
            events_this_week = week_result.scalar()

            month_result = await self.db.execute(
                select(count()).select_from(
                    base_query.where(Event.start_time >= month_start).subquery()
                )
            )
            events_this_month = month_result.scalar()

            return CalendarStatsResponse(
                total_events=total_events if total_events is not None else 0,
                upcoming_events=(upcoming_events if upcoming_events is not None else 0),
                overdue_events=(overdue_events if overdue_events is not None else 0),
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
            logger.error("캘린더 통계 조회 실패: %s", e)
            raise

    async def get_event_dashboard(self, user_id: UUID) -> EventDashboardResponse:
        """사용자를 위한 일정 대시보드 데이터 조회"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            accessible_calendars = await self._get_accessible_calendars(user_id)
            base_query = select(Event).where(
                Event.calendar_id.in_(accessible_calendars)
            )

            # 오늘의 일정
            today_start = datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            today_end = today_start + timedelta(days=1)

            today_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_time >= today_start,
                        Event.start_time < today_end,
                    )
                )
                .order_by(Event.start_time)
            )
            today_events = today_result.scalars().all()

            # 다가오는 일정 (다음 7일)
            week_end = today_end + timedelta(days=7)
            upcoming_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_time >= today_end,
                        Event.start_time <= week_end,
                    )
                )
                .order_by(Event.start_time)
                .limit(10)
            )
            upcoming_events = upcoming_result.scalars().all()

            # 최근 일정 (지난 7일)
            week_start = today_start - timedelta(days=7)
            recent_result = await self.db.execute(
                base_query.options(selectinload(Event.creator))
                .where(
                    and_(
                        Event.start_time >= week_start,
                        Event.start_time < today_start,
                    )
                )
                .order_by(desc(Event.start_time))
                .limit(5)
            )
            recent_events = recent_result.scalars().all()

            # 지연된 일정
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

            # 통계 조회
            event_stats = await self.get_calendar_stats(user_id)

            return EventDashboardResponse(
                today_events=[EventResponse.model_validate(e) for e in today_events],
                upcoming_events=[
                    EventResponse.model_validate(e) for e in upcoming_events
                ],
                recent_events=[EventResponse.model_validate(e) for e in recent_events],
                overdue_events=[
                    EventResponse.model_validate(e) for e in overdue_events
                ],
                event_stats=event_stats,
            )

        except Exception as e:
            logger.error("일정 대시보드 조회 실패: %s", e)
            raise

    async def add_event_attendees(
        self, user_id: UUID, event_id: UUID, attendee_ids: List[UUID]
    ) -> bool:
        """일정에 참석자 추가"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 권한 확인
            has_access = await self._check_event_access(user_id, event_id)
            if not has_access:
                raise AuthorizationError("이 일정을 수정할 권한이 없습니다")

            # 일정 존재 확인
            event_result = await self.db.execute(
                select(Event).where(Event.id == event_id)
            )
            event = event_result.scalar_one_or_none()
            if not event:
                raise NotFoundError("일정을 찾을 수 없습니다")

            # 참석자 추가
            for attendee_id in attendee_ids:
                await self._add_event_attendee(user_id, event_id, attendee_id)

            await self.db.commit()

            logger.info("일정 %d에 참석자 추가됨: %s", event_id, attendee_ids)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("일정 %d에 참석자 추가 실패: %s", event_id, e)
            raise

    async def remove_event_attendee(
        self, user_id: UUID, event_id: UUID, attendee_id: UUID
    ) -> bool:
        """일정에서 참석자 제거"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 권한 확인
            has_access = await self._check_event_access(user_id, event_id)
            if not has_access:
                raise AuthorizationError("이 일정을 수정할 권한이 없습니다")

            # 참석자 찾아서 제거
            attendee_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.attendee_id == attendee_id,
                    )
                )
            )
            attendee = attendee_result.scalar_one_or_none()

            if attendee:
                await self.db.delete(attendee)
                await self.db.commit()
                logger.info("일정 %d에서 참석자 %d 제거됨", event_id, attendee_id)
                return True

            return False

        except Exception as e:
            await self.db.rollback()
            logger.error("일정 %d에서 참석자 제거 실패: %s", event_id, e)
            raise

    async def _check_event_access(self, user_id: UUID, event_id: UUID) -> bool:
        """사용자가 일정에 접근할 수 있는지 확인"""
        try:
            event_result = await self.db.execute(
                select(Event)
                .options(selectinload(Event.calendar))
                .where(Event.id == event_id)
            )
            event = event_result.scalar_one_or_none()

            if not event:
                return False

            owner_id = getattr(event, "owner_id", None)
            if owner_id is None:
                raise NotFoundError(f"ID {event_id}인 일정에 생성자가 없습니다")

            # 일정 생성자는 접근 권한 있음
            if owner_id == user_id:
                return True

            # 캘린더 소유자는 접근 권한 있음
            if event.calendar.owner_id == user_id:
                return True

            # 공개 캘린더의 일정은 접근 가능
            if event.calendar.is_public:
                return True

            # 사용자가 참석자인지 확인
            attendee_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.attendee_id == user_id,
                    )
                )
            )

            return attendee_result.scalar_one_or_none() is not None

        except Exception as e:
            logger.error("일정 접근 권한 확인 실패: %s", e)
            return False

    async def _get_accessible_calendars(self, user_id: UUID) -> List[UUID]:
        """사용자가 접근할 수 있는 캘린더 ID 목록 조회"""
        try:
            # 공개 캘린더 조회
            public_result = await self.db.execute(
                select(Calendar.id).where(Calendar.is_public.is_(True))
            )
            public_calendars = [row[0] for row in public_result.fetchall()]

            # 사용자가 소유한 캘린더 조회
            owned_result = await self.db.execute(
                select(Calendar.id).where(Calendar.owner_id == user_id)
            )
            owned_calendars = [row[0] for row in owned_result.fetchall()]

            # 합치고 중복 제거
            return list(set(public_calendars + owned_calendars))

        except Exception as e:
            logger.error("접근 가능한 캘린더 조회 실패: %s", e)
            return []

    async def _add_event_attendee(
        self, user_id: UUID, event_id: UUID, attendee_id: UUID
    ):
        """일정에 참석자 추가"""
        try:
            # 사용자가 존재하는지 검증
            user = await self.user_service.get_user_by_id(user_id)
            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 사용자 존재 확인
            attendee = await self.user_service.get_user_by_id(attendee_id)
            if not attendee:
                raise NotFoundError(f"ID {attendee_id}인 사용자를 찾을 수 없습니다")

            # 이미 참석 중인지 확인
            existing_result = await self.db.execute(
                select(EventAttendee).where(
                    and_(
                        EventAttendee.event_id == event_id,
                        EventAttendee.attendee_id == attendee_id,
                    )
                )
            )
            if existing_result.scalar_one_or_none():
                return  # 이미 참석 중

            # 참석자 생성
            attendee = EventAttendee(
                event_id=event_id, attendee_id=attendee_id, response_status="pending"
            )

            self.db.add(attendee)
            await self.db.flush()

        except Exception as e:
            logger.error(
                "일정 %s에 참석자 %s 추가 실패: %s",
                event_id,
                attendee_id,
                e,
            )
            raise


async def get_calendar_service(
    db: Optional[AsyncSession] = None,
) -> CalendarService:
    """캘린더 서비스 인스턴스 조회"""
    if db is None:
        async for session in get_async_session():
            return CalendarService(session)
    return CalendarService(cast(AsyncSession, db))
