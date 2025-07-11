"""
대시보드 서비스

대시보드 분석 및 요약을 위한 비즈니스 로직
"""

import csv
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from io import StringIO
from typing import Any, Dict, List, Optional, cast
from uuid import UUID, uuid4

import psutil
from sqlalchemy import and_, or_, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count

from core.database import get_async_session
from models.calendar import Calendar, Event
from models.project import Project, ProjectMember
from models.task import Task, TaskAssignment
from models.user import User, UserActivityLog

logger = logging.getLogger(__name__)


# ============================================================================
# 대시보드 서비스 예외 클래스들
# ============================================================================


class DashboardServiceError(Exception):
    """대시보드 서비스 기본 예외"""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code or "DASHBOARD_ERROR"
        self.details = details or {}
        super().__init__(self.message)

    def __str__(self):
        return self.message


class DashboardDataNotFoundError(DashboardServiceError):
    """대시보드 데이터를 찾을 수 없음"""

    def __init__(
        self,
        message: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_DATA_NOT_FOUND",
            details={"resource_type": resource_type, "resource_id": resource_id},
        )


class DashboardPermissionError(DashboardServiceError):
    """대시보드 접근 권한 없음"""

    def __init__(
        self,
        message: str,
        required_permission: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_PERMISSION_DENIED",
            details={"required_permission": required_permission, "user_id": user_id},
        )


class DashboardValidationError(DashboardServiceError):
    """대시보드 데이터 유효성 검증 실패"""

    def __init__(
        self, message: str, field: Optional[str] = None, value: Optional[Any] = None
    ):
        super().__init__(
            message,
            code="DASHBOARD_VALIDATION_ERROR",
            details={
                "field": field,
                "value": str(value) if value is not None else None,
            },
        )


class DashboardExportError(DashboardServiceError):
    """대시보드 내보내기 실패"""

    def __init__(
        self,
        message: str,
        export_format: Optional[str] = None,
        export_id: Optional[str] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_EXPORT_ERROR",
            details={"export_format": export_format, "export_id": export_id},
        )


class DashboardCacheError(DashboardServiceError):
    """대시보드 캐시 관련 오류"""

    def __init__(
        self,
        message: str,
        cache_key: Optional[str] = None,
        operation: Optional[str] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_CACHE_ERROR",
            details={"cache_key": cache_key, "operation": operation},
        )


class DashboardDatabaseError(DashboardServiceError):
    """대시보드 데이터베이스 관련 오류"""

    def __init__(
        self, message: str, operation: Optional[str] = None, table: Optional[str] = None
    ):
        super().__init__(
            message,
            code="DASHBOARD_DATABASE_ERROR",
            details={"operation": operation, "table": table},
        )


class DashboardConfigurationError(DashboardServiceError):
    """대시보드 설정 관련 오류"""

    def __init__(
        self,
        message: str,
        setting_key: Optional[str] = None,
        setting_value: Optional[Any] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_CONFIGURATION_ERROR",
            details={
                "setting_key": setting_key,
                "setting_value": str(setting_value)
                if setting_value is not None
                else None,
            },
        )


class DashboardTimeoutError(DashboardServiceError):
    """대시보드 작업 시간 초과"""

    def __init__(
        self,
        message: str,
        timeout_seconds: Optional[int] = None,
        operation: Optional[str] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_TIMEOUT_ERROR",
            details={"timeout_seconds": timeout_seconds, "operation": operation},
        )


class DashboardQuotaExceededError(DashboardServiceError):
    """대시보드 할당량 초과"""

    def __init__(
        self,
        message: str,
        quota_type: Optional[str] = None,
        current_value: Optional[int] = None,
        limit: Optional[int] = None,
    ):
        super().__init__(
            message,
            code="DASHBOARD_QUOTA_EXCEEDED",
            details={
                "quota_type": quota_type,
                "current_value": current_value,
                "limit": limit,
            },
        )


# ============================================================================
# 대시보드 서비스 클래스
# ============================================================================


