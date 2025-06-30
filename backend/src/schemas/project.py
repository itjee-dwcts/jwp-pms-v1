"""
Project Pydantic Schemas

Request/Response schemas for project management.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from core.constants import ProjectMemberRole, ProjectPriority, ProjectStatus
from pydantic import BaseModel, Field, field_validator
from schemas.user import UserPublic


class ProjectBase(BaseModel):
    """Base project schema"""

    name: str = Field(
        ..., min_length=1, max_length=200, description="Project name"
    )
    description: Optional[str] = Field(
        None, max_length=2000, description="Project description"
    )
    status: str = Field(
        default=ProjectStatus.PLANNING, description="Project status"
    )
    priority: str = Field(
        default=ProjectPriority.MEDIUM, description="Project priority"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate project status"""

        # Ensure status is one of the defined constants
        valid_statuses = [
            ProjectStatus.PLANNING,
            ProjectStatus.ACTIVE,
            ProjectStatus.ON_HOLD,
            ProjectStatus.COMPLETED,
            ProjectStatus.CANCELLED,
        ]

        # Check if the provided status is valid
        if v not in valid_statuses:
            raise ValueError(
                f'Status must be one of: {", ".join(valid_statuses)}'
            )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v) -> str:
        """Validate project priority"""

        # Ensure priority is one of the defined constants
        valid_priorities = [
            ProjectPriority.LOW,
            ProjectPriority.MEDIUM,
            ProjectPriority.HIGH,
            ProjectPriority.CRITICAL,
        ]
        if v not in valid_priorities:
            raise ValueError(
                f'Priority must be one of: {", ".join(valid_priorities)}'
            )
        return v


class ProjectCreateRequest(ProjectBase):
    """Schema for creating a project"""

    start_date: Optional[datetime] = Field(
        None, description="Project start date"
    )
    end_date: Optional[datetime] = Field(None, description="Project end date")
    budget: Optional[Decimal] = Field(None, ge=0, description="Project budget")
    repository_url: Optional[str] = Field(
        None, max_length=500, description="Git repository URL"
    )
    documentation_url: Optional[str] = Field(
        None, max_length=500, description="Documentation URL"
    )
    tags: Optional[str] = Field(
        None, max_length=500, description="Project tags (comma-separated)"
    )
    is_public: bool = Field(
        default=False, description="Whether the project is public"
    )

    @field_validator("end_date")
    @classmethod
    def validate_end_date(
        cls, v: Optional[datetime], values
    ) -> Optional[datetime]:
        """Validate end date is after start date if both are provided"""
        if (
            v
            and "start_date" in values
            and values["start_date"]
            and v < values["start_date"]
        ):
            raise ValueError("End date must be after start date")
        return v


class ProjectUpdateRequest(BaseModel):
    """Schema for updating a project"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    actual_cost: Optional[Decimal] = Field(None, ge=0)
    progress: Optional[int] = Field(None, ge=0, le=100)
    repository_url: Optional[str] = Field(None, max_length=500)
    documentation_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate project status"""
        # Ensure status is one of the defined constants
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
                    f'Status must be one of: {", ".join(valid_statuses)}'
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        """Validate project priority"""
        # Ensure priority is one of the defined constants
        if v is not None:
            valid_priorities = [
                ProjectPriority.LOW,
                ProjectPriority.MEDIUM,
                ProjectPriority.HIGH,
                ProjectPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f'Priority must be one of: {", ".join(valid_priorities)}'
                )
        return v


class ProjectMemberBase(BaseModel):
    """Base project member schema"""

    user_id: int = Field(..., description="User ID")
    role: str = Field(default="developer", description="Member role")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        """Validate project member role"""
        # Ensure role is one of the defined constants
        valid_roles = [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
            ProjectMemberRole.DEVELOPER,
            ProjectMemberRole.TESTER,
            ProjectMemberRole.VIEWER,
        ]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class ProjectMemberCreateRequest(ProjectMemberBase):
    """Schema for adding project member"""


class ProjectMemberUpdateRequest(BaseModel):
    """Schema for updating project member"""

    role: str = Field(..., description="Member role")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        """Validate project member role"""
        # Ensure role is one of the defined constants
        valid_roles = [
            ProjectMemberRole.OWNER,
            ProjectMemberRole.MANAGER,
            ProjectMemberRole.DEVELOPER,
            ProjectMemberRole.TESTER,
            ProjectMemberRole.VIEWER,
        ]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class ProjectMemberResponse(BaseModel):
    """Schema for project member response"""

    id: int
    project_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserPublic

    class Config:
        """Configuration for ProjectMemberResponse"""

        from_attributes = True


class ProjectCommentBase(BaseModel):
    """Base project comment schema"""

    content: str = Field(
        ..., min_length=1, max_length=2000, description="Comment content"
    )


class ProjectCommentCreateRequest(ProjectCommentBase):
    """Schema for creating project comment"""

    parent_id: Optional[int] = Field(
        None, description="Parent comment ID for replies"
    )


class ProjectCommentUpdateRequest(BaseModel):
    """Schema for updating project comment"""

    content: str = Field(
        ..., min_length=1, max_length=2000, description="Comment content"
    )


class ProjectCommentResponse(BaseModel):
    """Schema for project comment response"""

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
        """Configuration for ProjectCommentResponse"""

        from_attributes = True


class ProjectAttachmentResponse(BaseModel):
    """Schema for project attachment response"""

    id: int
    project_id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: int
    created_at: datetime
    uploader: UserPublic

    class Config:
        """Configuration for ProjectAttachmentResponse"""

        from_attributes = True


class ProjectResponse(ProjectBase):
    """Schema for project response"""

    id: int
    creator_id: int
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
    creator: UserPublic
    members: List[ProjectMemberResponse] = []
    comments: List[ProjectCommentResponse] = []
    attachments: List[ProjectAttachmentResponse] = []

    class Config:
        """Configuration for ProjectResponse"""

        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for project list response"""

    projects: List[ProjectResponse]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int


class ProjectStatsResponse(BaseModel):
    """Schema for project statistics"""

    total_projects: int
    active_projects: int
    completed_projects: int
    projects_by_status: dict
    projects_by_priority: dict
    average_progress: float


class ProjectSearchRequest(BaseModel):
    """Schema for project search request"""

    search_text: Optional[str] = Field(None, description="Search query")
    project_status: Optional[str] = None
    priority: Optional[str] = None
    creator_id: Optional[int] = None
    tags: Optional[List[str]] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    end_date_from: Optional[datetime] = None
    end_date_to: Optional[datetime] = None
    is_public: Optional[bool] = None

    @field_validator("project_status")
    @classmethod
    def validate_status(cls, v):
        """Validate project status"""
        # Ensure status is one of the defined constants
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
                    f'Status must be one of: {", ".join(valid_statuses)}'
                )
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        """Validate project priority"""
        # Ensure priority is one of the defined constants
        if v is not None:
            valid_priorities = [
                ProjectPriority.LOW,
                ProjectPriority.MEDIUM,
                ProjectPriority.HIGH,
                ProjectPriority.CRITICAL,
            ]
            if v not in valid_priorities:
                raise ValueError(
                    f'Priority must be one of: {", ".join(valid_priorities)}'
                )
        return v


class ProjectDashboardResponse(BaseModel):
    """Schema for project dashboard response"""

    total_projects: int
    active_projects: int
    completed_projects: int
    overdue_projects: int
    recent_projects: List[ProjectResponse]
    my_projects: List[ProjectResponse]
    project_progress_stats: dict
    upcoming_deadlines: List[ProjectResponse]


# Update forward references
ProjectCommentResponse.model_rebuild()
