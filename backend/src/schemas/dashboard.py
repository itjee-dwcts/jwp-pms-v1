"""
대시보드 관련 Pydantic 스키마

대시보드 API 요청/응답을 위한 데이터 모델
- 통계 정보, 최근 활동, 일정, 알림 등의 응답 모델
- 차트 데이터 및 분석 결과 모델
- 페이지네이션 및 실시간 업데이트 모델
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

# ============================================================================
# 기본 응답 모델들
# ============================================================================


class DashboardStatsResponse(BaseModel):
    """
    대시보드 통계 응답 모델

    프로젝트, 작업, 시간 추적 등의 전반적인 통계 정보를 제공합니다.
    메인 대시보드에서 사용자에게 핵심 지표를 보여줄 때 사용됩니다.
    """

    # 프로젝트 관련 통계
    total_projects: int = Field(description="총 프로젝트 수")
    active_projects: int = Field(description="활성 상태의 프로젝트 수")
    completed_projects: int = Field(description="완료된 프로젝트 수")

    # 작업 관련 통계
    total_tasks: int = Field(description="총 작업 수")
    pending_tasks: int = Field(description="대기 중인 작업 수")
    in_progress_tasks: int = Field(description="진행 중인 작업 수")
    completed_tasks: int = Field(description="완료된 작업 수")
    overdue_tasks: int = Field(description="마감일이 지난 작업 수")

    # 시간 관련 통계
    total_time_spent: float = Field(description="총 소요 시간 (시간 단위)")
    avg_completion_time: float = Field(description="평균 완료 시간 (시간 단위)")

    # 성과 지표
    completion_rate: float = Field(description="작업 완료율 (백분율)")
    productivity_score: float = Field(description="생산성 점수 (0-100)")

    # 기간 및 메타데이터
    period: str = Field(description="통계 집계 기간 (예: 7d, 30d, 90d)")
    last_updated: datetime = Field(description="통계 데이터 마지막 업데이트 시간")

    # 추가 통계 (선택적 데이터)
    total_events: int = Field(default=0, description="총 일정 수")
    upcoming_events: int = Field(default=0, description="다가오는 일정 수")
    notifications_count: int = Field(default=0, description="총 알림 수")
    unread_notifications: int = Field(default=0, description="읽지 않은 알림 수")

    class Config:
        """
        Pydantic 모델 설정

        - json_encoders: datetime 객체를 ISO 8601 형식 문자열로 직렬화
        - 프론트엔드에서 날짜/시간을 일관된 형식으로 받을 수 있도록 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