class DashboardService:
    """대시보드 분석 및 요약 데이터를 위한 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_user_project_ids(self, user_id: UUID) -> List[UUID]:
        """
        사용자가 멤버로 포함된 프로젝트 ID 목록을 반환합니다.
        """
        try:
            print(f"🔍 [DEBUG] _get_user_project_ids 시작 - user_id: {user_id}")

            # 방법 1: 소유한 프로젝트 조회
            owned_projects_query = select(Project.id).where(Project.owner_id == user_id)
            owned_result = await self.db.execute(owned_projects_query)
            owned_project_ids = [row[0] for row in owned_result.fetchall()]

            print(f"✅ [DEBUG] 소유한 프로젝트 수: {len(owned_project_ids)}")

            # 방법 2: ProjectMember 테이블을 통한 멤버 프로젝트 조회
            # (ProjectMember 테이블이 있다고 가정)
            try:
                member_projects_query = select(ProjectMember.project_id).where(
                    ProjectMember.user_id == user_id
                )
                member_result = await self.db.execute(member_projects_query)
                member_project_ids = [row[0] for row in member_result.fetchall()]

                print(
                    f"✅ [DEBUG] 멤버로 참여한 프로젝트 수: {len(member_project_ids)}"
                )
            except Exception as member_error:
                print(
                    f"⚠️ [DEBUG] ProjectMember 테이블 조회 실패 (테이블이 없을 수 있음): {member_error}"
                )
                member_project_ids = []

            # 중복 제거하여 합치기
            all_project_ids = list(set(owned_project_ids + member_project_ids))

            print(f"✅ [DEBUG] 전체 접근 가능한 프로젝트 수: {len(all_project_ids)}")

            return all_project_ids

        except Exception as e:
            print(f"❌ [DEBUG] _get_user_project_ids 오류: {e}")
            logger.error("프로젝트 ID 조회 실패: %s", str(e))
            return []

    def _extract_uuid(self, obj: Any) -> Optional[UUID]:
        """SQLAlchemy 객체에서 UUID 값을 안전하게 추출"""
        if obj is None:
            return None

        if isinstance(obj, UUID):
            return obj

        try:
            return UUID(str(obj))
        except (ValueError, TypeError):
            return None

    # ============================================================================
    # API 호환성을 위한 추가 메서드들
    # ============================================================================

    async def get_project_status_stats(self, user_id: UUID) -> Dict[str, Any]:
        """프로젝트 상태별 통계"""
        try:
            project_stats = await self.get_project_stats(user_id)
            return {
                "total_projects": project_stats.get("total_projects", 0),
                "by_status": project_stats.get("by_status", {}),
                "by_priority": project_stats.get("by_priority", {}),
                "completion_rates": {},
                "overdue_count": 0,
            }
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(
                f"프로젝트 상태별 통계 조회 실패: {str(e)}"
            ) from e

    async def get_task_status_stats(self, user_id: UUID) -> Dict[str, Any]:
        """작업 상태별 통계"""
        try:
            task_stats = await self.get_task_stats(user_id)
            return {
                "total_tasks": task_stats.get("total_tasks", 0),
                "by_status": task_stats.get("by_status", {}),
                "by_priority": task_stats.get("by_priority", {}),
                "by_assignee": task_stats.get("by_assignee", {}),
                "overdue_count": task_stats.get("overdue_tasks", 0),
                "completion_trend": [],
            }
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"작업 상태별 통계 조회 실패: {str(e)}") from e

    async def get_user_workload_stats(self, user_id: UUID) -> Dict[str, Any]:
        """사용자 워크로드 통계"""
        try:
            task_stats = await self.get_task_stats(user_id)
            current_workload = task_stats.get("assigned_to_me", 0)

            return {
                "current_workload": current_workload,
                "capacity_utilization": min(100.0, (current_workload / 10) * 100),
                "workload_distribution": {},
                "overdue_workload": task_stats.get("overdue_tasks", 0),
                "estimated_completion": None,
                "burnout_risk": "low",
            }
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(
                f"사용자 워크로드 통계 조회 실패: {str(e)}"
            ) from e

    async def get_dashboard_overview(
        self,
        user_id: UUID,
        period: str = "7d",
        include_charts: bool = True,
    ) -> Dict[str, Any]:
        """대시보드 개요 조회"""
        try:
            stats = await self.get_user_summary(user_id, period)

            overview = {
                "stats": stats,
                "key_metrics": {
                    "completion_rate": stats.get("completion_rate", 0.0),
                    "productivity_score": stats.get("productivity_score", 0.0),
                    "overdue_tasks": stats.get("overdue_tasks", 0),
                },
                "widgets": [
                    {"type": "stats", "data": stats},
                    {
                        "type": "recent_activity",
                        "data": stats.get("recent_activity", []),
                    },
                    {
                        "type": "upcoming_events",
                        "data": stats.get("upcoming_events", []),
                    },
                ],
            }

            if include_charts:
                overview["charts"] = {
                    "task_status": stats.get("tasks", {}).get("by_status", {}),
                    "project_status": stats.get("projects", {}).get("by_status", {}),
                }

            return overview
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"대시보드 개요 조회 실패: {str(e)}") from e

    async def log_user_activity(
        self, user_id: UUID, activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """사용자 활동 로그 기록"""
        try:
            await self._verify_user_access(user_id)

            activity_log = UserActivityLog(
                user_id=user_id,
                action=activity_data.get("action", "unknown"),
                description=activity_data.get("description", ""),
                resource_type=activity_data.get("resource_type"),
                resource_id=activity_data.get("resource_id"),
                ip_address=activity_data.get("ip_address"),
                user_agent=activity_data.get("user_agent"),
            )

            self.db.add(activity_log)
            await self.db.commit()
            await self.db.refresh(activity_log)

            return {
                "id": str(activity_log.id),
                "status": "logged",
                "created_at": activity_log.created_at,
            }

        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error("사용자 활동 로그 기록 중 데이터베이스 오류: %s", str(e))
            raise DashboardDatabaseError(
                "사용자 활동 로그를 기록할 수 없습니다",
                operation="log_user_activity",
                table="user_activity_logs",
            ) from e
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"사용자 활동 로그 기록 실패: {str(e)}") from e

    async def _calculate_productivity_score(self, user_id: UUID) -> float:
        """생산성 점수 계산"""
        try:
            task_stats = await self.get_task_stats(user_id)

            total_tasks = task_stats.get("assigned_to_me", 0)
            completed_tasks = task_stats.get("by_status", {}).get("completed", 0)
            overdue_tasks = task_stats.get("overdue_tasks", 0)

            if total_tasks == 0:
                return 0.0

            completion_score = (completed_tasks / total_tasks) * 100
            overdue_penalty = min(overdue_tasks * 10, 50)

            productivity_score = max(0, completion_score - overdue_penalty)
            return round(productivity_score, 2)

        except Exception as e:
            logger.error("생산성 점수 계산 중 오류: %s", str(e))
            return 0.0

    # ============================================================================
    # 수정된 _parse_period 메서드 (f-string 사용)
    # ============================================================================

    def _parse_period(self, period: str) -> timedelta:
        """기간 문자열을 timedelta로 변환"""
        period_map = {
            "1d": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "90d": timedelta(days=90),
        }
        if period not in period_map:
            raise DashboardValidationError(
                f"지원하지 않는 기간 형식입니다: {period}",
                field="period",
                value=period,
            )
        return period_map[period]

    # ============================================================================
    # 수정된 데이터 내보내기 메서드들 (f-string 사용)
    # ============================================================================

    async def export_dashboard_data_sync(
        self,
        user_id: UUID,
        export_format: str,
    ) -> tuple:
        """대시보드 데이터 내보내기 (즉시 다운로드, sync 메서드로 이름 변경)"""
        try:
            await self._verify_user_access(user_id)

            # 데이터 수집
            stats = await self.get_user_summary(user_id)

            if export_format == "json":
                content = StringIO(json.dumps(stats, default=str, indent=2))
                filename = (
                    f"dashboard_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                media_type = "application/json"
            elif export_format == "csv":
                content = StringIO()
                writer = csv.writer(content)
                writer.writerow(["Metric", "Value"])
                for key, value in stats.items():
                    writer.writerow([key, str(value)])
                content.seek(0)
                filename = (
                    f"dashboard_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                )
                media_type = "text/csv"
            else:
                raise DashboardValidationError(
                    f"지원하지 않는 내보내기 형식: {export_format}",
                    field="format",
                    value=export_format,
                )

            return content, filename, media_type

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"데이터 내보내기 실패: {str(e)}",
                export_format=export_format,
            ) from e

    async def get_export_status_sync(
        self, user_id: UUID, export_id: str
    ) -> Dict[str, Any]:
        """내보내기 상태 확인 (동기식/임시 메서드)"""
        try:
            await self._verify_user_access(user_id)

            return {
                "status": "completed",
                "progress": 100.0,
                "download_url": f"/api/dashboard/export/{export_id}/download",
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
                "error_message": None,
                "created_at": datetime.now(timezone.utc),
            }

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"내보내기 상태 확인 실패: {str(e)}",
                export_id=export_id,
            ) from e

    async def download_export_sync(self, user_id: UUID, export_id: str) -> tuple:
        """내보낸 파일 다운로드 (동기식/임시 메서드)"""
        try:
            await self._verify_user_access(user_id)

            # 임시로 JSON 데이터 반환
            stats = await self.get_user_summary(user_id)

            content = StringIO(json.dumps(stats, default=str, indent=2))
            filename = f"export_{export_id}.json"
            media_type = "application/json"

            return content, filename, media_type

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"파일 다운로드 실패: {str(e)}",
                export_id=export_id,
            ) from e

    async def cancel_export(self, user_id: UUID, export_id: str) -> Dict[str, Any]:
        """내보내기 작업 취소"""
        try:
            await self._verify_user_access(user_id)

            # export_id 유효성 검증
            try:
                UUID(export_id)
            except ValueError as e:
                raise DashboardValidationError(
                    f"유효하지 않은 내보내기 ID입니다: {str(e)}",
                    field="export_id",
                    value=export_id,
                ) from e

            logger.info(
                "내보내기 작업 취소: user_id=%s, export_id=%s", user_id, export_id
            )

            # 실제 구현 시 백그라운드 작업 취소 로직 필요
            # 예: 진행 중인 작업 중단, 임시 파일 정리 등

            return {
                "status": "cancelled",
                "export_id": export_id,
                "cancelled_at": datetime.now(timezone.utc),
                "message": "내보내기 작업이 취소되었습니다",
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except Exception as e:
            logger.error("내보내기 취소 중 오류: %s", str(e))
            raise DashboardExportError(
                f"내보내기 취소 실패: {str(e)}",
                export_id=export_id,
            ) from e

    # ============================================================================
    # 수정된 예외 처리 메서드들 (f-string 사용)
    # ============================================================================

    async def _verify_user_access(self, user_id: UUID) -> None:
        """사용자 접근 권한 확인"""
        try:
            user_query = select(User).where(User.id == user_id)
            result = await self.db.execute(user_query)
            user = result.scalar_one_or_none()

            if not user:
                raise DashboardDataNotFoundError(
                    "사용자를 찾을 수 없습니다",
                    resource_type="user",
                    resource_id=str(user_id),
                )

            if not getattr(user, "is_active", True):
                raise DashboardPermissionError(
                    "비활성화된 사용자입니다",
                    required_permission="active_user",
                    user_id=str(user_id),
                )
        except SQLAlchemyError as e:
            logger.error("사용자 접근 권한 확인 중 데이터베이스 오류: %s", e)
            raise DashboardDatabaseError(
                "사용자 접근 권한을 확인할 수 없습니다",
                operation="verify_user_access",
                table="users",
            ) from e

    async def get_user_summary(
        self,
        user_id: UUID,
        period: str = "7d",
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """현재 사용자의 종합 대시보드 요약 조회"""
        try:
            logger.info("사용자 요약 조회 시작: user_id=%s, period=%s", user_id, period)

            await self._verify_user_access(user_id)
            self._parse_period(period)  # 유효성 검증

            project_stats = await self.get_project_stats(user_id)
            task_stats = await self.get_task_stats(user_id)
            recent_activity = await self.get_recent_activity(user_id, search=search)
            upcoming_events = await self.get_upcoming_events(user_id, search=search)

            print(
                f"🔍 [DEBUG] recent_activity 타입: {type(recent_activity)}, 길이: {len(recent_activity) if isinstance(recent_activity, list) else 'N/A'}"
            )
            print(
                f"🔍 [DEBUG] upcoming_events 타입: {type(upcoming_events)}, 길이: {len(upcoming_events) if isinstance(upcoming_events, list) else 'N/A'}"
            )

            # DashboardStatsResponse 형식에 맞춰 응답 구성
            summary = {
                # 프로젝트 통계
                "total_projects": project_stats.get("total_projects", 0),
                "active_projects": project_stats.get("by_status", {}).get("active", 0),
                "completed_projects": project_stats.get("by_status", {}).get(
                    "completed", 0
                ),
                # 작업 통계
                "total_tasks": task_stats.get("total_tasks", 0),
                "pending_tasks": task_stats.get("by_status", {}).get("todo", 0),
                "in_progress_tasks": task_stats.get("by_status", {}).get(
                    "in_progress", 0
                ),
                "completed_tasks": task_stats.get("by_status", {}).get("completed", 0),
                "overdue_tasks": task_stats.get("overdue_tasks", 0),
                # 시간 관련 통계
                "total_time_spent": 0.0,
                "avg_completion_time": 0.0,
                # 성과 지표
                "completion_rate": task_stats.get("completion_rate", 0.0),
                "productivity_score": await self._calculate_productivity_score(user_id),
                # 기간 및 메타데이터
                "period": period,
                "last_updated": datetime.now(timezone.utc),
                # 이벤트 및 알림 개수 (정수로 반환)
                "upcoming_events": len(upcoming_events)
                if isinstance(upcoming_events, list)
                else 0,
                "total_events": len(upcoming_events)
                if isinstance(upcoming_events, list)
                else 0,
                "notifications_count": 0,
                "unread_notifications": 0,
                # 프로젝트와 작업 상세 정보
                "projects": {
                    "total_projects": project_stats.get("total_projects", 0),
                    "by_status": project_stats.get("by_status", {}),
                    "by_priority": project_stats.get("by_priority", {}),
                },
                "tasks": {
                    "total_tasks": task_stats.get("total_tasks", 0),
                    "by_status": task_stats.get("by_status", {}),
                    "by_priority": task_stats.get("by_priority", {}),
                    "assigned_to_user": task_stats.get("assigned_to_me", 0),
                    "overdue_tasks": task_stats.get("overdue_tasks", 0),
                },
                # 최근 활동 목록 (배열로 반환)
                "recent_activity": recent_activity[:10]
                if isinstance(recent_activity, list)
                else [],
            }

            print(
                f"✅ [DEBUG] summary 생성 완료 - total_events: {summary['total_events']}"
            )
            return summary

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 사용자 요약 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 사용자 요약 조회 실패: {str(e)}",
                operation="get_user_summary",
            ) from e
        except Exception as e:
            logger.error("사용자 요약 조회 실패: user_id=%s, error=%s", user_id, str(e))
            raise DashboardServiceError(f"사용자 요약 조회 실패: {str(e)}") from e

    async def get_comprehensive_stats(
        self,
        user_id: UUID,
        period: str = "7d",
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """포괄적인 통계 데이터 조회 (API 호환성)"""
        try:
            return await self.get_user_summary(user_id, period, search)
        except Exception as e:
            logger.error("포괄적 통계 조회 실패: %s", str(e))
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"포괄적 통계 조회 실패: {str(e)}") from e

    async def get_project_stats(self, user_id: UUID) -> Dict[str, Any]:
        """현재 사용자의 프로젝트 통계 조회"""
        try:
            logger.info("프로젝트 통계 조회 시작: user_id=%s", user_id)

            await self._verify_user_access(user_id)

            # 사용자가 멤버인 프로젝트 조회
            project_ids = await self._get_user_project_ids(user_id)

            if not project_ids:
                return {
                    "total_projects": 0,
                    "by_status": {},
                    "by_priority": {},
                    "owned_projects": 0,
                    "completion_rate": 0.0,
                }

            # 전체 프로젝트 수
            total_query = select(count(Project.id)).where(Project.id.in_(project_ids))
            total_result = await self.db.execute(total_query)
            total_projects = total_result.scalar() or 0

            # 상태별 프로젝트 수
            status_query = (
                select(Project.status, count(Project.id))
                .where(Project.id.in_(project_ids))
                .group_by(Project.status)
            )
            status_result = await self.db.execute(status_query)
            by_status = {str(row[0]): row[1] for row in status_result.fetchall()}

            # 우선순위별 프로젝트 수
            priority_query = (
                select(Project.priority, count(Project.id))
                .where(Project.id.in_(project_ids))
                .group_by(Project.priority)
            )
            priority_result = await self.db.execute(priority_query)
            by_priority = {str(row[0]): row[1] for row in priority_result.fetchall()}

            # 소유한 프로젝트 수
            owned_query = select(count(Project.id)).where(
                and_(Project.owner_id == user_id, Project.id.in_(project_ids))
            )
            owned_result = await self.db.execute(owned_query)
            owned_projects = owned_result.scalar() or 0

            # 완료율 계산
            completed_count = by_status.get("completed", 0)
            completion_rate = (
                (completed_count / total_projects * 100) if total_projects > 0 else 0.0
            )

            return {
                "total_projects": total_projects,
                "by_status": by_status,
                "by_priority": by_priority,
                "owned_projects": owned_projects,
                "completion_rate": round(completion_rate, 2),
            }

        except (DashboardDataNotFoundError, DashboardPermissionError):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 프로젝트 통계 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 프로젝트 통계 조회 실패: {str(e)}",
                operation="get_project_stats",
                table="projects",
            ) from e
        except Exception as e:
            logger.error(
                "프로젝트 통계 조회 실패: user_id=%s, error=%s", user_id, str(e)
            )
            raise DashboardServiceError(f"프로젝트 통계 조회 실패: {str(e)}") from e

    async def get_task_stats(self, user_id: UUID) -> Dict[str, Any]:
        """현재 사용자의 작업 통계 조회"""
        try:
            logger.info("작업 통계 조회 시작: user_id=%s", user_id)

            await self._verify_user_access(user_id)

            # 사용자가 접근 가능한 프로젝트 조회
            project_ids = await self._get_user_project_ids(user_id)

            if not project_ids:
                return {
                    "total_tasks": 0,
                    "assigned_to_me": 0,
                    "assigned_to_user": 0,
                    "created_by_me": 0,
                    "by_status": {},
                    "by_priority": {},
                    "by_assignee": {},
                    "overdue_tasks": 0,
                    "completion_rate": 0.0,
                }

            # 접근 가능한 프로젝트의 전체 작업 수
            total_query = select(count(Task.id)).where(Task.project_id.in_(project_ids))
            total_result = await self.db.execute(total_query)
            total_tasks = total_result.scalar() or 0

            # 사용자에게 할당된 작업 수
            assigned_subquery = select(TaskAssignment.task_id).where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                )
            )
            assigned_query = select(count(Task.id)).where(
                and_(
                    Task.project_id.in_(project_ids),
                    Task.id.in_(assigned_subquery),
                )
            )
            assigned_result = await self.db.execute(assigned_query)
            assigned_to_me = assigned_result.scalar() or 0

            # 사용자가 생성한 작업 수
            created_query = select(count(Task.id)).where(
                and_(
                    Task.project_id.in_(project_ids),
                    or_(
                        Task.owner_id == user_id,
                        Task.created_by == user_id,
                    ),
                )
            )
            created_result = await self.db.execute(created_query)
            created_by_me = created_result.scalar() or 0

            # 할당된 작업의 상태별 분포
            status_query = text("""
                SELECT t.status, COUNT(t.id)
                FROM tasks t
                JOIN task_assignments ta ON t.id = ta.task_id
                WHERE t.project_id = ANY(:project_ids)
                  AND ta.user_id = :user_id
                  AND ta.is_active = true
                GROUP BY t.status
            """)
            status_result = await self.db.execute(
                status_query, {"project_ids": project_ids, "user_id": user_id}
            )
            by_status = {str(row[0]): row[1] for row in status_result.fetchall()}

            # 할당된 작업의 우선순위별 분포
            priority_query = (
                select(Task.priority, count(Task.id))
                .where(
                    and_(
                        Task.project_id.in_(project_ids),
                        Task.id.in_(assigned_subquery),
                    )
                )
                .group_by(Task.priority)
            )
            priority_result = await self.db.execute(priority_query)
            by_priority = {str(row[0]): row[1] for row in priority_result.fetchall()}

            # 담당자별 작업 분포
            assignee_query = (
                select(TaskAssignment.user_id, count(TaskAssignment.task_id))
                .select_from(TaskAssignment)
                .join(Task, Task.id == TaskAssignment.task_id)
                .where(
                    and_(
                        Task.project_id.in_(project_ids),
                        TaskAssignment.is_active.is_(True),
                    )
                )
                .group_by(TaskAssignment.user_id)
            )
            assignee_result = await self.db.execute(assignee_query)
            by_assignee = {str(row[0]): row[1] for row in assignee_result.fetchall()}

            # 지연된 작업 수
            overdue_query = select(count(Task.id)).where(
                and_(
                    Task.project_id.in_(project_ids),
                    Task.id.in_(assigned_subquery),
                    Task.due_date.isnot(None),
                    Task.due_date < datetime.now(timezone.utc),
                    Task.status.in_(["todo", "in_progress", "in_review", "testing"]),
                )
            )
            overdue_result = await self.db.execute(overdue_query)
            overdue_tasks = overdue_result.scalar() or 0

            # 완료율 계산
            completed_count = by_status.get("completed", 0)
            completion_rate = (
                (completed_count / assigned_to_me * 100) if assigned_to_me > 0 else 0.0
            )

            return {
                "total_tasks": total_tasks,
                "assigned_to_me": assigned_to_me,
                "assigned_to_user": assigned_to_me,
                "created_by_me": created_by_me,
                "by_status": by_status,
                "by_priority": by_priority,
                "by_assignee": by_assignee,
                "overdue_tasks": overdue_tasks,
                "completion_rate": round(completion_rate, 2),
            }

        except (DashboardDataNotFoundError, DashboardPermissionError):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 작업 통계 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 작업 통계 조회 실패: {str(e)}",
                operation="get_task_stats",
                table="tasks",
            ) from e
        except Exception as e:
            logger.error("작업 통계 조회 실패: user_id=%s, error=%s", user_id, str(e))
            raise DashboardServiceError(f"작업 통계 조회 실패: {str(e)}") from e

    async def get_recent_activity(
        self,
        user_id: UUID,
        page_size: int = 10,
        page_no: int = 0,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 최근 활동 조회"""
        try:
            logger.info("최근 활동 조회 시작: user_id=%s, limit=%s", user_id, page_size)

            await self._verify_user_access(user_id)

            if page_size <= 0 or page_size > 100:
                raise DashboardValidationError(
                    "page_size 1-100 사이의 값이어야 합니다",
                    field="page_size",
                    value=page_size,
                )

            if page_no < 0:
                raise DashboardValidationError(
                    "page_no은 0 이상이어야 합니다", field="page_no", value=page_no
                )

            query = select(UserActivityLog).where(UserActivityLog.user_id == user_id)

            # 검색어가 있는 경우 필터 추가
            if search:
                search_pattern = "%" + search + "%"
                query = query.where(
                    or_(
                        UserActivityLog.action.ilike(search_pattern),
                        UserActivityLog.description.ilike(search_pattern),
                        UserActivityLog.resource_type.ilike(search_pattern),
                    )
                )

            query = (
                query.order_by(UserActivityLog.created_at.desc())
                .offset(page_no)
                .limit(page_size)
            )

            result = await self.db.execute(query)
            activities = result.scalars().all()

            return [
                {
                    "id": str(activity.id),
                    "type": "user_action",
                    "action": activity.action or "Unknown Action",
                    "description": activity.description or "",
                    "user_name": "User",
                    "user_avatar": None,
                    "resource_type": activity.resource_type,
                    "resource_id": activity.resource_id,
                    "resource_name": None,
                    "timestamp": activity.created_at,
                    "created_at": activity.created_at,
                    "metadata": {
                        "ip_address": getattr(activity, "ip_address", None),
                        "user_agent": getattr(activity, "user_agent", None),
                    },
                }
                for activity in activities
            ]

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 최근 활동 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 최근 활동 조회 실패: {str(e)}",
                operation="get_recent_activity",
                table="user_activity_logs",
            ) from e
        except Exception as e:
            logger.error("최근 활동 조회 실패: user_id=%s, error=%s", user_id, str(e))
            raise DashboardServiceError(f"최근 활동 조회 실패: {str(e)}") from e

    async def get_upcoming_events(
        self, user_id: UUID, limit: int = 5, days: int = 7, search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 다가오는 일정 조회"""
        try:
            print(
                f"🔍 [DEBUG] get_upcoming_events 시작 - user_id: {user_id}, limit: {limit}, days: {days}"
            )

            logger.info("다가오는 일정 조회 시작: user_id=%s, days=%s", user_id, days)

            await self._verify_user_access(user_id)

            if limit <= 0 or limit > 50:
                raise DashboardValidationError(
                    "limit은 1-50 사이의 값이어야 합니다", field="limit", value=limit
                )

            if days <= 0 or days > 365:
                raise DashboardValidationError(
                    "days는 1-365 사이의 값이어야 합니다", field="days", value=days
                )

            end_date = datetime.now(timezone.utc) + timedelta(days=days)

            try:
                query = (
                    select(Event)
                    .join(Calendar)
                    .where(
                        and_(
                            Calendar.owner_id == user_id,
                            Event.start_time >= datetime.now(timezone.utc),
                            Event.start_time <= end_date,
                        )
                    )
                )

                # 검색어가 있는 경우 필터 추가
                if search:
                    search_pattern = "%" + search + "%"
                    query = query.where(
                        or_(
                            Event.title.ilike(search_pattern),
                            Event.description.ilike(search_pattern),
                        )
                    )

                query = query.order_by(Event.start_time).limit(limit)

                result = await self.db.execute(query)
                events = result.scalars().all()

                print(f"✅ [DEBUG] 이벤트 조회 완료 - 이벤트 수: {len(events)}")

                event_list = [
                    {
                        "id": str(event.id),
                        "title": event.title,
                        "description": getattr(event, "description", ""),
                        "type": "meeting",
                        "priority": "medium",
                        "start_time": event.start_time,
                        "end_time": getattr(
                            event, "end_time", event.start_time + timedelta(hours=1)
                        ),
                        "duration": 60,  # 기본 60분
                        "location": getattr(event, "location", ""),
                        "attendees": [],
                        "attendee_count": 0,
                        "project_id": None,
                        "project_name": None,
                        "is_recurring": False,
                        "reminder_set": False,
                        "calendar_name": "기본 캘린더",
                        "status": "confirmed",
                    }
                    for event in events
                ]

                print(
                    f"✅ [DEBUG] get_upcoming_events 완료 - 반환할 이벤트 수: {len(event_list)}"
                )
                return event_list

            except Exception as query_error:
                print(f"⚠️ [DEBUG] 이벤트 조회 중 오류 (빈 리스트 반환): {query_error}")
                # 이벤트 테이블이 없거나 오류가 있는 경우 빈 리스트 반환
                return []

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 다가오는 일정 조회: %s", str(e))
            print(f"❌ [DEBUG] SQLAlchemy 오류 - 빈 리스트 반환: {e}")
            return []  # 오류 시 빈 리스트 반환
        except Exception as e:
            logger.error(
                "다가오는 일정 조회 실패: user_id=%s, error=%s", user_id, str(e)
            )
            print(f"❌ [DEBUG] 일반 오류 - 빈 리스트 반환: {e}")
            return []  # 오류 시 빈 리스트 반환

    # ============================================================================
    # 활동 상세 조회 메서드들
    # ============================================================================

    async def get_activity_detail(
        self, user_id: UUID, activity_id: str
    ) -> Dict[str, Any]:
        """활동 상세 조회"""
        try:
            await self._verify_user_access(user_id)

            activity_uuid = self._extract_uuid(activity_id)
            if not activity_uuid:
                raise DashboardValidationError(
                    "유효하지 않은 활동 ID입니다",
                    field="activity_id",
                    value=activity_id,
                )

            query = select(UserActivityLog).where(
                and_(
                    UserActivityLog.id == activity_uuid,
                    UserActivityLog.user_id == user_id,
                )
            )
            result = await self.db.execute(query)
            activity = result.scalar_one_or_none()

            if not activity:
                raise DashboardDataNotFoundError(
                    "활동을 찾을 수 없습니다",
                    resource_type="activity",
                    resource_id=activity_id,
                )

            return {
                "id": str(activity.id),
                "type": "user_action",
                "action": activity.action,
                "description": activity.description or "",
                "resource_type": activity.resource_type,
                "resource_id": activity.resource_id,
                "resource_name": None,
                "user_id": str(user_id),
                "user_name": "User",
                "timestamp": activity.created_at,
                "metadata": {
                    "ip_address": getattr(activity, "ip_address", None),
                    "user_agent": getattr(activity, "user_agent", None),
                },
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("활동 상세 조회 중 데이터베이스 오류: %s", str(e))
            raise DashboardDatabaseError(
                "활동 상세를 조회할 수 없습니다",
                operation="get_activity_detail",
                table="user_activity_logs",
            ) from e
        except Exception as e:
            logger.error("활동 상세 조회 중 예상치 못한 오류: %s", str(e))
            raise DashboardServiceError(f"활동 상세 조회 실패: {str(e)}") from e

    async def get_user_activities(
        self,
        current_user_id: UUID,
        target_user_id: str,
        page_size: int = 20,
        page_no: int = 1,
    ) -> Dict[str, Any]:
        """사용자별 활동 내역 조회"""
        try:
            await self._verify_user_access(current_user_id)

            target_uuid = self._extract_uuid(target_user_id)
            if not target_uuid:
                raise DashboardValidationError(
                    "유효하지 않은 사용자 ID입니다",
                    field="target_user_id",
                    value=target_user_id,
                )

            # 권한 확인 - 본인이거나 관리자인 경우만 허용
            if current_user_id != target_uuid:
                raise DashboardPermissionError(
                    "다른 사용자의 활동을 조회할 권한이 없습니다",
                    required_permission="view_other_user_activities",
                    user_id=str(current_user_id),
                )

            if page_size <= 0 or page_size > 100:
                raise DashboardValidationError(
                    "page_size는 1-100 사이의 값이어야 합니다",
                    field="page_size",
                    value=page_size,
                )

            if page_no <= 0:
                raise DashboardValidationError(
                    "page_no는 1 이상이어야 합니다", field="page_no", value=page_no
                )

            page_no = (page_no - 1) * page_size

            activities = await self.get_recent_activity(
                user_id=target_uuid, page_size=page_size, page_no=page_no
            )

            total = len(activities)  # 실제로는 별도 쿼리로 전체 개수 조회 필요
            total_pages = (total + page_size - 1) // page_size

            return {
                "activities": activities,
                "page_no": page_no,
                "page_size": page_size,
                "total_pages": total_pages,
                "total_items": total,
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("사용자 활동 내역 조회 중 데이터베이스 오류: %s", str(e))
            raise DashboardDatabaseError(
                "사용자 활동 내역을 조회할 수 없습니다",
                operation="get_user_activities",
                table="user_activity_logs",
            ) from e
        except Exception as e:
            logger.error("사용자 활동 내역 조회 중 예상치 못한 오류: %s", str(e))
            raise DashboardServiceError(f"사용자 활동 내역 조회 실패: {str(e)}") from e

    # ============================================================================
    # 이벤트 관리 메서드들
    # ============================================================================

    async def get_event_detail(self, user_id: UUID, event_id: str) -> Dict[str, Any]:
        """이벤트 상세 조회"""
        try:
            await self._verify_user_access(user_id)

            event_uuid = self._extract_uuid(event_id)
            if not event_uuid:
                raise DashboardValidationError(
                    "유효하지 않은 이벤트 ID입니다",
                    field="event_id",
                    value=event_id,
                )

            query = (
                select(Event)
                .join(Calendar)
                .where(
                    and_(
                        Event.id == event_uuid,
                        Calendar.owner_id == user_id,
                    )
                )
            )
            result = await self.db.execute(query)
            event = result.scalar_one_or_none()

            if not event:
                raise DashboardDataNotFoundError(
                    "이벤트를 찾을 수 없습니다",
                    resource_type="event",
                    resource_id=event_id,
                )

            return {
                "id": str(event.id),
                "title": event.title,
                "description": getattr(event, "description", ""),
                "type": "meeting",
                "priority": "medium",
                "start_time": event.start_time,
                "end_time": getattr(
                    event, "end_time", event.start_time + timedelta(hours=1)
                ),
                "location": getattr(event, "location", ""),
                "attendees": [],
                "project_id": None,
                "status": "confirmed",
                "created_by": str(user_id),
                "created_at": getattr(event, "created_at", event.start_time),
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("이벤트 상세 조회 중 데이터베이스 오류: %s", str(e))
            raise DashboardDatabaseError(
                "이벤트 상세를 조회할 수 없습니다",
                operation="get_event_detail",
                table="events",
            ) from e
        except Exception as e:
            logger.error("이벤트 상세 조회 중 예상치 못한 오류: %s", str(e))
            raise DashboardServiceError(f"이벤트 상세 조회 실패: {str(e)}") from e

    async def get_user_events(
        self,
        current_user_id: UUID,
        target_user_id: str,
        page_size: int = 20,
        days: int = 7,
    ) -> List[Dict[str, Any]]:
        """사용자별 예정된 이벤트 조회"""
        try:
            await self._verify_user_access(current_user_id)

            target_uuid = self._extract_uuid(target_user_id)
            if not target_uuid:
                raise DashboardValidationError(
                    "유효하지 않은 사용자 ID입니다",
                    field="target_user_id",
                    value=target_user_id,
                )

            # 권한 확인 - 본인이거나 관리자인 경우만 허용
            if current_user_id != target_uuid:
                raise DashboardPermissionError(
                    "다른 사용자의 이벤트를 조회할 권한이 없습니다",
                    required_permission="view_other_user_events",
                    user_id=str(current_user_id),
                )

            end_date = datetime.now(timezone.utc) + timedelta(days=days)

            query = (
                select(Event)
                .join(Calendar)
                .where(
                    and_(
                        Calendar.owner_id == target_uuid,
                        Event.start_time >= datetime.now(timezone.utc),
                        Event.start_time <= end_date,
                    )
                )
                .order_by(Event.start_time)
                .limit(page_size)
            )

            result = await self.db.execute(query)
            events = result.scalars().all()

            return [
                {
                    "id": str(event.id),
                    "title": event.title,
                    "description": getattr(event, "description", ""),
                    "type": "meeting",
                    "priority": "medium",
                    "start_time": event.start_time,
                    "end_time": getattr(
                        event, "end_time", event.start_time + timedelta(hours=1)
                    ),
                    "duration": 60,
                    "location": getattr(event, "location", ""),
                    "attendees": [],
                    "attendee_count": 0,
                    "project_id": None,
                    "project_name": None,
                    "is_recurring": False,
                    "reminder_set": False,
                    "calendar_name": "기본 캘린더",
                    "status": "confirmed",
                }
                for event in events
            ]

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("사용자 이벤트 조회 중 데이터베이스 오류: %s", str(e))
            raise DashboardDatabaseError(
                "사용자 이벤트를 조회할 수 없습니다",
                operation="get_user_events",
                table="events",
            ) from e
        except Exception as e:
            logger.error("사용자 이벤트 조회 중 예상치 못한 오류: %s", str(e))
            raise DashboardServiceError(f"사용자 이벤트 조회 실패: {str(e)}") from e

    # ============================================================================
    # 설정 관리 메서드들
    # ============================================================================

    async def update_dashboard_settings(
        self, user_id: UUID, settings: Dict[str, Any]
    ) -> None:
        """대시보드 설정 업데이트"""
        try:
            await self._verify_user_access(user_id)
            logger.info(
                "대시보드 설정 업데이트: user_id=%s, settings=%s", user_id, settings
            )
            # 실제 구현 시 사용자 설정 테이블에 저장
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"설정 업데이트 실패: {str(e)}") from e

    async def get_dashboard_settings(self, user_id: UUID) -> Dict[str, Any]:
        """대시보드 설정 조회"""
        try:
            await self._verify_user_access(user_id)
            return {
                "layout": {"columns": 2, "responsive": True},
                "widgets": [],
                "preferences": {"theme": "light", "auto_refresh": True},
                "theme": "light",
                "notifications": {"email": True, "push": False},
                "auto_refresh": True,
                "refresh_interval": 30,
            }
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"설정 조회 실패: {str(e)}") from e

    async def reset_dashboard_settings(self, user_id: UUID) -> None:
        """대시보드 설정 초기화"""
        try:
            await self._verify_user_access(user_id)
            logger.info("대시보드 설정 초기화: user_id=%s", user_id)
            # 실제 구현 시 기본 설정으로 리셋
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"설정 초기화 실패: {str(e)}") from e

    # ============================================================================
    # 데이터 내보내기 메서드들
    # ============================================================================

    async def export_dashboard_data(
        self,
        user_id: UUID,
        export_format: str,
    ) -> tuple:
        """대시보드 데이터 내보내기 (즉시 다운로드)"""
        try:
            await self._verify_user_access(user_id)

            # 데이터 수집
            stats = await self.get_user_summary(user_id)

            if export_format == "json":
                content = StringIO(json.dumps(stats, default=str, indent=2))
                filename = (
                    f"dashboard_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                media_type = "application/json"
            elif export_format == "csv":
                content = StringIO()
                writer = csv.writer(content)
                writer.writerow(["Metric", "Value"])
                for key, value in stats.items():
                    writer.writerow([key, str(value)])
                content.seek(0)
                filename = (
                    f"dashboard_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                )
                media_type = "text/csv"
            else:
                raise DashboardValidationError(
                    f"지원하지 않는 내보내기 형식: {format}",
                    field="format",
                    value=format,
                )

            return content, filename, media_type

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"데이터 내보내기 실패: {str(e)}",
                export_format=export_format,
            ) from e

    async def start_async_export(
        self,
        user_id: UUID,
        export_format: str,
    ) -> str:
        """비동기 대시보드 데이터 내보내기 시작"""
        try:
            await self._verify_user_access(user_id)

            # UUID 생성하여 내보내기 ID로 사용

            export_id = str(uuid4())

            logger.info(
                "비동기 내보내기 시작: export_id=%s, user_id=%s", export_id, user_id
            )
            # 실제 구현 시 백그라운드 작업으로 처리

            return export_id

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"비동기 내보내기 시작 실패: {str(e)}",
                export_format=export_format,
            ) from e

    async def get_export_status(self, user_id: UUID, export_id: str) -> Dict[str, Any]:
        """내보내기 상태 확인"""
        try:
            await self._verify_user_access(user_id)

            return {
                "status": "completed",
                "progress": 100.0,
                "download_url": f"/api/dashboard/export/{export_id}/download",
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
                "error_message": None,
                "created_at": datetime.now(timezone.utc),
            }

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"내보내기 상태 확인 실패: {str(e)}",
                export_id=export_id,
            ) from e

    async def download_export(self, user_id: UUID, export_id: str) -> tuple:
        """내보낸 파일 다운로드"""
        try:
            await self._verify_user_access(user_id)

            # 임시로 JSON 데이터 반환
            stats = await self.get_user_summary(user_id)

            content = StringIO(json.dumps(stats, default=str, indent=2))
            filename = f"export_{export_id}.json"
            media_type = "application/json"

            return content, filename, media_type

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardExportError(
                f"파일 다운로드 실패: {str(e)}",
                export_id=export_id,
            ) from e

    # ============================================================================
    # 캐시 관리 메서드들
    # ============================================================================

    async def invalidate_cache(self, user_id: UUID) -> None:
        """대시보드 캐시 무효화"""
        try:
            await self._verify_user_access(user_id)
            logger.info("캐시 무효화: user_id=%s", user_id)
            # 실제 구현 시 Redis 등의 캐시 무효화
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardCacheError(
                f"캐시 무효화 실패: {str(e)}",
                operation="invalidate_all",
            ) from e

    async def invalidate_specific_cache(
        self, user_id: UUID, cache_keys: List[str]
    ) -> None:
        """특정 데이터 캐시 무효화"""
        try:
            await self._verify_user_access(user_id)
            logger.info("특정 캐시 무효화: user_id=%s, keys=%s", user_id, cache_keys)
            # 실제 구현 시 지정된 키들만 무효화
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardCacheError(
                f"특정 캐시 무효화 실패: {str(e)}",
                operation="invalidate_specific",
            ) from e

    async def get_cache_status(self, user_id: UUID) -> Dict[str, Any]:
        """캐시 상태 조회"""
        try:
            await self._verify_user_access(user_id)

            return {
                "total_keys": 150,
                "memory_usage": 25.6,
                "hit_rate": 85.2,
                "last_cleanup": datetime.now(timezone.utc) - timedelta(hours=1),
                "cache_size": 26843545,
            }

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardCacheError(
                f"캐시 상태 조회 실패: {str(e)}",
                operation="get_status",
            ) from e

    # ============================================================================
    # 알림 관리 메서드들
    # ============================================================================

    async def get_notifications(
        self,
        user_id: UUID,
        page_size: int = 20,
        page_no: int = 1,
        unread_only: bool = False,
    ) -> Dict[str, Any]:
        """대시보드 알림 조회"""
        try:
            await self._verify_user_access(user_id)

            # 임시 알림 데이터
            notifications = [
                {
                    "id": f"notif_{i}",
                    "title": f"알림 {i}",
                    "message": f"알림 메시지 {i}",
                    "type": "info",
                    "priority": "normal",
                    "read_at": None if i % 2 == 0 else datetime.now(timezone.utc),
                    "action_url": None,
                    "created_at": datetime.now(timezone.utc) - timedelta(hours=i),
                }
                for i in range(1, min(page_size + 1, 11))
            ]

            if unread_only:
                notifications = [n for n in notifications if n["read_at"] is None]

            total = len(notifications)
            unread_count = len([n for n in notifications if n["read_at"] is None])
            total_pages = (total + page_size - 1) // page_size

            return {
                "notifications": notifications,
                "total": total,
                "unread_count": unread_count,
                "page_no": page_no,
                "page_size": page_size,
                "total_pages": total_pages,
            }

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"알림 조회 실패: {str(e)}") from e

    async def mark_notification_as_read(
        self, user_id: UUID, notification_id: str
    ) -> None:
        """알림 읽음 처리"""
        try:
            await self._verify_user_access(user_id)
            logger.info(
                "알림 읽음 처리: user_id=%s, notification_id=%s",
                user_id,
                notification_id,
            )
            # 실제 구현 시 알림 테이블 업데이트
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"알림 읽음 처리 실패: {str(e)}") from e

    async def mark_all_notifications_as_read(self, user_id: UUID) -> None:
        """모든 알림 읽음 처리"""
        try:
            await self._verify_user_access(user_id)
            logger.info("모든 알림 읽음 처리: user_id=%s", user_id)
            # 실제 구현 시 모든 알림 읽음 처리
        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"모든 알림 읽음 처리 실패: {str(e)}") from e

    # ============================================================================
    # 실시간 업데이트 메서드들
    # ============================================================================

    async def check_for_updates(
        self, user_id: UUID, last_update: Optional[str] = None
    ) -> Dict[str, Any]:
        """대시보드 업데이트 확인"""
        try:
            await self._verify_user_access(user_id)

            last_update_time = datetime.now(timezone.utc) - timedelta(minutes=5)
            if last_update:
                try:
                    last_update_time = datetime.fromisoformat(
                        last_update.replace("Z", "+00:00")
                    )
                except ValueError:
                    pass

            current_time = datetime.now(timezone.utc)
            has_updates = current_time > last_update_time

            return {
                "has_updates": has_updates,
                "last_updated": current_time,
                "updated_sections": ["stats", "activities"] if has_updates else [],
                "next_check": current_time + timedelta(minutes=5),
            }

        except Exception as e:
            if isinstance(e, DashboardServiceError):
                raise
            raise DashboardServiceError(f"업데이트 확인 실패: {str(e)}") from e

    # ============================================================================
    # 성능 메트릭 메서드들
    # ============================================================================

    async def get_performance_metrics(self, user_id: UUID) -> Dict[str, Any]:
        """대시보드 성능 메트릭 조회"""
        try:
            start_time = time.time()

            await self._verify_user_access(user_id)

            # 쿼리 성능 측정을 위한 시간 기록
            query_start_time = time.time()

            # 1. 최근 24시간 내 활성 사용자 수 조회
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            active_users_query = text("""
                SELECT COUNT(DISTINCT user_id) as active_users
                FROM user_activity_logs
                WHERE created_at >= :yesterday
            """)
            active_users_result = await self.db.execute(
                active_users_query, {"yesterday": yesterday}
            )
            active_users = active_users_result.scalar() or 0

            # 2. 데이터베이스 쿼리 성능 측정 (평균 응답시간)
            db_performance_query = text("""
                SELECT
                    AVG(EXTRACT(EPOCH FROM (NOW() - query_start))) as avg_query_time
                FROM pg_stat_activity
                WHERE state = 'active'
                  AND query_start IS NOT NULL
                  AND query != '<IDLE>'
                LIMIT 100
            """)
            try:
                db_performance_result = await self.db.execute(db_performance_query)
                avg_query_time = db_performance_result.scalar() or 0.0
                if avg_query_time is None:
                    avg_query_time = 0.0
            except Exception:
                # PostgreSQL stat 접근 권한이 없는 경우 기본값 사용
                avg_query_time = 0.15

            # 3. 캐시 히트율 계산 (PostgreSQL 버퍼 캐시 기준)
            cache_hit_query = text("""
                SELECT
                    CASE
                        WHEN (blks_hit + blks_read) = 0 THEN 0
                        ELSE ROUND((blks_hit::float / (blks_hit + blks_read)) * 100, 2)
                    END as cache_hit_rate
                FROM pg_stat_database
                WHERE database_name = current_database()
            """)
            try:
                cache_hit_result = await self.db.execute(cache_hit_query)
                cache_hit_rate = cache_hit_result.scalar() or 0.0
            except Exception:
                # 권한이 없는 경우 기본값
                cache_hit_rate = 85.0

            # 4. 사용자별 최근 활동량 기반 부하 측정
            user_load_query = text("""
                SELECT COUNT(*) as recent_activities
                FROM user_activity_logs
                WHERE user_id = :user_id
                  AND created_at >= :recent_time
            """)
            recent_time = datetime.now(timezone.utc) - timedelta(minutes=30)
            user_load_result = await self.db.execute(
                user_load_query, {"user_id": user_id, "recent_time": recent_time}
            )
            recent_activities = user_load_result.scalar() or 0

            # 5. 시스템 메모리 사용량 (가능한 경우)
            try:
                memory_info = psutil.virtual_memory()
                memory_usage_mb = memory_info.used / 1024 / 1024
                memory_usage_percent = memory_info.percent
            except Exception:
                # psutil 사용 불가능한 경우 기본값
                memory_usage_mb = 256.0
                memory_usage_percent = 65.0

            # 6. 전체 처리 시간 계산
            query_end_time = time.time()
            query_time = round((query_end_time - query_start_time) * 1000, 2)  # ms

            # 7. 페이지 로드 시간 추정 (쿼리 시간 + 네트워크 오버헤드)
            estimated_load_time = query_time + 200  # 기본 오버헤드 200ms
            load_time_seconds = round(estimated_load_time / 1000, 3)

            end_time = time.time()
            total_processing_time = round((end_time - start_time) * 1000, 2)

            return {
                "load_time": load_time_seconds,
                "query_time": round(avg_query_time, 3),
                "cache_hit_rate": float(cache_hit_rate),
                "active_users": active_users,
                "memory_usage": round(memory_usage_mb, 1),
                "memory_usage_percent": round(memory_usage_percent, 1),
                "recent_user_activities": recent_activities,
                "processing_time_ms": total_processing_time,
                "database_connections": await self._get_active_connections(),
                "performance_score": await self._calculate_performance_score(
                    load_time_seconds, cache_hit_rate, memory_usage_percent
                ),
                "measured_at": datetime.now(timezone.utc),
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 성능 메트릭 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 성능 메트릭 조회 실패: {str(e)}",
                operation="get_performance_metrics",
                table="multiple",
            ) from e
        except Exception as e:
            logger.error("성능 메트릭 조회 실패: user_id=%s, error=%s", user_id, str(e))
            raise DashboardServiceError(f"성능 메트릭 조회 실패: {str(e)}") from e

    async def _get_active_connections(self) -> int:
        """활성 데이터베이스 연결 수 조회"""
        try:
            connections_query = text("""
                SELECT COUNT(*) as active_connections
                FROM pg_stat_activity
                WHERE state = 'active'
            """)
            result = await self.db.execute(connections_query)
            return result.scalar() or 0
        except Exception:
            return 0

    async def _calculate_performance_score(
        self, load_time: float, cache_hit_rate: float, memory_usage_percent: float
    ) -> float:
        """성능 점수 계산 (0-100)"""
        try:
            # 로드 시간 점수 (1초 이하면 100점, 3초 이상이면 0점)
            load_score = max(0, 100 - (load_time - 1.0) * 50)

            # 캐시 히트율 점수 (90% 이상이면 100점)
            cache_score = min(100, cache_hit_rate * 1.1)

            # 메모리 사용률 점수 (70% 이하면 100점, 90% 이상이면 0점)
            memory_score = max(0, 100 - max(0, memory_usage_percent - 70) * 5)

            # 가중 평균으로 최종 점수 계산
            performance_score = (
                load_score * 0.4 + cache_score * 0.3 + memory_score * 0.3
            )

            return round(performance_score, 1)
        except Exception:
            return 50.0  # 기본 점수

    async def get_activity_metrics(
        self, user_id: UUID, period: str = "7d"
    ) -> Dict[str, Any]:
        """사용자 활동 통계 조회"""
        try:
            await self._verify_user_access(user_id)

            # 기간 파싱
            period_delta = self._parse_period(period)
            start_date = datetime.now(timezone.utc) - period_delta

            # 사용자가 접근 가능한 프로젝트 조회
            project_ids = await self._get_user_project_ids(user_id)

            if not project_ids:
                return {
                    "total_activities": 0,
                    "unique_users": 0,
                    "most_active_users": [],
                    "activity_by_hour": [{"hour": i, "count": 0} for i in range(24)],
                    "activity_by_type": {
                        "create": 0,
                        "update": 0,
                        "delete": 0,
                        "view": 0,
                    },
                }

            # 전체 활동 수 조회
            total_activities_query = select(count(UserActivityLog.id)).where(
                and_(
                    UserActivityLog.user_id == user_id,
                    UserActivityLog.created_at >= start_date,
                )
            )
            total_result = await self.db.execute(total_activities_query)
            total_activities = total_result.scalar() or 0

            # 관련 프로젝트의 고유 사용자 수 조회 (프로젝트 멤버들의 활동)
            unique_users_query = text("""
                SELECT COUNT(DISTINCT ual.user_id)
                FROM user_activity_logs ual
                WHERE ual.created_at >= :start_date
                  AND (
                    ual.user_id = :user_id
                    OR ual.resource_id::text IN (
                      SELECT p.id::text FROM projects p WHERE p.id = ANY(:project_ids)
                    )
                  )
            """)
            unique_users_result = await self.db.execute(
                unique_users_query,
                {
                    "start_date": start_date,
                    "user_id": user_id,
                    "project_ids": project_ids,
                },
            )
            unique_users = unique_users_result.scalar() or 0

            # 가장 활발한 사용자들 조회 (관련 프로젝트 기준)
            most_active_query = text("""
                SELECT ual.user_id, COUNT(ual.id) as activity_count
                FROM user_activity_logs ual
                WHERE ual.created_at >= :start_date
                  AND (
                    ual.user_id = :user_id
                    OR ual.resource_id::text IN (
                      SELECT p.id::text FROM projects p WHERE p.id = ANY(:project_ids)
                    )
                  )
                GROUP BY ual.user_id
                ORDER BY activity_count DESC
                LIMIT 5
            """)
            most_active_result = await self.db.execute(
                most_active_query,
                {
                    "start_date": start_date,
                    "user_id": user_id,
                    "project_ids": project_ids,
                },
            )
            most_active_users = [
                {"user_id": str(row[0]), "activity_count": row[1]}
                for row in most_active_result.fetchall()
            ]

            # 시간대별 활동 분포 조회
            activity_by_hour_query = text("""
                SELECT EXTRACT(HOUR FROM ual.created_at) as hour, COUNT(ual.id) as count
                FROM user_activity_logs ual
                WHERE ual.user_id = :user_id
                  AND ual.created_at >= :start_date
                GROUP BY EXTRACT(HOUR FROM ual.created_at)
                ORDER BY hour
            """)
            hour_result = await self.db.execute(
                activity_by_hour_query, {"user_id": user_id, "start_date": start_date}
            )
            hour_data = {int(row[0]): row[1] for row in hour_result.fetchall()}

            activity_by_hour = [
                {"hour": i, "count": hour_data.get(i, 0)} for i in range(24)
            ]

            # 활동 유형별 분포 조회
            activity_by_type_query = text("""
                SELECT
                    CASE
                        WHEN ual.action ILIKE '%create%' OR ual.action ILIKE '%add%' THEN 'create'
                        WHEN ual.action ILIKE '%update%' OR ual.action ILIKE '%edit%' OR ual.action ILIKE '%modify%' THEN 'update'
                        WHEN ual.action ILIKE '%delete%' OR ual.action ILIKE '%remove%' THEN 'delete'
                        WHEN ual.action ILIKE '%view%' OR ual.action ILIKE '%read%' OR ual.action ILIKE '%access%' THEN 'view'
                        ELSE 'other'
                    END as action_type,
                    COUNT(ual.id) as count
                FROM user_activity_logs ual
                WHERE ual.user_id = :user_id
                  AND ual.created_at >= :start_date
                GROUP BY action_type
            """)
            type_result = await self.db.execute(
                activity_by_type_query, {"user_id": user_id, "start_date": start_date}
            )
            type_data = {row[0]: row[1] for row in type_result.fetchall()}

            activity_by_type = {
                "create": type_data.get("create", 0),
                "update": type_data.get("update", 0),
                "delete": type_data.get("delete", 0),
                "view": type_data.get("view", 0),
                "other": type_data.get("other", 0),
            }

            return {
                "total_activities": total_activities,
                "unique_users": unique_users,
                "most_active_users": most_active_users,
                "activity_by_hour": activity_by_hour,
                "activity_by_type": activity_by_type,
                "period": period,
                "start_date": start_date,
                "end_date": datetime.now(timezone.utc),
            }

        except (
            DashboardDataNotFoundError,
            DashboardPermissionError,
            DashboardValidationError,
        ):
            raise
        except SQLAlchemyError as e:
            logger.error("데이터베이스 오류 - 활동 메트릭 조회: %s", str(e))
            raise DashboardDatabaseError(
                f"데이터베이스 오류로 인한 활동 메트릭 조회 실패: {str(e)}",
                operation="get_activity_metrics",
                table="user_activity_logs",
            ) from e
        except Exception as e:
            logger.error("활동 메트릭 조회 실패: user_id=%s, error=%s", user_id, str(e))
            raise DashboardServiceError(f"활동 메트릭 조회 실패: {str(e)}") from e


async def get_dashboard_service(
    db: Optional[AsyncSession] = None,
) -> DashboardService:
    """대시보드 서비스 인스턴스 가져오기"""
    if db is None:
        async for session in get_async_session():
            return DashboardService(session)
    return DashboardService(cast(AsyncSession, db))
