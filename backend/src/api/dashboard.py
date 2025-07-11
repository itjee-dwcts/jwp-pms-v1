"""
대시보드 API Routes

대시보드 분석 및 요약 엔드포인트
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from schemas.dashboard import (
    ActivityDetailResponse,
    ActivityMetricsResponse,
    AsyncExportRequest,
    CacheInvalidationRequest,
    CacheStatusResponse,
    DashboardNotificationsResponse,
    DashboardOverviewResponse,
    DashboardSettingsRequest,
    DashboardSettingsResponse,
    DashboardStatsResponse,
    EventDetailResponse,
    ExportStatusResponse,
    PerformanceMetricsResponse,
    ProjectStatusStatsResponse,
    RecentActivityResponse,
    TaskStatusStatsResponse,
    UpcomingEventResponse,
    UpdateCheckResponse,
    UserActivitiesResponse,
    UserActivityLogRequest,
    UserWorkloadStatsResponse,
)
from services.dashboard import DashboardService, DashboardServiceError

logger = logging.getLogger(__name__)
router = APIRouter()


def _extract_user_id(user: User) -> UUID:
    """사용자 객체에서 UUID 안전하게 추출"""
    if isinstance(user.id, UUID):
        return user.id
    try:
        return UUID(str(user.id))
    except (ValueError, TypeError) as e:
        logger.error("사용자 ID를 UUID로 변환할 수 없습니다: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 인증 오류가 발생했습니다",
        ) from e


def _handle_dashboard_error(e: Exception) -> HTTPException:
    """대시보드 서비스 에러를 HTTP 예외로 변환"""
    if isinstance(e, DashboardServiceError):
        if "NotFound" in str(type(e)):
            return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif "Permission" in str(type(e)):
            return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "Validation" in str(type(e)):
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        else:
            return HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
            )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버 내부 오류가 발생했습니다",
        )


# ============================================================================
# 대시보드 통계 엔드포인트들
# ============================================================================


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="통계 기간 (1d, 7d, 30d, 90d)"),
    search: Optional[str] = Query(None, description="검색어"),
) -> DashboardStatsResponse:
    """
    대시보드 통계 데이터 조회
    """
    print("=" * 50)
    print("🔍 [DEBUG] get_dashboard_stats 함수 시작")
    print(f"👤 [DEBUG] 사용자: {current_user.username}")
    print(f"📅 [DEBUG] 기간: {period}")
    print(f"🔍 [DEBUG] 검색어: {search}")
    print("=" * 50)

    try:
        print("📊 [DEBUG] DashboardService 인스턴스 생성 중...")
        dashboard_service = DashboardService(db)

        print("🔑 [DEBUG] 사용자 ID 추출 중...")
        user_id = _extract_user_id(current_user)
        print(f"✅ [DEBUG] 추출된 사용자 ID: {user_id}")

        print("📈 [DEBUG] 통계 데이터 조회 중...")
        stats = await dashboard_service.get_comprehensive_stats(
            user_id=user_id, period=period, search=search
        )
        print(f"✅ [DEBUG] 통계 데이터 조회 완료: {type(stats)}")

        print("📝 [DEBUG] 응답 데이터 생성 중...")
        response = DashboardStatsResponse(**stats)
        print("✅ [DEBUG] get_dashboard_stats 함수 완료")
        return response
    except Exception as e:
        print(f"❌ [DEBUG] 오류 발생: {e}")
        print(f"❌ [DEBUG] 오류 타입: {type(e)}")
        logger.error("대시보드 통계 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/activities", response_model=List[RecentActivityResponse])
async def get_recent_activities(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(10, description="조회할 활동 수", ge=1, le=100),
    page_no: int = Query(0, description="건너뛸 활동 수", ge=0),
) -> List[RecentActivityResponse]:
    """
    최근 활동 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        activities = await dashboard_service.get_recent_activity(
            user_id=user_id, page_size=page_size, page_no=page_no
        )
        return [RecentActivityResponse(**activity) for activity in activities]
    except Exception as e:
        logger.error("활동 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/events", response_model=List[UpcomingEventResponse])
async def get_upcoming_events(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(5, description="조회할 이벤트 수", ge=1, le=50),
    days: int = Query(7, description="향후 며칠간의 이벤트", ge=1, le=365),
) -> List[UpcomingEventResponse]:
    """
    예정된 이벤트 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        events = await dashboard_service.get_upcoming_events(
            user_id=user_id, limit=limit, days=days
        )
        return [UpcomingEventResponse(**event) for event in events]
    except Exception as e:
        logger.error("이벤트 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/stats/projects", response_model=ProjectStatusStatsResponse)
async def get_project_status_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> ProjectStatusStatsResponse:
    """
    프로젝트 상태별 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_project_status_stats(user_id=user_id)
        return ProjectStatusStatsResponse(**stats)
    except Exception as e:
        logger.error("프로젝트 상태 통계 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/stats/tasks", response_model=TaskStatusStatsResponse)
