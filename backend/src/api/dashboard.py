"""
대시보드 API Routes

대시보드 분석 및 요약 엔드포인트
"""

import logging
from typing import Any, Dict, List

from core.database import get_async_session
from core.dependencies import get_current_active_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.user import User
from services.dashboard import DashboardService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 대시보드 요약 조회
    """
    try:
        dashboard_service = DashboardService(db)
        summary = await dashboard_service.get_user_summary(int(str(current_user.id)))

        return summary

    except Exception as e:
        logger.error("대시보드 요약 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="대시보드 요약을 조회할 수 없습니다",
        ) from e


@router.get("/projects/stats")
async def get_project_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 프로젝트 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        stats = await dashboard_service.get_project_stats(int(str(current_user.id)))

        return stats

    except Exception as e:
        logger.error("프로젝트 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로젝트 통계를 조회할 수 없습니다",
        ) from e


@router.get("/tasks/stats")
async def get_task_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 작업 통계 조회
    """
    try:
        dashboard_service = DashboardService(db)
        stats = await dashboard_service.get_task_stats(int(str(current_user.id)))

        return stats

    except Exception as e:
        logger.error("작업 통계 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="작업 통계를 조회할 수 없습니다",
        ) from e


@router.get("/activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> List[Dict[str, Any]]:
    """
    현재 사용자의 최근 활동 조회
    """
    try:
        dashboard_service = DashboardService(db)
        activity = await dashboard_service.get_recent_activity(
            int(str(current_user.id))
        )

        return activity

    except Exception as e:
        logger.error("최근 활동 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="최근 활동을 조회할 수 없습니다",
        ) from e


@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 알림 조회
    """
    try:
        dashboard_service = DashboardService(db)
        notifications = await dashboard_service.get_notifications(
            int(str(current_user.id))
        )

        return notifications

    except Exception as e:
        logger.error("알림 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 조회할 수 없습니다",
        ) from e


@router.get("/calendar/upcoming")
async def get_upcoming_events(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> List[Dict[str, Any]]:
    """
    현재 사용자의 다가오는 일정 조회
    """
    try:
        dashboard_service = DashboardService(db)
        events = await dashboard_service.get_upcoming_events(int(str(current_user.id)))

        return events

    except Exception as e:
        logger.error("다가오는 일정 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="다가오는 일정을 조회할 수 없습니다",
        ) from e


@router.get("/workload")
async def get_workload_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 업무량 요약 조회
    """
    try:
        dashboard_service = DashboardService(db)
        workload = await dashboard_service.get_workload_summary(
            int(str(current_user.id))
        )

        return workload

    except Exception as e:
        logger.error("업무량 요약 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="업무량 요약을 조회할 수 없습니다",
        ) from e


@router.get("/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 성과 지표 조회
    """
    try:
        dashboard_service = DashboardService(db)
        metrics = await dashboard_service.get_performance_metrics(
            int(str(current_user.id))
        )

        return metrics

    except Exception as e:
        logger.error("성과 지표 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="성과 지표를 조회할 수 없습니다",
        ) from e


@router.get("/quick-actions")
async def get_quick_actions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 빠른 작업 목록 조회
    """
    try:
        dashboard_service = DashboardService(db)
        actions = await dashboard_service.get_quick_actions(int(str(current_user.id)))

        return actions

    except Exception as e:
        logger.error("빠른 작업 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="빠른 작업 목록을 조회할 수 없습니다",
        ) from e


@router.get("/team/overview")
async def get_team_overview(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    """
    현재 사용자의 팀 개요 조회
    """
    try:
        dashboard_service = DashboardService(db)
        overview = await dashboard_service.get_team_overview(int(str(current_user.id)))

        return overview

    except Exception as e:
        logger.error("팀 개요 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="팀 개요를 조회할 수 없습니다",
        ) from e
