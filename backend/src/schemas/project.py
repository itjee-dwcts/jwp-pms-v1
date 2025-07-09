"""
프로젝트 Pydantic 스키마

프로젝트 관리를 위한 요청/응답 스키마
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from constants.project import ProjectMemberRole, ProjectPriority, ProjectStatus
from schemas.user import UserPublic


class ProjectBase(BaseModel):
    """기본 프로젝트 스키마"""

    name: str = Field(..., min_length=1, max_length=200, description="프로젝트 이름")
    description: Optional[str] = Field(
        None, max_length=2000, description="프로젝트 설명"
    )
    status: str = Field(default=ProjectStatus.PLANNING, description="프로젝트 상태")
    priority: str = Field(
        default=ProjectPriority.MEDIUM, description="프로젝트 우선순위"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """프로젝트 상태 검증"""

        # 정의된 상수 중 하나인지 확인
        valid_statuses = [
            ProjectStatus.PLANNING,
            ProjectStatus.ACTIVE,
            ProjectStatus.ON_HOLD,
            ProjectStatus.COMPLETED,
            ProjectStatus.CANCELLED,
        ]

        # 제공된 상태가 유효한지 확인
        if v not in valid_statuses:
            raise ValueError(
                f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
            )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v) -> str:
        """프로젝트 우선순위 검증"""

        # 정의된 상수 중 하나인지 확인
        valid_priorities = [
            ProjectPriority.LOW,
            ProjectPriority.MEDIUM,
            ProjectPriority.HIGH,
            ProjectPriority.CRITICAL,
        ]
        if v not in valid_priorities:
            raise ValueError(
                f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
            )
        return v


class ProjectCreateRequest(ProjectBase):
    """프로젝트 생성 스키마"""

    start_date: Optional[datetime] = Field(None, description="프로젝트 시작일")
    end_date: Optional[datetime] = Field(None, description="프로젝트 종료일")
    budget: Optional[Decimal] = Field(None, ge=0, description="프로젝트 예산")
    repository_url: Optional[str] = Field(
        None, max_length=500, description="Git 저장소 URL"
    )
    documentation_url: Optional[str] = Field(
        None, max_length=500, description="문서 URL"
    )
    tags: Optional[str] = Field(
        None, max_length=500, description="프로젝트 태그 (쉼표로 구분)"
    )
    is_public: bool = Field(default=False, description="프로젝트 공개 여부")

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: Optional[datetime], values) -> Optional[datetime]:
        """종료일이 시작일 이후인지 검증"""
        if (
            v
            and "start_date" in values
            and values["start_date"]
            and v < values["start_date"]
        ):
            raise ValueError("종료일은 시작일 이후여야 합니다")
        return v


class ProjectUpdateRequest(BaseModel):
    """프로젝트 업데이트 스키마"""

    name: Optional[str] = Field(
        None, min_length=1, max_length=200, description="프로젝트 이름"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="프로젝트 설명"
    )
    status: Optional[str] = Field(None, description="프로젝트 상태")
    priority: Optional[str] = Field(None, description="프로젝트 우선순위")
    start_date: Optional[datetime] = Field(None, description="프로젝트 시작일")
    end_date: Optional[datetime] = Field(None, description="프로젝트 종료일")
    budget: Optional[Decimal] = Field(None, ge=0, description="프로젝트 예산")
    actual_cost: Optional[Decimal] = Field(None, ge=0, description="실제 비용")
    progress: Optional[int] = Field(None, ge=0, le=100, description="진행률 (0-100%)")
    repository_url: Optional[str] = Field(
        None, max_length=500, description="Git 저장소 URL"
    )
    documentation_url: Optional[str] = Field(
        None, max_length=500, description="문서 URL"
    )
    tags: Optional[str] = Field(
        None, max_length=500, description="프로젝트 태그 (쉼표로 구분)"
    )
    is_public: Optional[bool] = Field(None, description="프로젝트 공개 여부")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """프로젝트 상태 검증"""
        # 정의된 상수 중 하나인지 확인
        if v is not None:
            valid_statuses = [
                ProjectStatus.PLANNING,
                ProjectStatus.ACTIVE,
                ProjectStatus.ON_HOLD,
                ProjectStatus.COMPLETED,
                ProjectStatus.CANCELLED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        """프로젝트 우선순위 검증"""
        # 정의된 상수 중 하나인지 확인
        if v is not None:
            valid_priorities = [
                ProjectPriority.LOW,
                ProjectPriority.MEDIUM,
                ProjectPriority.HIGH,
                ProjectPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
                )
        return v


class ProjectMemberBase(BaseModel):
    """기본 프로젝트 멤버 스키마"""

    user_id: int = Field(..., description="사용자 ID")
    role: str = Field(default="developer", description="멤버 역할")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        """프로젝트 멤버 역할 검증"""
        # 정의된 상수 중 하나인지 확인
        valid_roles = [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
            ProjectMemberRole.DEVELOPER,
            ProjectMemberRole.TESTER,
            ProjectMemberRole.VIEWER,
        ]
        if v not in valid_roles:
            raise ValueError(
                f"역할은 다음 중 하나여야 합니다: {', '.join(valid_roles)}"
            )
        return v


class ProjectMemberCreateRequest(ProjectMemberBase):
    """프로젝트 멤버 추가 스키마"""

    pass


class ProjectMemberUpdateRequest(BaseModel):
    """프로젝트 멤버 업데이트 스키마"""

    role: str = Field(..., description="멤버 역할")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        """프로젝트 멤버 역할 검증"""
        # 정의된 상수 중 하나인지 확인
        valid_roles = [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
            ProjectMemberRole.DEVELOPER,
            ProjectMemberRole.TESTER,
            ProjectMemberRole.VIEWER,
        ]
        if v not in valid_roles:
            raise ValueError(
                f"역할은 다음 중 하나여야 합니다: {', '.join(valid_roles)}"
            )
        return v


class ProjectMemberResponse(BaseModel):
    """프로젝트 멤버 응답 스키마"""

    id: int
    project_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserPublic

    class Config:
        """ProjectMemberResponse 설정"""

        from_attributes = True


class ProjectCommentBase(BaseModel):
    """기본 프로젝트 댓글 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class ProjectCommentCreateRequest(ProjectCommentBase):
    """프로젝트 댓글 생성 스키마"""

    parent_id: Optional[int] = Field(None, description="답글을 위한 부모 댓글 ID")


