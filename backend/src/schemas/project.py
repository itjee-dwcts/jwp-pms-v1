"""
프로젝트 Pydantic 스키마

프로젝트 관리를 위한 요청/응답 스키마
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

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
    tags: Optional[List[str]] = Field(
        None, max_length=500, description="프로젝트 태그 (배열)"
    )
    is_public: bool = Field(default=False, description="프로젝트 공개 여부")
    owner_id: Optional[UUID] = Field(None, description="프로젝트 소유자 ID")

    @field_validator("start_date", mode="before")
    @classmethod
    def parse_start_date(cls, v):
        """시작일 문자열을 datetime으로 변환"""
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v

    @field_validator("end_date", mode="before")
    @classmethod
    def parse_end_date(cls, v):
        """종료일 문자열을 datetime으로 변환"""
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: Optional[datetime], values) -> Optional[datetime]:
        """종료일이 시작일 이후인지 검증"""
        # print("[DEBUG] validate_end_date values:", values)
        # print("[DEBUG] validate_end_date values.data:", values.data)
        # print("[DEBUG] validate_end_date value:", v)
        if (
            v
            and "start_date" in values.data
            and values.data["start_date"]
            and v < values.data["start_date"]
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
    tags: Optional[List[str]] = Field(
        None, max_length=500, description="프로젝트 태그 (배열)"
    )
    is_public: Optional[bool] = Field(None, description="프로젝트 공개 여부")
    owner_id: Optional[UUID] = Field(None, description="프로젝트 소유자 ID")

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

    member_id: UUID = Field(..., description="멤버 ID")
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

    id: UUID
    project_id: UUID
    member_id: UUID
    role: str
    joined_at: datetime
    member: UserPublic

    class Config:
        """ProjectMemberResponse 설정"""

        from_attributes = True


class ProjectCommentBase(BaseModel):
    """기본 프로젝트 댓글 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class ProjectCommentCreateRequest(ProjectCommentBase):
    """프로젝트 댓글 생성 스키마"""

    parent_id: Optional[UUID] = Field(None, description="답글을 위한 부모 댓글 ID")


class ProjectCommentUpdateRequest(BaseModel):
    """프로젝트 댓글 업데이트 스키마"""

    content: str = Field(..., min_length=1, max_length=2000, description="댓글 내용")


class ProjectCommentResponse(BaseModel):
    """프로젝트 댓글 응답 스키마"""

    id: UUID
    project_id: UUID
    author_id: UUID
    parent_id: Optional[UUID] = None
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

    id: UUID
    created_at: datetime
    created_by: UUID
    updated_at: datetime
    updated_by: UUID
    project_id: UUID
    file_name: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    description: Optional[str] = None

    class Config:
        """ProjectAttachmentResponse 설정"""

        from_attributes = True


class ProjectResponse(ProjectBase):
    """프로젝트 응답 스키마"""

    id: UUID
    owner_id: UUID
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    progress: int = 0
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    owner: UserPublic
    members: List[ProjectMemberResponse] = []
    comments: List[ProjectCommentResponse] = []
    attachments: List[ProjectAttachmentResponse] = []

    @field_validator("tags")
    @classmethod
    def serialize_tags(cls, tags):
        """태그를 문자열로 변환"""
        if isinstance(tags, str):
            return [tag.strip() for tag in tags.split(",") if tag.strip()]
        return tags

    class Config:
        """ProjectResponse 설정"""

        from_attributes = True


class ProjectListResponse(BaseModel):
    """프로젝트 목록 응답 스키마"""

    projects: List[ProjectResponse] = Field(..., description="프로젝트 목록")
    page_no: int = Field(..., ge=0, description="현재 페이지 번호")
    page_size: int = Field(..., ge=1, le=100, description="페이지 크기")
    total_pages: int = Field(..., ge=0, description="전체 페이지 수")
    total_items: int = Field(..., ge=0, description="전체 항목 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

    @classmethod
    def create_response(
        cls,
        projects: List[ProjectResponse],
        page_no: int,
        page_size: int,
        total_items: int,
    ) -> "ProjectListResponse":
        """ProjectListResponse 생성 헬퍼 메서드"""
        total_pages = (
            (total_items + page_size - 1) // page_size if total_items > 0 else 0
        )
        has_next = page_no < total_pages - 1 if total_pages > 0 else False
        has_prev = page_no > 0

        return cls(
            projects=projects,
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
        json_schema_extra = {
            "example": {
                "projects": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "name": "웹 애플리케이션 개발",
                        "description": "새로운 웹 애플리케이션 프로젝트",
                        "status": "active",
                        "priority": "high",
                        "owner_id": "123e4567-e89b-12d3-a456-426614174001",
                        "progress": 65,
                        "is_public": False,
                        "created_at": "2025-07-13T10:00:00Z",
                        "updated_at": "2025-07-13T10:00:00Z",
                        "owner": {
                            "id": "123e4567-e89b-12d3-a456-426614174001",
                            "username": "project_owner",
                            "email": "owner@example.com",
                            "full_name": "프로젝트 소유자",
                        },
                        "members": [],
                        "comments": [],
                        "attachments": [],
                    }
                ],
                "page_no": 0,
                "page_size": 20,
                "total_pages": 5,
                "total_items": 100,
                "has_next": True,
                "has_previous": False,
            }
        }


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
    owner_id: Optional[UUID] = Field(None, description="소유자 ID")
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
