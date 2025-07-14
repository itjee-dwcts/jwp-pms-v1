"""
작업 Pydantic 스키마

작업 관리를 위한 요청/응답 스키마
"""

from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from constants.task import TaskPriority, TaskStatus, TaskType
from schemas.user import UserPublic


class TaskBase(BaseModel):
    """기본 작업 스키마"""

    title: str = Field(..., min_length=1, max_length=200, description="작업 제목")
    description: Optional[str] = Field(None, max_length=5000, description="작업 설명")
    status: str = Field(default="todo", description="작업 상태")
    priority: str = Field(default="medium", description="작업 우선순위")
    task_type: str = Field(default="feature", description="작업 유형")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """작업 상태 검증"""
        # 정의된 상태 중 하나인지 확인
        valid_statuses = [
            TaskStatus.TODO,
            TaskStatus.IN_PROGRESS,
            TaskStatus.IN_REVIEW,
            TaskStatus.TESTING,
            TaskStatus.DONE,
            TaskStatus.BLOCKED,
        ]
        if v not in valid_statuses:
            raise ValueError(
                f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
            )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str):
        """작업 우선순위 검증"""
        valid_priorities = ["low", "medium", "high", "urgent"]
        if v not in valid_priorities:
            raise ValueError(
                f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
            )
        return v

    @field_validator("task_type")
    @classmethod
    def validate_task_type(cls, v: str):
        """작업 유형 검증"""
        valid_types = [
            TaskType.FEATURE,
            TaskType.BUG,
            TaskType.IMPROVEMENT,
            TaskType.RESEARCH,
            TaskType.DOCUMENTATION,
            TaskType.TESTING,
            TaskType.MAINTENANCE,
        ]
        if v not in valid_types:
            raise ValueError(
                f"작업 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
            )
        return v


class TaskCreateRequest(TaskBase):
    """작업 생성 스키마"""

    project_id: UUID = Field(..., description="프로젝트 ID")
    parent_id: Optional[UUID] = Field(None, description="하위 작업을 위한 상위 작업 ID")
    owner_id: Optional[UUID] = Field(..., description="소유자 ID")
    start_date: Optional[datetime] = Field(None, description="작업 시작일")
    end_date: Optional[datetime] = Field(None, description="작업 마감일")
    estimated_days: Optional[int] = Field(None, ge=0, description="예상 일수")
    story_points: Optional[int] = Field(None, ge=0, description="스토리 포인트")
    acceptance_criteria: Optional[str] = Field(
        None, max_length=2000, description="수락 기준"
    )
    external_id: Optional[str] = Field(
        None, max_length=100, description="외부 시스템 ID"
    )
    assignee_ids: Optional[List[UUID]] = Field(
        default=[], description="할당된 사용자 ID 목록"
    )
    tag_ids: Optional[List[UUID]] = Field(default=[], description="태그 ID 목록")

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: str, values: Any):
        """마감일 검증"""
        if (
            v
            and "start_date" in values.data
            and values.data["start_date"]
            and v < values.data["start_date"]
        ):
            raise ValueError("마감일은 시작일 이후여야 합니다")
        return v


class TaskUpdateRequest(BaseModel):
    """작업 업데이트 스키마"""

    title: Optional[str] = Field(
        None, min_length=1, max_length=200, description="작업 제목"
    )
    description: Optional[str] = Field(None, max_length=5000, description="작업 설명")
    status: Optional[str] = Field(None, description="작업 상태")
    priority: Optional[str] = Field(None, description="작업 우선순위")
    task_type: Optional[str] = Field(None, description="작업 유형")
    parent_id: Optional[UUID] = Field(None, description="상위 작업 ID")
    start_date: Optional[datetime] = Field(None, description="작업 시작일")
    end_date: Optional[datetime] = Field(None, description="작업 마감일")
    estimated_days: Optional[int] = Field(None, ge=0, description="예상 시간")
    actual_hours: Optional[int] = Field(None, ge=0, description="실제 시간")
    story_points: Optional[int] = Field(None, ge=0, description="스토리 포인트")
    acceptance_criteria: Optional[str] = Field(
        None, max_length=2000, description="수락 기준"
    )
    external_id: Optional[str] = Field(
        None, max_length=100, description="외부 시스템 ID"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str):
        """작업 상태 검증"""
        if v is not None:
            valid_statuses = [
                TaskStatus.TODO,
                TaskStatus.IN_PROGRESS,
                TaskStatus.IN_REVIEW,
                TaskStatus.TESTING,
                TaskStatus.DONE,
                TaskStatus.BLOCKED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str):
        """작업 우선순위 검증"""
        if v is not None:
            valid_priorities = [
                TaskPriority.LOW,
                TaskPriority.MEDIUM,
                TaskPriority.HIGH,
                TaskPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
                )
        return v

    @field_validator("task_type")
    @classmethod
    def validate_task_type(cls, v: str) -> str:
        """작업 유형 검증"""
        if v is not None:
            valid_types = [
                TaskType.FEATURE,
                TaskType.BUG,
                TaskType.IMPROVEMENT,
                TaskType.RESEARCH,
                TaskType.DOCUMENTATION,
                TaskType.TESTING,
                TaskType.MAINTENANCE,
            ]
            if v not in valid_types:
                raise ValueError(
                    f"작업 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
                )
        return v