class ProjectCommentUpdateRequest(BaseModel):
    """프로젝트 댓글 업데이트 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class ProjectCommentResponse(BaseModel):
    """프로젝트 댓글 응답 스키마"""

    id: int
    project_id: int
    author_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: datetime
    author: UserPublic
    replies: List["ProjectCommentResponse"] = []

    class Config:
        """ProjectCommentResponse 설정"""

        from_attributes = True


class ProjectAttachmentResponse(BaseModel):
    """프로젝트 첨부파일 응답 스키마"""

    id: int
    project_id: int
    file_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: int
    created_at: datetime
    uploader: UserPublic

    class Config:
        """ProjectAttachmentResponse 설정"""

        from_attributes = True


class ProjectResponse(ProjectBase):
    """프로젝트 응답 스키마"""

    id: int
    owner_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    progress: int = 0
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    tags: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    updated_at: datetime
    owner: UserPublic
    members: List[ProjectMemberResponse] = []
    comments: List[ProjectCommentResponse] = []
    attachments: List[ProjectAttachmentResponse] = []

    class Config:
        """ProjectResponse 설정"""

        from_attributes = True


class ProjectListResponse(BaseModel):
    """프로젝트 목록 응답 스키마"""

    projects: List[ProjectResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int


class ProjectStatsResponse(BaseModel):
    """프로젝트 통계 스키마"""

    total_projects: int
    active_projects: int
    completed_projects: int
    projects_by_status: dict
    projects_by_priority: dict
    average_progress: float


class ProjectSearchRequest(BaseModel):
    """프로젝트 검색 요청 스키마"""

    search_text: Optional[str] = Field(None, description="검색 쿼리")
    project_status: Optional[str] = Field(None, description="프로젝트 상태")
    priority: Optional[str] = Field(None, description="우선순위")
    owner_id: Optional[int] = Field(None, description="소유자 ID")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    start_date_from: Optional[datetime] = Field(None, description="시작일 범위 시작")
    start_date_to: Optional[datetime] = Field(None, description="시작일 범위 끝")
    end_date_from: Optional[datetime] = Field(None, description="종료일 범위 시작")
    end_date_to: Optional[datetime] = Field(None, description="종료일 범위 끝")
    is_public: Optional[bool] = Field(None, description="공개 여부")

    @field_validator("project_status")
    @classmethod
    def validate_status(cls, v):
        """프로젝트 상태 검증"""
        # 정의된 상수 중 하나인지 확인
        if v is not None:
            valid_statuses = [
                ProjectStatus.PLANNING,
                ProjectStatus.ACTIVE,
                ProjectStatus.ON_HOLD,
                ProjectStatus.COMPLETED,
                ProjectStatus.CANCELLED,
            ]
            if v not in valid_statuses:
                raise ValueError(
                    f"상태는 다음 중 하나여야 합니다: {', '.join(valid_statuses)}"
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        """프로젝트 우선순위 검증"""
        # 정의된 상수 중 하나인지 확인
        if v is not None:
            valid_priorities = [
                ProjectPriority.LOW,
                ProjectPriority.MEDIUM,
                ProjectPriority.HIGH,
                ProjectPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f"우선순위는 다음 중 하나여야 합니다: {', '.join(valid_priorities)}"
                )
        return v


class ProjectDashboardResponse(BaseModel):
    """프로젝트 대시보드 응답 스키마"""

    total_projects: int
    active_projects: int
    completed_projects: int
    overdue_projects: int
    recent_projects: List[ProjectResponse]
    my_projects: List[ProjectResponse]
    project_progress_stats: dict
    upcoming_deadlines: List[ProjectResponse]


# 전방 참조 업데이트
ProjectCommentResponse.model_rebuild()