class RecentActivityResponse(BaseModel):
    """
    최근 활동 응답 모델

    사용자의 최근 활동 내역을 타임라인 형태로 표시하기 위한 데이터 구조입니다.
    활동 피드, 알림 센터 등에서 사용됩니다.
    """

    # 기본 식별 정보
    id: str = Field(description="활동 고유 ID (UUID 문자열)")
    type: str = Field(description="활동 타입 (create, update, delete, view 등)")
    action: str = Field(description="구체적인 액션 (created_project, updated_task 등)")
    description: str = Field(description="사용자에게 표시될 활동 설명")

    # 대상 리소스 정보
    resource_type: Optional[str] = Field(
        None, description="대상 리소스 타입 (project, task, event 등)"
    )
    resource_id: Optional[str] = Field(None, description="대상 리소스의 고유 ID")
    resource_name: Optional[str] = Field(None, description="대상 리소스의 이름/제목")

    # 사용자 정보
    user_name: Optional[str] = Field(None, description="활동을 수행한 사용자 이름")
    user_avatar: Optional[str] = Field(None, description="사용자 프로필 이미지 URL")

    # 시간 정보
    timestamp: datetime = Field(description="활동이 발생한 정확한 시간")

    # 확장 데이터
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="추가 컨텍스트 정보 (JSON 형태)"
    )

    # 프론트엔드 호환성 필드 (기존 시스템과의 호환성 유지)
    created_at: Optional[datetime] = Field(
        None, description="생성 시간 (timestamp의 별칭)"
    )

    @field_validator("created_at", mode="before")
    @classmethod
    def set_created_at(cls, v, values):
        """
        created_at 필드 자동 설정

        값이 제공되지 않은 경우 timestamp 값을 사용하여
        기존 프론트엔드 코드와의 호환성을 보장합니다.
        """
        return v or values.get("timestamp")

    class Config:
        """
        Pydantic 모델 설정

        datetime 객체의 JSON 직렬화 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


class UpcomingEventResponse(BaseModel):
    """
    다가오는 일정 응답 모델

    사용자의 향후 일정을 캘린더나 대시보드에 표시하기 위한 데이터 구조입니다.
    회의, 마감일, 개인 일정 등 모든 종류의 이벤트를 포함합니다.
    """

    # 기본 일정 정보
    id: str = Field(description="일정 고유 ID (UUID 문자열)")
    title: str = Field(description="일정 제목/이름")
    description: Optional[str] = Field(None, description="일정 상세 설명")
    type: str = Field(description="일정 타입 (meeting, deadline, personal, task 등)")
    priority: str = Field(
        default="medium", description="우선순위 (low, medium, high, urgent)"
    )

    # 시간 정보
    start_time: datetime = Field(description="일정 시작 시간")
    end_time: Optional[datetime] = Field(
        None, description="일정 종료 시간 (종료 시간이 없는 일정의 경우 None)"
    )
    duration: Optional[int] = Field(None, description="예상 소요 시간 (분 단위)")

    # 장소 및 참석자 정보
    location: Optional[str] = Field(
        None, description="일정 장소 (온라인 회의 링크 포함)"
    )
    attendees: List[str] = Field(
        default_factory=list, description="참석자 이메일 또는 ID 목록"
    )

    # 프로젝트 연관 정보
    project_id: Optional[str] = Field(None, description="연관된 프로젝트 ID")
    project_name: Optional[str] = Field(None, description="연관된 프로젝트 이름")

    # 일정 속성
    is_recurring: bool = Field(default=False, description="반복 일정 여부")
    reminder_set: bool = Field(default=False, description="알림 설정 여부")

    # 프론트엔드 호환성 및 추가 정보
    calendar_name: Optional[str] = Field(None, description="소속 캘린더 이름")
    status: Optional[str] = Field(
        default="confirmed", description="일정 상태 (confirmed, tentative, cancelled)"
    )
    attendee_count: Optional[int] = Field(None, description="참석자 수 (자동 계산)")

    @field_validator("attendee_count", mode="before")
    @classmethod
    def set_attendee_count(cls, v, values):
        """
        참석자 수 자동 계산

        attendee_count가 명시적으로 제공되지 않은 경우
        attendees 리스트의 길이를 사용하여 자동으로 계산합니다.
        """
        if v is not None:
            return v
        attendees = values.get("attendees", [])
        return len(attendees) if attendees is not None else 0

    class Config:
        """
        Pydantic 모델 설정

        datetime 필드들의 JSON 직렬화 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


# ============================================================================
# 새로운 응답 모델들 (API 엔드포인트 기반)
# ============================================================================


class ProjectStatusStatsResponse(BaseModel):
    """
    프로젝트 상태별 통계 응답 모델

    GET /stats/projects 엔드포인트용
    """

    total_projects: int = Field(description="총 프로젝트 수")
    by_status: Dict[str, int] = Field(description="상태별 프로젝트 수")
    by_priority: Dict[str, int] = Field(description="우선순위별 프로젝트 수")
    completion_rates: Dict[str, float] = Field(description="프로젝트별 완료율")
    overdue_count: int = Field(default=0, description="마감일이 지난 프로젝트 수")


class TaskStatusStatsResponse(BaseModel):
    """
    작업 상태별 통계 응답 모델

    GET /stats/tasks 엔드포인트용
    """

    total_tasks: int = Field(description="총 작업 수")
    by_status: Dict[str, int] = Field(description="상태별 작업 수")
    by_priority: Dict[str, int] = Field(description="우선순위별 작업 수")
    by_assignee: Dict[str, int] = Field(description="담당자별 작업 수")
    overdue_count: int = Field(default=0, description="마감일이 지난 작업 수")
    completion_trend: List[Dict[str, Any]] = Field(
        default_factory=list, description="완료 트렌드 데이터"
    )