class TaskAssignmentResponse(BaseModel):
    """작업 할당 응답 스키마"""

    id: UUID
    task_id: UUID
    assignee_id: UUID
    assigned_at: datetime
    assigned_by: int
    is_active: bool = True
    assignee: UserPublic

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TaskCommentBase(BaseModel):
    """기본 작업 댓글 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class TaskCommentCreateRequest(TaskCommentBase):
    """작업 댓글 생성 스키마"""

    parent_id: Optional[UUID] = Field(None, description="답글을 위한 부모 댓글 ID")


class TaskCommentUpdateRequest(BaseModel):
    """작업 댓글 업데이트 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class TaskCommentResponse(BaseModel):
    """작업 댓글 응답 스키마"""

    id: UUID
    task_id: UUID
    author_id: UUID
    parent_id: Optional[UUID] = None
    content: str
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    author: UserPublic
    replies: List["TaskCommentResponse"] = []

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TaskAttachmentResponse(BaseModel):
    """작업 첨부파일 응답 스키마"""

    id: UUID
    task_id: UUID
    file_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: UUID
    created_at: datetime
    uploader: UserPublic

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TaskTimeLogBase(BaseModel):
    """기본 작업 시간 로그 스키마"""

    hours: int = Field(..., gt=0, description="작업한 시간")
    description: Optional[str] = Field(None, max_length=500, description="작업 설명")


class TaskTimeLogCreateRequest(TaskTimeLogBase):
    """작업 시간 로그 생성 스키마"""

    work_date: Optional[datetime] = Field(None, description="작업 날짜 (기본값: 오늘)")


class TaskTimeLogUpdateRequest(TaskTimeLogBase):
    """작업 시간 로그 업데이트 스키마"""

    work_date: Optional[datetime] = Field(None, description="작업 날짜")


class TaskTimeLogResponse(BaseModel):
    """작업 시간 로그 응답 스키마"""

    id: UUID
    task_id: UUID
    assignee_id: UUID
    hours: int
    description: Optional[str] = None
    work_date: datetime
    created_at: datetime
    updated_at: datetime
    assignee: UserPublic

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TagBase(BaseModel):
    """기본 태그 스키마"""

    name: str = Field(..., min_length=1, max_length=50, description="태그 이름")
    color: Optional[str] = Field(
        "#3B82F6", max_length=7, description="태그 색상 (16진수)"
    )
    description: Optional[str] = Field(None, max_length=200, description="태그 설명")

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str):
        """태그 색상 검증"""
        if v is not None and not v.startswith("#"):
            raise ValueError("색상은 16진수 형식이어야 합니다 (예: #ff0000)")
        return v


class TagCreateRequest(TagBase):
    """태그 생성 스키마"""


class TagUpdateRequest(BaseModel):
    """태그 업데이트 스키마"""

    name: Optional[str] = Field(
        None, min_length=1, max_length=50, description="태그 이름"
    )
    color: Optional[str] = Field(None, max_length=7, description="태그 색상 (16진수)")
    description: Optional[str] = Field(None, max_length=200, description="태그 설명")

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str):
        """태그 색상 검증"""
        if v is not None and not v.startswith("#"):
            raise ValueError("색상은 16진수 형식이어야 합니다 (예: #ff0000)")
        return v


class TagResponse(TagBase):
    """태그 응답 스키마"""

    id: UUID
    created_by: UUID
    created_at: datetime

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TaskResponse(TaskBase):
    """작업 응답 스키마"""

    id: UUID
    project_id: UUID
    owner_id: UUID
    parent_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    estimated_days: Optional[int] = None
    actual_days: int = 0
    story_points: Optional[int] = None
    acceptance_criteria: Optional[str] = None
    external_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    owner: UserPublic
    assignments: List[TaskAssignmentResponse] = []
    comments: List[TaskCommentResponse] = []
    attachments: List[TaskAttachmentResponse] = []
    time_logs: List[TaskTimeLogResponse] = []
    tags: List[TagResponse] = []
    subtasks: List["TaskResponse"] = []

    class Config:
        """Pydantic 모델 설정"""

        from_attributes = True