async def get_task_status_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> TaskStatusStatsResponse:
    """
    작업 상태별 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_task_status_stats(user_id=user_id)
        return TaskStatusStatsResponse(**stats)
    except Exception as e:
        logger.error("작업 상태 통계 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/stats/workload", response_model=UserWorkloadStatsResponse)
async def get_user_workload_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> UserWorkloadStatsResponse:
    """
    사용자 워크로드 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_user_workload_stats(user_id=user_id)
        return UserWorkloadStatsResponse(**stats)
    except Exception as e:
        logger.error("워크로드 통계 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="개요 기간"),
    include_charts: bool = Query(True, description="차트 데이터 포함 여부"),
) -> DashboardOverviewResponse:
    """
    대시보드 개요 정보 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        overview = await dashboard_service.get_dashboard_overview(
            user_id=user_id, period=period, include_charts=include_charts
        )
        return DashboardOverviewResponse(**overview)
    except Exception as e:
        logger.error("대시보드 개요 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 사용자 활동 관리
# ============================================================================


@router.post("/activities")
async def log_user_activity(
    activity_data: UserActivityLogRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    사용자 활동 로그 추가
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        result = await dashboard_service.log_user_activity(
            user_id=user_id, **activity_data.dict()
        )
        return result
    except Exception as e:
        logger.error("활동 로그 추가 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/activities/{activity_id}", response_model=ActivityDetailResponse)
async def get_activity_detail(
    activity_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> ActivityDetailResponse:
    """
    사용자 활동 로그 상세 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        activity = await dashboard_service.get_activity_detail(
            user_id=user_id, activity_id=activity_id
        )
        return ActivityDetailResponse(**activity)
    except Exception as e:
        logger.error("활동 상세 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/users/{user_id}/activities", response_model=UserActivitiesResponse)