class UserWorkloadStatsResponse(BaseModel):
    """
    사용자 워크로드 통계 응답 모델

    GET /stats/workload 엔드포인트용
    """

    current_workload: int = Field(description="현재 할당된 작업 수")
    capacity_utilization: float = Field(description="업무 용량 활용률 (%)")
    workload_distribution: Dict[str, int] = Field(description="프로젝트별 업무 분배")
    overdue_workload: int = Field(default=0, description="마감일이 지난 업무 수")
    estimated_completion: Optional[datetime] = Field(None, description="예상 완료 시간")
    burnout_risk: str = Field(default="low", description="번아웃 위험도")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class DashboardOverviewResponse(BaseModel):
    """
    대시보드 개요 응답 모델

    GET /overview 엔드포인트용
    """

    stats: DashboardStatsResponse = Field(description="기본 통계 정보")
    charts: Optional[Dict[str, Any]] = Field(None, description="차트 데이터")
    key_metrics: Dict[str, Any] = Field(description="핵심 지표")
    widgets: List[Dict[str, Any]] = Field(description="위젯 데이터")
    layout: Optional[Dict[str, Any]] = Field(None, description="레이아웃 설정")
    preferences: Optional[Dict[str, Any]] = Field(None, description="사용자 설정")


class ActivityDetailResponse(BaseModel):
    """
    활동 상세 응답 모델

    GET /activities/{activity_id} 엔드포인트용
    """

    id: str = Field(description="활동 ID")
    type: str = Field(description="활동 타입")
    action: str = Field(description="액션")
    description: str = Field(description="활동 설명")
    resource_type: Optional[str] = Field(None, description="리소스 타입")
    resource_id: Optional[str] = Field(None, description="리소스 ID")
    resource_name: Optional[str] = Field(None, description="리소스 이름")
    user_id: str = Field(description="사용자 ID")
    user_name: str = Field(description="사용자 이름")
    timestamp: datetime = Field(description="발생 시간")
    metadata: Optional[Dict[str, Any]] = Field(None, description="추가 메타데이터")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class UserActivitiesResponse(BaseModel):
    """
    사용자별 활동 내역 응답 모델

    GET /users/{user_id}/activities 엔드포인트용
    """

    activities: List[RecentActivityResponse] = Field(description="활동 목록")
    total: int = Field(description="총 활동 수")
    page_no: int = Field(description="현재 페이지")
    page_size: int = Field(description="페이지 크기")
    total_pages: int = Field(description="총 페이지 수")


class EventDetailResponse(BaseModel):
    """
    이벤트 상세 응답 모델

    GET /events/{event_id} 엔드포인트용
    """

    id: str = Field(description="이벤트 ID")
    title: str = Field(description="이벤트 제목")
    description: Optional[str] = Field(None, description="이벤트 설명")
    type: str = Field(description="이벤트 타입")
    priority: str = Field(description="우선순위")
    start_time: datetime = Field(description="시작 시간")
    end_time: Optional[datetime] = Field(None, description="종료 시간")
    location: Optional[str] = Field(None, description="장소")
    attendees: List[Dict[str, Any]] = Field(description="참석자 정보")
    project_id: Optional[str] = Field(None, description="연관 프로젝트 ID")
    status: str = Field(description="이벤트 상태")
    created_by: str = Field(description="생성자")
    created_at: datetime = Field(description="생성 시간")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class DashboardSettingsResponse(BaseModel):
    """
    대시보드 설정 응답 모델

    GET /settings 엔드포인트용
    """

    layout: Dict[str, Any] = Field(description="레이아웃 설정")
    widgets: List[Dict[str, Any]] = Field(description="위젯 설정")
    preferences: Dict[str, Any] = Field(description="사용자 선호도")
    theme: str = Field(default="light", description="테마 설정")
    notifications: Dict[str, bool] = Field(description="알림 설정")
    auto_refresh: bool = Field(default=True, description="자동 새로고침")
    refresh_interval: int = Field(default=30, description="새로고침 간격(초)")


