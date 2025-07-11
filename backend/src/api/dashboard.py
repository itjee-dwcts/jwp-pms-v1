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
    DashboardStatsResponse,
    RecentActivityResponse,
    UpcomingEventResponse,
)
from services.dashboard import DashboardService

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


# ============================================================================
# 대시보드 통계 엔드포인트들
# ============================================================================


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="통계 기간 (1d, 7d, 30d, 90d)"),
    type: str = Query("all", description="데이터 타입 (all, projects, tasks, events)"),
    search: Optional[str] = Query(None, description="검색어"),
) -> Dict[str, Any]:
    """
    대시보드 통계 데이터 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_comprehensive_stats(
            user_id=user_id, period=period, data_type=type, search=search
        )
        return stats
    except Exception as e:
        logger.error("대시보드 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대시보드 통계를 조회할 수 없습니다",
        ) from e


@router.get("/activities")
async def get_recent_activities(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(10, description="조회할 활동 수", ge=1, le=100),
    offset: int = Query(0, description="건너뛸 활동 수", ge=0),
) -> List[Dict[str, Any]]:
    """
    최근 활동 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        activities = await dashboard_service.get_recent_activity(
            user_id=user_id, limit=limit, offset=offset
        )
        return activities
    except Exception as e:
        logger.error("활동 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="활동을 조회할 수 없습니다",
        ) from e


@router.get("/events")
async def get_upcoming_events(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(5, description="조회할 이벤트 수", ge=1, le=50),
    days: int = Query(7, description="향후 며칠간의 이벤트", ge=1, le=365),
) -> List[Dict[str, Any]]:
    """
    예정된 이벤트 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        events = await dashboard_service.get_upcoming_events(
            user_id=user_id, limit=limit, days=days
        )
        return events
    except Exception as e:
        logger.error("이벤트 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이벤트를 조회할 수 없습니다",
        ) from e


@router.get("/stats/projects")
async def get_project_status_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    프로젝트 상태별 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_project_status_stats(user_id=user_id)
        return stats
    except Exception as e:
        logger.error("프로젝트 상태 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트 상태 통계를 조회할 수 없습니다",
        ) from e


@router.get("/stats/tasks")
async def get_task_status_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    작업 상태별 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_task_status_stats(user_id=user_id)
        return stats
    except Exception as e:
        logger.error("작업 상태 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업 상태 통계를 조회할 수 없습니다",
        ) from e


@router.get("/stats/workload")
async def get_user_workload_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    사용자 워크로드 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        stats = await dashboard_service.get_user_workload_stats(user_id=user_id)
        return stats
    except Exception as e:
        logger.error("워크로드 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="워크로드 통계를 조회할 수 없습니다",
        ) from e


@router.get("/overview")
async def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="개요 기간"),
    include_charts: bool = Query(True, description="차트 데이터 포함 여부"),
) -> Dict[str, Any]:
    """
    대시보드 개요 정보 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        overview = await dashboard_service.get_dashboard_overview(
            user_id=user_id, period=period, include_charts=include_charts
        )
        return overview
    except Exception as e:
        logger.error("대시보드 개요 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대시보드 개요를 조회할 수 없습니다",
        ) from e


# ============================================================================
# 사용자 활동 관리
# ============================================================================


@router.post("/activities")
async def log_user_activity(
    activity_data: Dict[str, Any],
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
            user_id=user_id, **activity_data
        )
        return result
    except Exception as e:
        logger.error("활동 로그 추가 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="활동 로그를 추가할 수 없습니다",
        ) from e


@router.get("/activities/{activity_id}")
async def get_activity_detail(
    activity_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    사용자 활동 로그 상세 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        activity = await dashboard_service.get_activity_detail(
            user_id=user_id, activity_id=activity_id
        )
        return activity
    except Exception as e:
        logger.error("활동 상세 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="활동 상세를 조회할 수 없습니다",
        ) from e


@router.get("/users/{user_id}/activities")
async def get_user_activities(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    page_no: int = Query(1, description="페이지 번호", ge=1),
    start_date: Optional[str] = Query(None, description="시작 날짜"),
    end_date: Optional[str] = Query(None, description="종료 날짜"),
    action: Optional[str] = Query(None, description="활동 타입"),
) -> Dict[str, Any]:
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
            start_date=start_date,
            end_date=end_date,
            action=action,
        )
        return result
    except Exception as e:
        logger.error("사용자 활동 내역 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 활동 내역을 조회할 수 없습니다",
        ) from e


