"""
대시보드 서비스

대시보드 분석 및 요약을 위한 비즈니스 로직
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, cast
from uuid import UUID

from sqlalchemy import and_, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count

from core.database import get_async_session
from models.calendar import Calendar, Event
from models.project import Project, ProjectMember
from models.task import Task, TaskAssignment
from models.user import UserActivityLog


class DashboardService:
    """대시보드 분석 및 요약 데이터를 위한 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

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

    def _parse_period(self, period: str) -> timedelta:
        """기간 문자열을 timedelta로 변환"""
        period_map = {
            "1d": timedelta(days=1),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "90d": timedelta(days=90),
        }
        return period_map.get(period, timedelta(days=7))

    async def get_user_summary(
        self,
        user_id: UUID,
        period: str = "7d",
        data_type: str = "all",
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """현재 사용자의 종합 대시보드 요약 조회"""
        try:
            project_stats = await self.get_project_stats(user_id, period)
            task_stats = await self.get_task_stats(user_id, period)
            recent_activity = await self.get_recent_activity(user_id, search=search)
            upcoming_events = await self.get_upcoming_events(user_id, search=search)

            # DashboardStatsResponse 형식에 맞춰 응답 구성
            summary = {
                # 프로젝트 통계
                "projects": {
                    "total_projects": project_stats.get("total_projects", 0),
                    "by_status": project_stats.get("by_status", {}),
                    "by_priority": project_stats.get("by_priority", {}),
                },
                # 작업 통계
                "tasks": {
                    "total_tasks": task_stats.get("total_tasks", 0),
                    "by_status": task_stats.get("by_status", {}),
                    "by_priority": task_stats.get("by_priority", {}),
                    "assigned_to_user": task_stats.get("assigned_to_me", 0),
                    "overdue_tasks": task_stats.get("overdue_tasks", 0),
                },
                # 활동 및 이벤트
                "recent_activity": recent_activity[:10],  # 최대 10개로 제한
                "upcoming_events": upcoming_events[:5],  # 최대 5개로 제한
                # 메타데이터
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "period": period,
            }

            return summary

        except Exception as e:
            raise Exception(f"사용자 요약 조회 실패: {str(e)}") from e

    async def get_project_stats(
        self, user_id: UUID, period: str = "30d"
    ) -> Dict[str, Any]:
        """현재 사용자의 프로젝트 통계 조회"""
        try:
            # 사용자가 멤버인 프로젝트 조회
            member_query = select(ProjectMember.project_id).where(
                and_(
                    ProjectMember.user_id == user_id,
                    ProjectMember.is_active.is_(True),
                )
            )
            member_result = await self.db.execute(member_query)
            project_ids = [row[0] for row in member_result.fetchall()]

            if not project_ids:
                return {
                    "total_projects": 0,
                    "by_status": {},
                    "by_priority": {},
                    "owned_projects": 0,
                    "completion_rate": 0.0,
                    "recent_projects": [],
                    "overdue_projects": [],
                    "upcoming_deadlines": [],
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
                and_(Project.creator_id == user_id, Project.id.in_(project_ids))
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
                "recent_projects": [],
                "overdue_projects": [],
                "upcoming_deadlines": [],
            }

        except Exception as e:
            raise Exception(f"프로젝트 통계 조회 실패: {str(e)}") from e

    async def get_task_stats(
        self, user_id: UUID, period: str = "30d"
    ) -> Dict[str, Any]:
        """현재 사용자의 작업 통계 조회"""
        try:
            # 사용자가 접근 가능한 프로젝트 조회
            member_query = select(ProjectMember.project_id).where(
                and_(
                    ProjectMember.user_id == user_id,
                    ProjectMember.is_active.is_(True),
                )
            )
            member_result = await self.db.execute(member_query)
            project_ids = [row[0] for row in member_result.fetchall()]

            if not project_ids:
                return {
                    "total_tasks": 0,
                    "assigned_to_me": 0,
                    "assigned_to_user": 0,  # 프론트엔드 호환성
                    "created_by_me": 0,
                    "by_status": {},
                    "by_priority": {},
                    "by_assignee": {},
                    "overdue_tasks": 0,
                    "completion_rate": 0.0,
                    "completion_trend": [],
                    "high_priority_tasks": [],
                }

            # 접근 가능한 프로젝트의 전체 작업 수
            total_query = select(count(Task.id)).where(Task.project_id.in_(project_ids))
            total_result = await self.db.execute(total_query)
            total_tasks = total_result.scalar() or 0

            # 사용자에게 할당된 작업 수 - 서브쿼리 방식으로 변경
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

            # 사용자가 생성한 작업 수 - owner_id 또는 created_by 필드 확인 필요
            created_query = select(count(Task.id)).where(
                and_(
                    Task.project_id.in_(project_ids),
                    or_(
                        Task.owner_id == user_id,  # owner_id 사용
                        Task.created_by == user_id,  # created_by도 확인
                    ),
                )
            )
            created_result = await self.db.execute(created_query)
            created_by_me = created_result.scalar() or 0

            # 할당된 작업의 상태별 분포 - 서브쿼리 방식으로 변경
            status_query = """
                SELECT t.status, COUNT(t.id) as count
                FROM tasks t
                WHERE t.project_id = ANY(:project_ids)
                AND t.id IN (
                    SELECT ta.task_id
                    FROM task_assignments ta
                    WHERE ta.user_id = :user_id
                    AND ta.is_active = true
                )
                GROUP BY t.status
            """
            status_result = await self.db.execute(
                text(status_query),
                {"project_ids": project_ids, "user_id": str(user_id)},
            )
            by_status = {str(row[0]): row[1] for row in status_result.fetchall()}

            # 할당된 작업의 우선순위별 분포 - 서브쿼리 방식으로 변경
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

            # 담당자별 작업 분포 (팀 전체) - 서브쿼리 방식으로 변경
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

            # 지연된 작업 수 - 서브쿼리 방식으로 변경
            overdue_query = select(count(Task.id)).where(
                and_(
                    Task.project_id.in_(project_ids),
                    Task.id.in_(assigned_subquery),
                    Task.due_date.isnot(None),  # NULL 체크 추가
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
                "assigned_to_user": assigned_to_me,  # 프론트엔드 호환성
                "created_by_me": created_by_me,
                "by_status": by_status,
                "by_priority": by_priority,
                "by_assignee": by_assignee,
                "overdue_tasks": overdue_tasks,
                "completion_rate": round(completion_rate, 2),
                "completion_trend": [],
                "high_priority_tasks": [],
            }

        except Exception as e:
            raise Exception(f"작업 통계 조회 실패: {str(e)}") from e

    async def get_recent_activity(
        self,
        user_id: UUID,
        limit: int = 10,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 최근 활동 조회"""
        try:
            query = select(UserActivityLog).where(UserActivityLog.user_id == user_id)

            # 검색어가 있는 경우 필터 추가
            if search:
                search_pattern = f"%{search}%"
                query = query.where(
                    or_(
                        UserActivityLog.action.ilike(search_pattern),
                        UserActivityLog.description.ilike(search_pattern),
                        UserActivityLog.resource_type.ilike(search_pattern),
                    )
                )

            query = (
                query.order_by(UserActivityLog.created_at.desc())
                .offset(offset)
                .limit(limit)
            )

            result = await self.db.execute(query)
            activities = result.scalars().all()

            return [
                {
                    "id": str(activity.id),
                    "action": activity.action or "Unknown Action",
                    "description": activity.description or "",
                    "user_name": "User",  # TODO: 실제 사용자 이름 조회
                    "resource_type": activity.resource_type,
                    "resource_id": activity.resource_id,
                    "created_at": activity.created_at.isoformat(),
                    "ip_address": getattr(activity, "ip_address", None),
                    "user_agent": getattr(activity, "user_agent", None),
                }
                for activity in activities
            ]

        except Exception as e:
            raise Exception(f"최근 활동 조회 실패: {str(e)}") from e

    async def get_upcoming_events(
        self, user_id: UUID, limit: int = 5, days: int = 7, search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 다가오는 일정 조회"""
        try:
            end_date = datetime.now(timezone.utc) + timedelta(days=days)

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
                search_pattern = f"%{search}%"
                query = query.where(
                    or_(
                        Event.title.ilike(search_pattern),
                        Event.description.ilike(search_pattern),
                    )
                )

            query = query.order_by(Event.start_time).limit(limit)

            result = await self.db.execute(query)
            events = result.scalars().all()

            return [
                {
                    "id": str(event.id),
                    "title": event.title,
                    "description": getattr(event, "description", ""),
                    "start_time": event.start_time.isoformat(),
                    "end_time": getattr(
                        event, "end_time", event.start_time + timedelta(hours=1)
                    ).isoformat(),
                    "calendar_name": "기본 캘린더",  # TODO: 실제 캘린더 이름 조회
                    "type": "meeting",
                    "status": "confirmed",
                    "location": getattr(event, "location", ""),
                    "attendee_count": 0,
                    "created_at": getattr(
                        event, "created_at", datetime.now(timezone.utc)
                    ).isoformat(),
                }
                for event in events
            ]

        except Exception as e:
            raise Exception(f"다가오는 일정 조회 실패: {str(e)}") from e

    # ============================================================================
    # 대시보드 개요 및 워크로드 관련 메서드
    # ============================================================================

    async def get_dashboard_overview(
        self, user_id: UUID, period: str = "7d", include_charts: bool = True
    ) -> Dict[str, Any]:
        """대시보드 전체 개요 정보 조회"""
        try:
            user_summary = await self.get_user_summary(user_id, period)
            workload_summary = await self.get_workload_summary(user_id)

            overview = {
                "summary": user_summary,
                "workload": workload_summary,
                "quick_actions": await self.get_quick_actions(user_id),
                "performance_metrics": await self.get_performance_metrics(user_id),
                "team_overview": await self.get_team_overview(user_id),
                "period": period,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }

            if include_charts:
                overview["charts"] = {
                    "task_completion_trend": [],
                    "project_status_distribution": user_summary.get("projects", {}).get(
                        "by_status", {}
                    ),
                    "workload_trend": [],
                }

            return overview

        except Exception as e:
            raise Exception(f"대시보드 개요 조회 실패: {str(e)}") from e

    async def get_workload_summary(self, user_id: UUID) -> Dict[str, Any]:
        """사용자 워크로드 요약 조회"""
        try:
            task_stats = await self.get_task_stats(user_id)

            in_progress_tasks = task_stats.get("by_status", {}).get("in_progress", 0)
            total_assigned = task_stats.get("assigned_to_me", 0)

            workload_level = self._calculate_workload_level(in_progress_tasks)

            return {
                "assigned_tasks": total_assigned,
                "completed_tasks": task_stats.get("by_status", {}).get("completed", 0),
                "overdue_tasks": task_stats.get("overdue_tasks", 0),
                "hours_logged": 0.0,  # TODO: 시간 추적 기능 구현 후 업데이트
                "projects_involved": 0,  # TODO: 참여 프로젝트 수 계산
                "avg_completion_time": 0.0,  # TODO: 평균 완료 시간 계산
                "productivity_score": await self._calculate_productivity_score(user_id),
                "workload_level": workload_level,
                "efficiency_score": 75.0,  # TODO: 효율성 점수 계산
                "stress_level": "normal",  # TODO: 스트레스 레벨 계산
                "work_life_balance": 80.0,  # TODO: 워라밸 점수 계산
            }

        except Exception as e:
            raise Exception(f"워크로드 요약 조회 실패: {str(e)}") from e

    async def get_quick_actions(self, user_id: UUID) -> List[Dict[str, Any]]:
        """빠른 작업 목록 조회"""
        return [
            {
                "id": "create_project",
                "title": "새 프로젝트 생성",
                "description": "새로운 프로젝트를 생성합니다",
                "icon": "plus",
                "url": "/projects/new",
                "category": "project",
            },
            {
                "id": "create_task",
                "title": "새 작업 생성",
                "description": "새로운 작업을 생성합니다",
                "icon": "task",
                "url": "/tasks/new",
                "category": "task",
            },
            {
                "id": "view_calendar",
                "title": "캘린더 보기",
                "description": "일정을 확인합니다",
                "icon": "calendar",
                "url": "/calendar",
                "category": "calendar",
            },
            {
                "id": "view_reports",
                "title": "보고서 보기",
                "description": "프로젝트 보고서를 확인합니다",
                "icon": "chart",
                "url": "/reports",
                "category": "report",
            },
        ]

    async def get_performance_metrics(self, user_id: UUID) -> Dict[str, Any]:
        """성과 메트릭 조회"""
        try:
            task_stats = await self.get_task_stats(user_id)

            return {
                "completed_tasks": task_stats.get("by_status", {}).get("completed", 0),
                "on_time_completion_rate": 85.0,  # TODO: 실제 계산
                "average_completion_time": 2.5,  # TODO: 실제 계산 (일)
                "productivity_score": await self._calculate_productivity_score(user_id),
                "quality_score": 90.0,  # TODO: 품질 점수 계산
                "collaboration_score": 88.0,  # TODO: 협업 점수 계산
                "innovation_score": 75.0,  # TODO: 혁신 점수 계산
                "performance_trend": [],  # TODO: 성과 트렌드 데이터
            }

        except Exception as e:
            raise Exception(f"성과 메트릭 조회 실패: {str(e)}") from e

    async def get_team_overview(self, user_id: UUID) -> Dict[str, Any]:
        """팀 개요 정보 조회"""
        try:
            # 사용자가 참여한 프로젝트의 팀 정보 조회
            member_query = select(ProjectMember.project_id).where(
                and_(
                    ProjectMember.user_id == user_id,
                    ProjectMember.is_active.is_(True),
                )
            )
            member_result = await self.db.execute(member_query)
            project_ids = [row[0] for row in member_result.fetchall()]

            team_size = 1  # 기본값 (본인)
            if project_ids:
                team_query = select(count(ProjectMember.user_id.distinct())).where(
                    and_(
                        ProjectMember.project_id.in_(project_ids),
                        ProjectMember.is_active.is_(True),
                    )
                )
                team_result = await self.db.execute(team_query)
                team_size = team_result.scalar() or 1

            return {
                "team_size": team_size,
                "active_members": team_size,
                "projects_count": len(project_ids),
                "team_productivity": 85.0,  # TODO: 팀 생산성 계산
                "collaboration_index": 88.0,  # TODO: 협업 지수 계산
                "team_health": "excellent",  # TODO: 팀 건강도 계산
                "recent_team_activities": [],  # TODO: 팀 활동 조회
                "team_achievements": [],  # TODO: 팀 성과 조회
            }

        except Exception as e:
            raise Exception(f"팀 개요 조회 실패: {str(e)}") from e

    # ============================================================================
    # API 호환성을 위한 추가 메서드들
    # ============================================================================

    async def get_comprehensive_stats(
        self,
        user_id: UUID,
        period: str = "7d",
        data_type: str = "all",
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """포괄적인 통계 데이터 조회 (API 호환성)"""
        return await self.get_user_summary(user_id, period, data_type, search)

    async def get_project_status_stats(self, user_id: UUID) -> Dict[str, Any]:
        """프로젝트 상태별 통계"""
        project_stats = await self.get_project_stats(user_id)
        return {
            "by_status": project_stats.get("by_status", {}),
            "total": project_stats.get("total_projects", 0),
        }

    async def get_task_status_stats(self, user_id: UUID) -> Dict[str, Any]:
        """작업 상태별 통계"""
        task_stats = await self.get_task_stats(user_id)
        return {
            "by_status": task_stats.get("by_status", {}),
            "total": task_stats.get("total_tasks", 0),
        }

    async def get_user_workload_stats(self, user_id: UUID) -> Dict[str, Any]:
        """사용자 워크로드 통계"""
        return await self.get_workload_summary(user_id)

    async def log_user_activity(self, user_id: UUID, **activity_data) -> Dict[str, Any]:
        """사용자 활동 로그 추가"""
        # TODO: 실제 로그 저장 로직 구현
        return {"success": True, "message": "활동이 기록되었습니다."}

    async def update_dashboard_settings(
        self, user_id: UUID, settings: Dict[str, Any]
    ) -> None:
        """대시보드 설정 업데이트"""
        # TODO: 사용자 설정 저장 로직 구현
        pass

    async def check_for_updates(
        self, user_id: UUID, last_update: Optional[str] = None
    ) -> Dict[str, Any]:
        """대시보드 업데이트 확인"""
        return {
            "has_updates": False,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "updated_sections": [],
        }

    # ============================================================================
    # 헬퍼 메서드들
    # ============================================================================

    async def _calculate_productivity_score(self, user_id: UUID) -> float:
        """생산성 점수 계산"""
        try:
            task_stats = await self.get_task_stats(user_id)
            completion_rate = task_stats.get("completion_rate", 0.0)
            return min(completion_rate * 1.2, 100.0)
        except Exception:
            return 0.0

    def _calculate_workload_level(self, in_progress_tasks: int) -> str:
        """업무량 수준 계산"""
        if in_progress_tasks <= 2:
            return "low"
        elif in_progress_tasks <= 5:
            return "medium"
        elif in_progress_tasks <= 8:
            return "high"
        else:
            return "critical"


async def get_dashboard_service(
    db: Optional[AsyncSession] = None,
) -> DashboardService:
    """대시보드 서비스 인스턴스 가져오기"""
    if db is None:
        async for session in get_async_session():
            return DashboardService(session)
    return DashboardService(cast(AsyncSession, db))