class ExportStatusResponse(BaseModel):
    """
    내보내기 상태 응답 모델

    GET /export/{export_id}/status 엔드포인트용
    """

    status: str = Field(description="내보내기 상태")
    progress: Optional[float] = Field(None, description="진행률 (%)")
    download_url: Optional[str] = Field(None, description="다운로드 URL")
    expires_at: Optional[datetime] = Field(None, description="만료 시간")
    error_message: Optional[str] = Field(None, description="에러 메시지")
    created_at: datetime = Field(description="시작 시간")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class CacheStatusResponse(BaseModel):
    """
    캐시 상태 응답 모델

    GET /cache/status 엔드포인트용
    """

    total_keys: int = Field(description="총 캐시 키 수")
    memory_usage: float = Field(description="메모리 사용량 (MB)")
    hit_rate: float = Field(description="캐시 히트율 (%)")
    last_cleanup: datetime = Field(description="마지막 정리 시간")
    cache_size: int = Field(description="캐시 크기 (바이트)")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class NotificationResponse(BaseModel):
    """
    알림 응답 모델

    시스템에서 사용자에게 전달하는 모든 종류의 알림을 표현합니다.
    푸시 알림, 이메일 알림, 인앱 알림 등에 사용됩니다.
    """

    # 기본 알림 정보
    id: str = Field(description="알림 고유 ID (UUID 문자열)")
    title: str = Field(description="알림 제목")
    message: str = Field(description="알림 본문 내용")
    type: str = Field(description="알림 타입 (info, warning, error, success, reminder)")
    priority: str = Field(
        default="normal", description="우선순위 (low, normal, high, urgent)"
    )

    # 알림 상태
    read_at: Optional[datetime] = Field(None, description="읽은 시간")

    # 액션 관련 정보 (알림 클릭 시 동작)
    action_url: Optional[str] = Field(
        None, description="클릭 시 이동할 URL 또는 딥링크"
    )

    # 시간 정보
    created_at: datetime = Field(description="알림 생성 시간")

    class Config:
        """
        Pydantic 모델 설정

        datetime 필드들의 JSON 직렬화 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


class DashboardNotificationsResponse(BaseModel):
    """
    대시보드 알림 목록 응답 모델

    GET /notifications 엔드포인트용
    """

    notifications: List[NotificationResponse] = Field(description="알림 목록")
    total: int = Field(description="총 알림 수")
    unread_count: int = Field(description="읽지 않은 알림 수")
    page_no: int = Field(description="현재 페이지")
    page_size: int = Field(description="페이지 크기")
    total_pages: int = Field(description="총 페이지 수")


class UpdateCheckResponse(BaseModel):
    """
    업데이트 확인 응답 모델

    GET /updates 엔드포인트용
    """

    has_updates: bool = Field(description="업데이트 존재 여부")
    last_updated: datetime = Field(description="마지막 업데이트 시간")
    updated_sections: List[str] = Field(description="업데이트된 섹션 목록")
    next_check: Optional[datetime] = Field(None, description="다음 확인 시간")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class PerformanceMetricsResponse(BaseModel):
    """
    성능 메트릭 응답 모델

    GET /metrics/performance 엔드포인트용
    """

    load_time: float = Field(description="로딩 시간 (초)")
    query_time: float = Field(description="쿼리 시간 (초)")
    cache_hit_rate: float = Field(description="캐시 히트율 (%)")
    active_users: int = Field(description="활성 사용자 수")
    memory_usage: float = Field(description="메모리 사용량 (MB)")


class ActivityMetricsResponse(BaseModel):
    """
    활동 메트릭 응답 모델

    GET /metrics/activity 엔드포인트용
    """

    total_activities: int = Field(description="총 활동 수")
    unique_users: int = Field(description="고유 사용자 수")
    most_active_users: List[Dict[str, Any]] = Field(description="가장 활발한 사용자들")
    activity_by_hour: List[Dict[str, Any]] = Field(description="시간대별 활동")
    activity_by_type: Dict[str, int] = Field(description="타입별 활동 수")


# ============================================================================
# 요청 모델들
# ============================================================================


class UserActivityLogRequest(BaseModel):
    """
    사용자 활동 로그 요청 모델

    POST /activities 엔드포인트용
    """

    action: str = Field(description="액션 타입")
    resource_type: Optional[str] = Field(None, description="리소스 타입")
    resource_id: Optional[str] = Field(None, description="리소스 ID")
    description: Optional[str] = Field(None, description="활동 설명")
    metadata: Optional[Dict[str, Any]] = Field(None, description="추가 메타데이터")


class DashboardSettingsRequest(BaseModel):
    """
    대시보드 설정 요청 모델

    PUT /settings 엔드포인트용
    """

    layout: Optional[Dict[str, Any]] = Field(None, description="레이아웃 설정")
    widgets: Optional[List[Dict[str, Any]]] = Field(None, description="위젯 설정")
    preferences: Optional[Dict[str, Any]] = Field(None, description="사용자 선호도")
    theme: Optional[str] = Field(None, description="테마 설정")
    notifications: Optional[Dict[str, bool]] = Field(None, description="알림 설정")
    auto_refresh: Optional[bool] = Field(None, description="자동 새로고침")
    refresh_interval: Optional[int] = Field(None, description="새로고침 간격(초)")


class AsyncExportRequest(BaseModel):
    """
    비동기 내보내기 요청 모델

    POST /export/async 엔드포인트용
    """

    format: str = Field(description="내보내기 형식 (json, csv, excel)")
    filters: Optional[Dict[str, Any]] = Field(None, description="필터 조건")
    include_metadata: bool = Field(default=True, description="메타데이터 포함 여부")


class CacheInvalidationRequest(BaseModel):
    """
    캐시 무효화 요청 모델

    POST /cache/invalidate/specific 엔드포인트용
    """

    cache_keys: List[str] = Field(description="무효화할 캐시 키 목록")


# ============================================================================
# 차트 및 분석 모델들 (기존 유지)
# ============================================================================


class ChartDataPoint(BaseModel):
    """
    차트 데이터 포인트 모델

    모든 종류의 차트에서 사용하는 기본 데이터 단위입니다.
    """

    label: str = Field(description="데이터 포인트의 레이블 (X축 값, 범례 등)")
    value: float = Field(description="수치 데이터 값 (Y축 값)")
    timestamp: Optional[datetime] = Field(
        None, description="시계열 데이터의 경우 시간 정보"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="차트 툴팁 등에 사용할 추가 정보"
    )

    class Config:
        """
        Pydantic 모델 설정

        datetime 필드의 JSON 직렬화 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