# ============================================================================
# 이벤트 관리
# ============================================================================


@router.get("/events/{event_id}")
async def get_event_detail(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    이벤트 상세 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        event = await dashboard_service.get_event_detail(
            user_id=user_id, event_id=event_id
        )
        return event
    except Exception as e:
        logger.error("이벤트 상세 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이벤트 상세를 조회할 수 없습니다",
        ) from e


@router.get("/users/{user_id}/events")
async def get_user_events(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    days: int = Query(7, description="향후 며칠간의 이벤트", ge=1, le=365),
    status: Optional[str] = Query(None, description="이벤트 상태"),
) -> List[Dict[str, Any]]:
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
            status=status,
        )
        return events
    except Exception as e:
        logger.error("사용자 이벤트 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 이벤트를 조회할 수 없습니다",
        ) from e


# ============================================================================
# 설정 관리
# ============================================================================


@router.put("/settings")
async def update_dashboard_settings(
    settings: Dict[str, Any],
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
            user_id=user_id, settings=settings
        )
        return {"message": "설정이 업데이트되었습니다"}
    except Exception as e:
        logger.error("설정 업데이트 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="설정을 업데이트할 수 없습니다",
        ) from e


@router.get("/settings")
async def get_dashboard_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    대시보드 설정 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        settings = await dashboard_service.get_dashboard_settings(user_id=user_id)
        return settings
    except Exception as e:
        logger.error("설정 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="설정을 조회할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="설정을 초기화할 수 없습니다",
        ) from e


# ============================================================================
# 데이터 내보내기
# ============================================================================


