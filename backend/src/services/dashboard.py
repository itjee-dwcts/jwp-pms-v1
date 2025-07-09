"""
대시보드 서비스

대시보드 분석 및 요약을 위한 비즈니스 로직
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, cast

from constants.task import TaskStatus
from core.database import get_async_session
from models.calendar import Calendar, Event
from models.project import Project, ProjectMember
from models.task import Task, TaskAssignment
from models.user import User, UserActivityLog
from sqlalchemy import and_, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count


class DashboardService:
    """대시보드 분석 및 요약 데이터를 위한 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_summary(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 종합 대시보드 요약 조회"""
        project_stats = await self.get_project_stats(user_id)
        task_stats = await self.get_task_stats(user_id)
        recent_activity = await self.get_recent_activity(user_id)
        upcoming_events = await self.get_upcoming_events(user_id)

        return {
            "projects": project_stats,
            "tasks": task_stats,
            "recent_activity": recent_activity,
            "upcoming_events": upcoming_events,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    async def get_project_stats(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 프로젝트 통계 조회"""
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
        by_status = {status: count for status, count in status_result.fetchall()}

        # 우선순위별 프로젝트 수
        priority_query = (
            select(Project.priority, count(Project.id))
            .where(Project.id.in_(project_ids))
            .group_by(Project.priority)
        )
        priority_result = await self.db.execute(priority_query)
        by_priority = {
            priority: count for priority, count in priority_result.fetchall()
        }

        # 소유한 프로젝트 수
        owned_query = select(count(Project.id)).where(Project.creator_id == user_id)
        owned_result = await self.db.execute(owned_query)
        owned_projects = owned_result.scalar()

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

    async def get_task_stats(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 작업 통계 조회"""
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
                "created_by_me": 0,
                "by_status": {},
                "by_priority": {},
                "overdue_tasks": 0,
                "completion_rate": 0.0,
            }

        # 접근 가능한 프로젝트의 전체 작업 수
        total_query = select(count(Task.id)).where(Task.project_id.in_(project_ids))
        total_result = await self.db.execute(total_query)
        total_tasks = total_result.scalar()

        # 사용자에게 할당된 작업 수
        assigned_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    Task.project_id.in_(project_ids),
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                )
            )
        )
        assigned_result = await self.db.execute(assigned_query)
        assigned_to_me = assigned_result.scalar()
        if assigned_to_me is None:
            assigned_to_me = 0

        # 사용자가 생성한 작업 수
        created_query = select(count(Task.id)).where(
            and_(Task.project_id.in_(project_ids), Task.creator_id == user_id)
        )
        created_result = await self.db.execute(created_query)
        created_by_me = created_result.scalar()

        # 할당된 작업의 상태별 분포
        status_query = (
            select(Task.status, count(Task.id))  # type: ignore
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    Task.project_id.in_(project_ids),
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                )
            )
            .group_by(Task.status)
        )
        status_result = await self.db.execute(status_query)
        by_status = {status: count for status, count in status_result.fetchall()}

        # 할당된 작업의 우선순위별 분포
        priority_query = (
            select(Task.priority, count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    Task.project_id.in_(project_ids),
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                )
            )
            .group_by(Task.priority)
        )
        priority_result = await self.db.execute(priority_query)
        by_priority = {
            priority: count for priority, count in priority_result.fetchall()
        }

        # 지연된 작업 수
        overdue_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    Task.project_id.in_(project_ids),
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.due_date < datetime.utcnow(),
                    Task.status.in_(TaskStatus.get_incomplete_statuses()),
                )
            )
        )
        overdue_result = await self.db.execute(overdue_query)
        overdue_tasks = overdue_result.scalar()

        # 완료율 계산
        completed_count = by_status.get("completed", 0)
        completion_rate = (
            (completed_count / assigned_to_me * 100) if assigned_to_me > 0 else 0.0
        )

        return {
            "total_tasks": total_tasks,
            "assigned_to_me": assigned_to_me,
            "created_by_me": created_by_me,
            "by_status": by_status,
            "by_priority": by_priority,
            "overdue_tasks": overdue_tasks,
            "completion_rate": round(completion_rate, 2),
        }

    async def get_recent_activity(
        self, user_id: int, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 최근 활동 조회"""
        query = (
            select(UserActivityLog)
            .where(UserActivityLog.user_id == user_id)
            .order_by(UserActivityLog.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        activities = result.scalars().all()

        return [
            {
                "id": activity.id,
                "action": activity.action,
                "resource_type": activity.resource_type,
                "resource_id": activity.resource_id,
                "description": activity.description,
                "created_at": activity.created_at.isoformat(),
                "metadata": getattr(activity, "metadata", None),
            }
            for activity in activities
        ]

    async def get_upcoming_events(
        self, user_id: int, days: int = 7
    ) -> List[Dict[str, Any]]:
        """현재 사용자의 다가오는 일정 조회"""
        end_date = datetime.utcnow() + timedelta(days=days)

        query = (
            select(Event)
            .join(Calendar)
            .where(
                and_(
                    Calendar.owner_id == user_id,
                    Event.start_datetime >= datetime.utcnow(),
                    Event.start_datetime <= end_date,
                )
            )
            .order_by(Event.start_datetime)
            .limit(10)
        )

        result = await self.db.execute(query)
        events = result.scalars().all()

        return [
            {
                "id": event.id,
                "title": event.title,
                "start_datetime": event.start_datetime.isoformat(),
                "end_datetime": event.end_datetime.isoformat()
                if event.end_datetime
                else None,
                "event_type": event.event_type.value
                if hasattr(event.event_type, "value")
                else str(event.event_type),
                "location": event.location,
                "is_all_day": getattr(event, "is_all_day", False),
            }
            for event in events
        ]

    async def get_notifications(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 알림 조회"""
        # 오늘 마감인 작업
        today = datetime.now().date()
        today_tasks_query = (
            select(Task.title, Task.id)
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    func.date(Task.due_date) == today,
                    Task.status.in_(TaskStatus.get_incomplete_statuses()),
                )
            )
        )
        today_tasks_result = await self.db.execute(today_tasks_query)
        today_tasks = [
            {"id": task_id, "title": title}
            for title, task_id in today_tasks_result.fetchall()
        ]

        # 지연된 작업
        overdue_tasks_query = (
            select(Task.title, Task.id, Task.due_date)
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.due_date < datetime.utcnow(),
                    Task.status.in_(TaskStatus.get_incomplete_statuses()),
                )
            )
            .limit(5)
        )
        overdue_tasks_result = await self.db.execute(overdue_tasks_query)
        overdue_tasks = [
            {"id": task_id, "title": title, "due_date": due_date.isoformat()}
            for title, task_id, due_date in overdue_tasks_result.fetchall()
        ]

        # 다가오는 일정 (오늘)
        today_events_query = (
            select(Event.title, Event.id, Event.start_datetime)
            .select_from(Event)
            .join(Calendar)
            .where(
                and_(
                    Calendar.owner_id == user_id,
                    func.date(Event.start_datetime) == today,
                    Event.start_datetime >= datetime.utcnow(),
                )
            )
            .order_by(Event.start_datetime)
            .limit(5)
        )
        today_events_result = await self.db.execute(today_events_query)
        today_events = [
            {"id": event_id, "title": title, "start_time": start_datetime.isoformat()}
            for title, event_id, start_datetime in today_events_result.fetchall()
        ]

        return {
            "today_tasks": today_tasks,
            "overdue_tasks": overdue_tasks,
            "today_events": today_events,
            "total_notifications": len(today_tasks)
            + len(overdue_tasks)
            + len(today_events),
        }

    async def get_workload_summary(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 업무량 요약 조회"""
        # 이번 주 할당된 작업
        start_of_week = datetime.now() - timedelta(days=datetime.now().weekday())
        end_of_week = start_of_week + timedelta(days=6)

        weekly_tasks_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.created_at >= start_of_week,
                    Task.created_at <= end_of_week,
                )
            )
        )
        weekly_tasks_result = await self.db.execute(weekly_tasks_query)
        weekly_tasks = weekly_tasks_result.scalar()
        if weekly_tasks is None:
            weekly_tasks = 0

        # 이번 주 완료한 작업
        weekly_completed_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.status == "completed",
                    Task.updated_at >= start_of_week,
                    Task.updated_at <= end_of_week,
                )
            )
        )
        weekly_completed_result = await self.db.execute(weekly_completed_query)
        weekly_completed = weekly_completed_result.scalar()
        if weekly_completed is None:
            weekly_completed = 0

        # 현재 진행 중인 작업
        in_progress_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.status == "in_progress",
                )
            )
        )
        in_progress_result = await self.db.execute(in_progress_query)
        in_progress_tasks = in_progress_result.scalar()
        if in_progress_tasks is None:
            in_progress_tasks = 0

        # 이번 주 생산성 (완료한 작업 / 할당된 작업)
        weekly_productivity = (
            (weekly_completed / weekly_tasks * 100) if weekly_tasks > 0 else 0.0
        )

        return {
            "weekly_tasks": weekly_tasks,
            "weekly_completed": weekly_completed,
            "in_progress_tasks": in_progress_tasks,
            "weekly_productivity": round(weekly_productivity, 2),
            "workload_level": self._calculate_workload_level(in_progress_tasks),
        }

    async def get_performance_metrics(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 성과 지표 조회"""
        # 지난 30일 동안의 데이터
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # 완료한 작업 수
        completed_tasks_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.status == "completed",
                    Task.updated_at >= thirty_days_ago,
                )
            )
        )
        completed_tasks_result = await self.db.execute(completed_tasks_query)
        completed_tasks = completed_tasks_result.scalar()

        # 평균 작업 완료 시간 (생성일과 완료일 차이)
        avg_completion_time_query = (
            select(func.avg(extract("epoch", Task.updated_at - Task.created_at)))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.status == "completed",
                    Task.updated_at >= thirty_days_ago,
                )
            )
        )
        avg_completion_time_result = await self.db.execute(avg_completion_time_query)
        avg_completion_time_seconds = avg_completion_time_result.scalar() or 0
        avg_completion_time_hours = avg_completion_time_seconds / 3600

        # 정시 완료율 (마감일 전에 완료한 작업 비율)
        on_time_query = (
            select(count(Task.id))
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.status == "completed",
                    Task.updated_at >= thirty_days_ago,
                    Task.updated_at <= Task.due_date,
                )
            )
        )
        on_time_result = await self.db.execute(on_time_query)
        on_time_completed = on_time_result.scalar()
        if on_time_completed is None:
            on_time_completed = 0
        if completed_tasks is None:
            completed_tasks = 0

        on_time_rate = (
            (on_time_completed / completed_tasks * 100) if completed_tasks > 0 else 0.0
        )

        return {
            "completed_tasks_30d": completed_tasks,
            "avg_completion_time_hours": round(avg_completion_time_hours, 2),
            "on_time_completion_rate": round(on_time_rate, 2),
            "performance_score": self._calculate_performance_score(
                completed_tasks, on_time_rate, avg_completion_time_hours
            ),
        }

    async def get_quick_actions(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 빠른 작업 목록 조회"""
        # 우선순위 높은 미완료 작업
        high_priority_query = (
            select(Task.id, Task.title, Task.due_date)
            .select_from(Task)
            .join(TaskAssignment)
            .where(
                and_(
                    TaskAssignment.user_id == user_id,
                    TaskAssignment.is_active.is_(True),
                    Task.priority == "high",
                    Task.status.in_(TaskStatus.get_incomplete_statuses()),
                )
            )
            .order_by(Task.due_date)
            .limit(5)
        )
        high_priority_result = await self.db.execute(high_priority_query)
        high_priority_tasks = [
            {
                "id": task_id,
                "title": title,
                "due_date": due_date.isoformat() if due_date else None,
                "action": "complete_task",
            }
            for task_id, title, due_date in high_priority_result.fetchall()
        ]

        # 검토 대기 중인 작업
        review_pending_query = (
            select(Task.id, Task.title)
            .select_from(Task)
            .where(
                and_(
                    Task.creator_id == user_id,
                    Task.status == "review",
                )
            )
            .limit(3)
        )
        review_pending_result = await self.db.execute(review_pending_query)
        review_pending_tasks = [
            {"id": task_id, "title": title, "action": "review_task"}
            for task_id, title in review_pending_result.fetchall()
        ]

        # 새 프로젝트 생성 제안
        create_project_action = [
            {"action": "create_project", "title": "새 프로젝트 생성", "id": None}
        ]

        return {
            "high_priority_tasks": high_priority_tasks,
            "review_pending_tasks": review_pending_tasks,
            "suggested_actions": create_project_action,
            "total_actions": len(high_priority_tasks) + len(review_pending_tasks) + 1,
        }

    async def get_team_overview(self, user_id: int) -> Dict[str, Any]:
        """현재 사용자의 팀 개요 조회"""
        # 사용자가 속한 프로젝트의 다른 멤버들
        team_members_query = (
            select(
                User.id,
                User.name,
                User.email,
                count(ProjectMember.project_id).label("project_count"),
            )
            .select_from(User)
            .join(ProjectMember, User.id == ProjectMember.user_id)
            .where(
                and_(
                    ProjectMember.project_id.in_(
                        select(ProjectMember.project_id).where(
                            and_(
                                ProjectMember.user_id == user_id,
                                ProjectMember.is_active.is_(True),
                            )
                        )
                    ),
                    ProjectMember.is_active.is_(True),
                    User.id != user_id,
                )
            )
            .group_by(User.id, User.name, User.email)
            .limit(10)
        )
        team_members_result = await self.db.execute(team_members_query)
        team_members = [
            {
                "id": member_id,
                "name": name,
                "email": email,
                "shared_projects": project_count,
            }
            for member_id, name, email, project_count in team_members_result.fetchall()
        ]

        # 팀 전체 프로젝트 진행 상황
        team_projects_query = (
            select(Project.status, count(Project.id))
            .select_from(Project)
            .join(ProjectMember)
            .where(
                and_(
                    ProjectMember.user_id == user_id,
                    ProjectMember.is_active.is_(True),
                )
            )
            .group_by(Project.status)
        )
        team_projects_result = await self.db.execute(team_projects_query)
        team_project_stats = {
            status: count for status, count in team_projects_result.fetchall()
        }

        return {
            "team_members": team_members,
            "team_size": len(team_members),
            "team_project_stats": team_project_stats,
        }

    def _calculate_workload_level(self, in_progress_tasks: int) -> str:
        """업무량 수준 계산"""
        if in_progress_tasks <= 2:
            return "낮음"
        elif in_progress_tasks <= 5:
            return "보통"
        elif in_progress_tasks <= 8:
            return "높음"
        else:
            return "매우 높음"

    def _calculate_performance_score(
        self, completed_tasks: int, on_time_rate: float, avg_completion_time: float
    ) -> float:
        """성과 점수 계산 (0-100점)"""
        # 완료한 작업 수 점수 (최대 40점)
        task_score = min(completed_tasks * 2, 40)

        # 정시 완료율 점수 (최대 40점)
        on_time_score = on_time_rate * 0.4

        # 완료 시간 점수 (최대 20점) - 빠를수록 높은 점수
        # 평균 24시간 기준으로 계산
        time_score = max(20 - (avg_completion_time / 24) * 5, 0)

        total_score = task_score + on_time_score + time_score
        return round(min(total_score, 100), 2)


async def get_dashboard_service(
    db: Optional[AsyncSession] = None,
) -> DashboardService:
    """대시보드 서비스 인스턴스 가져오기"""
    if db is None:
        async for session in get_async_session():
            return DashboardService(session)
    return DashboardService(cast(AsyncSession, db))