class ChartResponse(BaseModel):
    """
    차트 응답 모델

    프론트엔드에서 차트 라이브러리로 렌더링하기 위한 완전한 데이터 구조입니다.
    """

    type: str = Field(description="차트 타입 (line, bar, pie, doughnut, area, scatter)")
    title: str = Field(description="차트 제목")
    data: List[ChartDataPoint] = Field(description="차트에 표시할 데이터 포인트들")
    options: Optional[Dict[str, Any]] = Field(
        None, description="차트 라이브러리별 렌더링 옵션"
    )
    colors: Optional[List[str]] = Field(None, description="차트에 사용할 색상 팔레트")


# ============================================================================
# 에러 응답 모델 (기존 유지)
# ============================================================================


class DashboardErrorResponse(BaseModel):
    """
    대시보드 에러 응답 모델

    대시보드 관련 API에서 발생하는 모든 종류의 에러를 표준화된 형식으로 반환합니다.
    클라이언트에서 일관된 에러 처리를 할 수 있도록 합니다.
    """

    error_code: str = Field(
        description="시스템 정의 에러 코드 (DASH001, STATS_ERROR 등)"
    )
    error_message: str = Field(description="사용자에게 표시할 친화적인 에러 메시지")
    details: Optional[Dict[str, Any]] = Field(
        None, description="개발자용 상세 에러 정보"
    )
    timestamp: datetime = Field(description="에러가 발생한 시간")

    class Config:
        """
        Pydantic 모델 설정

        에러 발생 시간의 JSON 직렬화 설정
        """

        json_encoders = {datetime: lambda v: v.isoformat()}


# ============================================================================
# 기존 호환성 유지를 위한 별칭들
# ============================================================================

# 기존 코드와의 호환성을 위한 별칭 정의
ProjectStatsResponse = ProjectStatusStatsResponse
TaskStatsResponse = TaskStatusStatsResponse
WorkloadSummaryResponse = UserWorkloadStatsResponse
QuickActionsResponse = Dict[str, Any]  # 임시로 Dict 타입으로 정의
TeamOverviewResponse = Dict[str, Any]  # 임시로 Dict 타입으로 정의
AnalyticsResponse = Dict[str, Any]  # 임시로 Dict 타입으로 정의

# 요청 모델 별칭
DashboardStatsRequest = Dict[str, Any]  # 임시로 Dict 타입으로 정의
ActivityLogRequest = UserActivityLogRequest

# 페이지네이션 응답 별칭
PaginatedActivityResponse = UserActivitiesResponse
PaginatedNotificationResponse = DashboardNotificationsResponse

# 실시간 업데이트 별칭
RealtimeDataResponse = Dict[str, Any]  # 임시로 Dict 타입으로 정의