@router.get("/export")
async def export_dashboard_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    format: str = Query("json", description="내보내기 형식 (json, csv, excel)"),
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
            user_id=user_id, format=format, filters=filters
        )

        return StreamingResponse(
            file_content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error("데이터 내보내기 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터를 내보낼 수 없습니다",
        ) from e


@router.post("/export/async")
async def start_async_export(
    export_request: Dict[str, Any],
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
            user_id=user_id, **export_request
        )
        return {"export_id": export_id}
    except Exception as e:
        logger.error("비동기 내보내기 시작 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="내보내기를 시작할 수 없습니다",
        ) from e


@router.get("/export/{export_id}/status")
async def get_export_status(
    export_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    내보내기 상태 확인
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        status_info = await dashboard_service.get_export_status(
            user_id=user_id, export_id=export_id
        )
        return status_info
    except Exception as e:
        logger.error("내보내기 상태 확인 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="내보내기 상태를 확인할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일을 다운로드할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="내보내기를 취소할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캐시를 무효화할 수 없습니다",
        ) from e


@router.post("/cache/invalidate/specific")
async def invalidate_specific_cache(
    cache_request: Dict[str, List[str]],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, str]:
    """
    특정 데이터 캐시 무효화
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        cache_keys = cache_request.get("cache_keys", [])
        await dashboard_service.invalidate_specific_cache(
            user_id=user_id, cache_keys=cache_keys
        )
        return {"message": "지정된 캐시가 무효화되었습니다"}
    except Exception as e:
        logger.error("특정 캐시 무효화 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캐시를 무효화할 수 없습니다",
        ) from e


@router.get("/cache/status")
async def get_cache_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    캐시 상태 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        cache_status = await dashboard_service.get_cache_status(user_id=user_id)
        return cache_status
    except Exception as e:
        logger.error("캐시 상태 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="캐시 상태를 조회할 수 없습니다",
        ) from e


# ============================================================================
# 알림 관리
# ============================================================================


@router.get("/notifications")
async def get_dashboard_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    page_size: int = Query(20, description="페이지 크기", ge=1, le=100),
    page_no: int = Query(1, description="페이지 번호", ge=1),
    unread_only: bool = Query(False, description="읽지 않은 알림만 조회"),
    priority: Optional[str] = Query(None, description="우선순위 필터"),
) -> Dict[str, Any]:
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
            priority=priority,
        )
        return notifications
    except Exception as e:
        logger.error("알림 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 조회할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 읽음 처리할 수 없습니다",
        ) from e


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 읽음 처리할 수 없습니다",
        ) from e


# ============================================================================
# 실시간 업데이트
# ============================================================================


@router.get("/updates")
async def check_for_updates(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    last_update: Optional[str] = Query(None, description="마지막 업데이트 시간"),
) -> Dict[str, Any]:
    """
    대시보드 업데이트 확인
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        updates = await dashboard_service.check_for_updates(
            user_id=user_id, last_update=last_update
        )
        return updates
    except Exception as e:
        logger.error("업데이트 확인 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="업데이트를 확인할 수 없습니다",
        ) from e


# ============================================================================
# 성능 메트릭
# ============================================================================


@router.get("/metrics/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    대시보드 성능 메트릭 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        metrics = await dashboard_service.get_performance_metrics(user_id=user_id)
        return metrics
    except Exception as e:
        logger.error("성능 메트릭 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="성능 메트릭을 조회할 수 없습니다",
        ) from e


@router.get("/metrics/activity")
async def get_activity_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="분석 기간 (1d, 7d, 30d)"),
) -> Dict[str, Any]:
    """
    사용자 활동 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        metrics = await dashboard_service.get_activity_metrics(
            user_id=user_id, period=period
        )
        return metrics
    except Exception as e:
        logger.error("활동 메트릭 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="활동 메트릭을 조회할 수 없습니다",
        ) from e


# ============================================================================
# 기존 호환성 엔드포인트들 (기존 코드와의 호환성 유지)
# ============================================================================


@router.get("/summary", response_model=DashboardStatsResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    period: str = Query("7d", description="통계 기간 (1d, 7d, 30d, 90d)"),
    data_type: str = Query(
        "all", description="데이터 타입 (all, projects, tasks, events)"
    ),
    search: Optional[str] = Query(None, description="검색어"),
) -> DashboardStatsResponse:
    """
    현재 사용자의 대시보드 요약 조회 (기존 호환성)
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        summary = await dashboard_service.get_user_summary(
            user_id=user_id, period=period, data_type=data_type, search=search
        )
        return DashboardStatsResponse(**summary)
    except Exception as e:
        logger.error("대시보드 요약 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대시보드 요약을 조회할 수 없습니다",
        ) from e


@router.get("/activity", response_model=List[RecentActivityResponse])
async def get_recent_activity(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(10, description="조회할 활동 수", ge=1, le=100),
    offset: int = Query(0, description="건너뛸 활동 수", ge=0),
    search: Optional[str] = Query(None, description="활동 검색어"),
) -> List[RecentActivityResponse]:
    """
    현재 사용자의 최근 활동 조회 (기존 호환성)
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        activities = await dashboard_service.get_recent_activity(
            user_id=user_id, limit=limit, offset=offset, search=search
        )
        return [RecentActivityResponse(**activity) for activity in activities]
    except Exception as e:
        logger.error("최근 활동 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="최근 활동을 조회할 수 없습니다",
        ) from e


@router.get("/calendar/upcoming", response_model=List[UpcomingEventResponse])
async def get_upcoming_calendar_events(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(5, description="조회할 이벤트 수", ge=1, le=50),
    days: int = Query(7, description="향후 며칠간의 이벤트", ge=1, le=365),
    search: Optional[str] = Query(None, description="이벤트 검색어"),
) -> List[UpcomingEventResponse]:
    """
    현재 사용자의 다가오는 일정 조회 (기존 호환성)
    """
    try:
        dashboard_service = DashboardService(db)
        user_id = _extract_user_id(current_user)
        events = await dashboard_service.get_upcoming_events(
            user_id=user_id, limit=limit, days=days, search=search
        )
        return [UpcomingEventResponse(**event) for event in events]
    except Exception as e:
        logger.error("다가오는 일정 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="다가오는 일정을 조회할 수 없습니다",
        ) from e