class TaskListResponse(BaseModel):
    """작업 목록 응답 스키마"""

    tasks: List[TaskResponse]
    page_no: int = Field(..., ge=0, description="현재 페이지 번호")
    page_size: int = Field(..., ge=1, le=100, description="페이지 크기")
    total_pages: int = Field(..., ge=0, description="전체 페이지 수")
    total_items: int = Field(..., ge=0, description="전체 항목 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

    @classmethod
    def create_response(
        cls,
        tasks: List[TaskResponse],
        page_no: int,
        page_size: int,
        total_items: int,
    ) -> "TaskListResponse":
        """TaskListResponse 생성 헬퍼 메서드"""
        total_pages = (
            (total_items + page_size - 1) // page_size if total_items > 0 else 0
        )
        has_next = page_no < total_pages - 1 if total_pages > 0 else False
        has_prev = page_no > 0

        return cls(
            tasks=tasks,
            page_no=page_no,
            page_size=page_size,
            total_pages=total_pages,
            total_items=total_items,
            has_next=has_next,
            has_prev=has_prev,
        )

    class Config:
        """ProjectListResponse 설정"""

        from_attributes = True


class TaskStatsResponse(BaseModel):
    """작업 통계 스키마"""

    total_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    tasks_by_status: dict
    tasks_by_priority: dict
    tasks_by_type: dict
    average_completion_time: Optional[float] = None


class TaskSearchRequest(BaseModel):
    """작업 검색 요청 스키마"""

    search_text: Optional[str] = Field(None, description="검색 쿼리")
    project_id: Optional[UUID] = Field(None, description="프로젝트 ID")
    task_status: Optional[str] = Field(None, description="작업 상태")
    priority: Optional[str] = Field(None, description="우선순위")
    task_type: Optional[str] = Field(None, description="작업 유형")
    assignee_id: Optional[UUID] = Field(None, description="할당자 ID")
    owner_id: Optional[UUID] = Field(None, description="소유자 ID")
    tag_ids: Optional[List[UUID]] = Field(None, description="태그 ID 목록")
    due_date_from: Optional[datetime] = Field(None, description="마감일 범위 시작")
    due_date_to: Optional[datetime] = Field(None, description="마감일 범위 끝")
    created_from: Optional[datetime] = Field(None, description="생성일 범위 시작")
    created_to: Optional[datetime] = Field(None, description="생성일 범위 끝")

    @field_validator("task_status")
    @classmethod
    def validate_status(cls, v: str):
        """작업 상태 검증"""
        if v is not None:
            valid_statuses = [
                TaskStatus.TODO,
                TaskStatus.IN_PROGRESS,
                TaskStatus.IN_REVIEW,
                TaskStatus.TESTING,
                TaskStatus.DONE,
                TaskStatus.BLOCKED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str):
        """작업 우선순위 검증"""
        if v is not None:
            valid_priorities = [
                TaskPriority.LOW,
                TaskPriority.MEDIUM,
                TaskPriority.HIGH,
                TaskPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
                )
        return v

    @field_validator("task_type")
    @classmethod
    def validate_task_type(cls, v: str) -> str:
        """작업 유형 검증"""
        if v is not None:
            valid_types = [
                TaskType.FEATURE,
                TaskType.BUG,
                TaskType.IMPROVEMENT,
                TaskType.RESEARCH,
                TaskType.DOCUMENTATION,
                TaskType.TESTING,
                TaskType.MAINTENANCE,
            ]
            if v not in valid_types:
                raise ValueError(
                    f"작업 유형은 다음 중 하나여야 합니다: {', '.join(valid_types)}"
                )
        return v


class TaskAssignRequest(BaseModel):
    """작업 할당 요청 스키마"""

    assignee_ids: List[UUID] = Field(..., description="할당할 사용자 ID 목록")


class TaskDashboardResponse(BaseModel):
    """작업 대시보드 응답 스키마"""

    total_tasks: int
    my_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    recent_tasks: List[TaskResponse]
    my_recent_tasks: List[TaskResponse]
    upcoming_deadlines: List[TaskResponse]
    task_completion_stats: dict


class TaskKanbanBoardResponse(BaseModel):
    """칸반 보드 응답 스키마"""

    todo: List[TaskResponse]
    in_progress: List[TaskResponse]
    in_review: List[TaskResponse]
    testing: List[TaskResponse]
    done: List[TaskResponse]


class TaskGanttChartResponse(BaseModel):
    """간트 차트 응답 스키마"""

    task_id: UUID
    title: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    progress: int = 0
    dependencies: List[UUID] = []


class TaskGanttResponse(BaseModel):
    """간트 차트 데이터 응답 스키마"""

    tasks: List[TaskGanttChartResponse]
    project_start: Optional[datetime]
    project_end: Optional[datetime]


# 전방 참조 업데이트
TaskCommentResponse.model_rebuild()
TaskResponse.model_rebuild()