async def get_user_activities(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    page_no: int = Query(1, description="페이지 번호", ge=1),
) -> UserActivitiesResponse:
    """
    사용자별 활동 내역 조회
    """
    try:
        dashboard_service = DashboardService(db)
        current_user_id = _extract_user_id(current_user)
        result = await dashboard_service.get_user_activities(
            current_user_id=current_user_id,
            target_user_id=user_id,
            page_size=page_size,
            page_no=page_no,
        )
        return UserActivitiesResponse(**result)
    except Exception as e:
        logger.error("사용자 활동 내역 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 이벤트 관리
# ============================================================================


@router.get("/events/{event_id}", response_model=EventDetailResponse)
async def get_event_detail(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> EventDetailResponse:
    """
    이벤트 상세 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        event = await dashboard_service.get_event_detail(
            user_id=user_id, event_id=event_id
        )
        return EventDetailResponse(**event)
    except Exception as e:
        logger.error("이벤트 상세 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/users/{user_id}/events", response_model=List[UpcomingEventResponse])
async def get_user_events(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    days: int = Query(7, description="향후 며칠간의 이벤트", ge=1, le=365),
) -> List[UpcomingEventResponse]:
    """
    사용자별 예정된 이벤트 조회
    """
    try:
        dashboard_service = DashboardService(db)
        current_user_id = _extract_user_id(current_user)
        events = await dashboard_service.get_user_events(
            current_user_id=current_user_id,
            target_user_id=user_id,
            page_size=page_size,
            days=days,
        )
        return [UpcomingEventResponse(**event) for event in events]
    except Exception as e:
        logger.error("사용자 이벤트 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 설정 관리
# ============================================================================


@router.put("/settings")
async def update_dashboard_settings(
    settings: DashboardSettingsRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    대시보드 설정 업데이트
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.update_dashboard_settings(
            user_id=user_id, settings=settings.dict(exclude_unset=True)
        )
        return {"message": "설정이 업데이트되었습니다"}
    except Exception as e:
        logger.error("설정 업데이트 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/settings", response_model=DashboardSettingsResponse)
async def get_dashboard_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> DashboardSettingsResponse:
    """
    대시보드 설정 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        settings = await dashboard_service.get_dashboard_settings(user_id=user_id)
        return DashboardSettingsResponse(**settings)
    except Exception as e:
        logger.error("설정 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/settings/reset")
async def reset_dashboard_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    대시보드 설정 초기화
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.reset_dashboard_settings(user_id=user_id)
        return {"message": "설정이 초기화되었습니다"}
    except Exception as e:
        logger.error("설정 초기화 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 데이터 내보내기
# ============================================================================


@router.get("/export")
async def export_dashboard_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    export_format: str = Query("json", description="내보내기 형식 (json, csv, excel)"),
    period: Optional[str] = Query(None, description="기간"),
    data_type: Optional[str] = Query(None, description="데이터 타입"),
) -> StreamingResponse:
    """
    대시보드 데이터 내보내기 (즉시 다운로드)
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)

        filters = {}
        if period:
            filters["period"] = period
        if data_type:
            filters["data_type"] = data_type

        (
            file_content,
            filename,
            media_type,
        ) = await dashboard_service.export_dashboard_data(
            user_id=user_id, export_format=export_format
        )

        return StreamingResponse(
            file_content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error("데이터 내보내기 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/export/async")
async def start_async_export(
    export_request: AsyncExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    비동기 대시보드 데이터 내보내기 시작
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        export_id = await dashboard_service.start_async_export(
            user_id=user_id, **export_request.dict()
        )
        return {"export_id": export_id}
    except Exception as e:
        logger.error("비동기 내보내기 시작 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/export/{export_id}/status", response_model=ExportStatusResponse)
async def get_export_status(
    export_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> ExportStatusResponse:
    """
    내보내기 상태 확인
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        status_info = await dashboard_service.get_export_status(
            user_id=user_id, export_id=export_id
        )
        return ExportStatusResponse(**status_info)
    except Exception as e:
        logger.error("내보내기 상태 확인 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/export/{export_id}/download")
async def download_export(
    export_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> StreamingResponse:
    """
    내보낸 파일 다운로드
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        file_content, filename, media_type = await dashboard_service.download_export(
            user_id=user_id, export_id=export_id
        )

        return StreamingResponse(
            file_content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error("파일 다운로드 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/export/{export_id}/cancel")
async def cancel_export(
    export_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    내보내기 작업 취소
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.cancel_export(user_id=user_id, export_id=export_id)
        return {"message": "내보내기가 취소되었습니다"}
    except Exception as e:
        logger.error("내보내기 취소 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 캐시 관리
# ============================================================================


@router.post("/cache/invalidate")
async def invalidate_cache(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    대시보드 캐시 무효화
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.invalidate_cache(user_id=user_id)
        return {"message": "캐시가 무효화되었습니다"}
    except Exception as e:
        logger.error("캐시 무효화 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/cache/invalidate/specific")
async def invalidate_specific_cache(
    cache_request: CacheInvalidationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    특정 데이터 캐시 무효화
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.invalidate_specific_cache(
            user_id=user_id, cache_keys=cache_request.cache_keys
        )
        return {"message": "지정된 캐시가 무효화되었습니다"}
    except Exception as e:
        logger.error("특정 캐시 무효화 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/cache/status", response_model=CacheStatusResponse)
async def get_cache_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> CacheStatusResponse:
    """
    캐시 상태 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        cache_status = await dashboard_service.get_cache_status(user_id=user_id)
        return CacheStatusResponse(**cache_status)
    except Exception as e:
        logger.error("캐시 상태 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 알림 관리
# ============================================================================


@router.get("/notifications", response_model=DashboardNotificationsResponse)
async def get_dashboard_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    page_no: int = Query(1, description="페이지 번호", ge=1),
    unread_only: bool = Query(False, description="읽지 않은 알림만 조회"),
    priority: Optional[str] = Query(None, description="우선순위 필터"),
) -> DashboardNotificationsResponse:
    """
    대시보드 알림 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        notifications = await dashboard_service.get_notifications(
            user_id=user_id,
            page_size=page_size,
            page_no=page_no,
            unread_only=unread_only,
        )
        return DashboardNotificationsResponse(**notifications)
    except Exception as e:
        logger.error("알림 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    알림 읽음 처리
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.mark_notification_as_read(
            user_id=user_id, notification_id=notification_id
        )
        return {"message": "알림이 읽음 처리되었습니다"}
    except Exception as e:
        logger.error("알림 읽음 처리 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.post("/notifications/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    모든 알림 읽음 처리
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        await dashboard_service.mark_all_notifications_as_read(user_id=user_id)
        return {"message": "모든 알림이 읽음 처리되었습니다"}
    except Exception as e:
        logger.error("모든 알림 읽음 처리 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 실시간 업데이트
# ============================================================================


@router.get("/updates", response_model=UpdateCheckResponse)
async def check_for_updates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    last_update: Optional[str] = Query(None, description="마지막 업데이트 시간"),
) -> UpdateCheckResponse:
    """
    대시보드 업데이트 확인
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        updates = await dashboard_service.check_for_updates(
            user_id=user_id, last_update=last_update
        )
        return UpdateCheckResponse(**updates)
    except Exception as e:
        logger.error("업데이트 확인 오류: %s", e)
        raise _handle_dashboard_error(e) from e


# ============================================================================
# 성능 메트릭
# ============================================================================


@router.get("/metrics/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> PerformanceMetricsResponse:
    """
    대시보드 성능 메트릭 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        metrics = await dashboard_service.get_performance_metrics(user_id=user_id)
        return PerformanceMetricsResponse(**metrics)
    except Exception as e:
        logger.error("성능 메트릭 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e


@router.get("/metrics/activity", response_model=ActivityMetricsResponse)
async def get_activity_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="분석 기간 (1d, 7d, 30d)"),
) -> ActivityMetricsResponse:
    """
    사용자 활동 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        metrics = await dashboard_service.get_activity_metrics(
            user_id=user_id, period=period
        )
        return ActivityMetricsResponse(**metrics)
    except Exception as e:
        logger.error("활동 메트릭 조회 오류: %s", e)
        raise _handle_dashboard_error(e) from e
