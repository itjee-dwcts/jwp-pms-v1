# ============================================================================
# constants/project.py - 프로젝트 관련 상수 정의
# ============================================================================

"""
Project Related Constants

프로젝트, 프로젝트 상태, 우선순위, 멤버 역할 등 프로젝트 관련 상수들을 정의합니다.
"""


class ProjectStatus:
    """프로젝트 상태 상수"""

    PLANNING = "planning"  # 계획 단계의 프로젝트
    ACTIVE = "active"  # 진행 중인 프로젝트
    ON_HOLD = "on_hold"  # 일시 중단된 프로젝트
    COMPLETED = "completed"  # 성공적으로 완료된 프로젝트
    CANCELLED = "cancelled"  # 취소된 프로젝트
    ARCHIVED = "archived"  # 보관된 프로젝트

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.PLANNING, "계획중"),
            (cls.ACTIVE, "진행중"),
            (cls.ON_HOLD, "보류"),
            (cls.COMPLETED, "완료"),
            (cls.CANCELLED, "취소"),
            (cls.ARCHIVED, "보관됨"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.PLANNING,
            cls.ACTIVE,
            cls.ON_HOLD,
            cls.COMPLETED,
            cls.CANCELLED,
            cls.ARCHIVED,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_active(cls, status: str) -> bool:
        """프로젝트가 활성 상태인지 확인"""
        return status == cls.ACTIVE

    @classmethod
    def is_completed(cls, status: str) -> bool:
        """프로젝트가 완료된 상태인지 확인"""
        return status in [cls.COMPLETED, cls.CANCELLED]

    @classmethod
    def is_in_progress(cls, status: str) -> bool:
        """프로젝트가 진행 중인지 확인"""
        return status in [cls.PLANNING, cls.ACTIVE, cls.ON_HOLD]

    @classmethod
    def can_add_tasks(cls, status: str) -> bool:
        """작업을 추가할 수 있는 상태인지 확인"""
        return status in [cls.PLANNING, cls.ACTIVE]

    @classmethod
    def can_modify(cls, status: str) -> bool:
        """프로젝트를 수정할 수 있는 상태인지 확인"""
        return status not in [cls.COMPLETED, cls.CANCELLED, cls.ARCHIVED]

    @classmethod
    def get_next_status(cls, current_status: str) -> str | None:
        """현재 상태에서 다음 논리적 상태 반환"""
        next_status_map = {
            cls.PLANNING: cls.ACTIVE,
            cls.ACTIVE: cls.COMPLETED,
            cls.ON_HOLD: cls.ACTIVE,
            cls.COMPLETED: cls.ARCHIVED,
            cls.CANCELLED: cls.ARCHIVED,
            cls.ARCHIVED: None,  # 보관된 후에는 다음 상태 없음
        }
        return next_status_map.get(current_status, None)

    @classmethod
    def get_available_transitions(cls, current_status: str) -> list[str]:
        """현재 상태에서 가능한 전환 상태들 반환"""
        transitions = {
            cls.PLANNING: [cls.ACTIVE, cls.ON_HOLD, cls.CANCELLED],
            cls.ACTIVE: [cls.ON_HOLD, cls.COMPLETED, cls.CANCELLED],
            cls.ON_HOLD: [cls.ACTIVE, cls.CANCELLED],
            cls.COMPLETED: [cls.ARCHIVED],
            cls.CANCELLED: [cls.ARCHIVED],
            cls.ARCHIVED: [],  # 보관된 후에는 상태 변경 불가
        }
        return transitions.get(current_status, [])


class ProjectPriority:
    """프로젝트 우선순위 상수"""

    LOW = "low"  # 낮은 우선순위
    MEDIUM = "medium"  # 보통 우선순위
    HIGH = "high"  # 높은 우선순위
    CRITICAL = "critical"  # 중요한 우선순위

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.LOW, "낮음"),
            (cls.MEDIUM, "보통"),
            (cls.HIGH, "높음"),
            (cls.CRITICAL, "중요"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.LOW, cls.MEDIUM, cls.HIGH, cls.CRITICAL]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_priority_weight(cls, priority: str) -> int:
        """우선순위의 가중치 반환 (높을수록 우선순위가 높음)"""
        weights = {
            cls.LOW: 1,
            cls.MEDIUM: 2,
            cls.HIGH: 3,
            cls.CRITICAL: 4,
        }
        return weights.get(priority, 0)

    @classmethod
    def is_high_priority(cls, priority: str) -> bool:
        """높은 우선순위인지 확인"""
        return priority in [cls.HIGH, cls.CRITICAL]

    @classmethod
    def is_critical(cls, priority: str) -> bool:
        """중요한 우선순위인지 확인"""
        return priority == cls.CRITICAL

    @classmethod
    def get_priority_color(cls, priority: str) -> str:
        """우선순위별 색상 반환"""
        colors = {
            cls.LOW: "green",
            cls.MEDIUM: "blue",
            cls.HIGH: "orange",
            cls.CRITICAL: "red",
        }
        return colors.get(priority, "gray")


class ProjectMemberRole:
    """프로젝트 멤버 역할 상수"""

    OWNER = "owner"  # 모든 권한을 가진 프로젝트 소유자
    MANAGER = "manager"  # 관리 권한을 가진 프로젝트 매니저
    DEVELOPER = "developer"  # 표준 권한을 가진 개발자
    TESTER = "tester"  # 테스트 권한을 가진 테스터
    VIEWER = "viewer"  # 읽기 전용 권한을 가진 뷰어

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.OWNER, "소유자"),
            (cls.MANAGER, "매니저"),
            (cls.DEVELOPER, "개발자"),
            (cls.TESTER, "테스터"),
            (cls.VIEWER, "뷰어"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.OWNER, cls.MANAGER, cls.DEVELOPER, cls.TESTER, cls.VIEWER]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def can_manage_project(cls, role: str) -> bool:
        """프로젝트 관리 권한이 있는지 확인"""
        return role in [cls.OWNER, cls.MANAGER]

    @classmethod
    def can_assign_tasks(cls, role: str) -> bool:
        """작업 할당 권한이 있는지 확인"""
        return role in [cls.OWNER, cls.MANAGER]

    @classmethod
    def can_delete_project(cls, role: str) -> bool:
        """프로젝트 삭제 권한이 있는지 확인"""
        return role == cls.OWNER

    @classmethod
    def can_add_members(cls, role: str) -> bool:
        """멤버 추가 권한이 있는지 확인"""
        return role in [cls.OWNER, cls.MANAGER]

    @classmethod
    def can_modify_tasks(cls, role: str) -> bool:
        """작업 수정 권한이 있는지 확인"""
        return role in [cls.OWNER, cls.MANAGER, cls.DEVELOPER]

    @classmethod
    def can_view_project(cls, role: str) -> bool:
        """프로젝트 조회 권한이 있는지 확인"""
        return role in cls.values()  # 모든 역할이 조회 가능

    @classmethod
    def get_role_hierarchy(cls, role: str) -> int:
        """역할의 계층 수준 반환 (높을수록 권한이 많음)"""
        hierarchy = {
            cls.VIEWER: 1,
            cls.TESTER: 2,
            cls.DEVELOPER: 3,
            cls.MANAGER: 4,
            cls.OWNER: 5,
        }
        return hierarchy.get(role, 0)

    @classmethod
    def can_change_role(cls, current_role: str, target_role: str) -> bool:
        """현재 역할에서 대상 역할로 변경할 수 있는지 확인"""
        # 소유자만 다른 멤버의 역할을 변경할 수 있음
        return current_role == cls.OWNER and target_role != cls.OWNER


class ProjectType:
    """프로젝트 타입 상수"""

    SOFTWARE = "software"  # 소프트웨어 개발 프로젝트
    MARKETING = "marketing"  # 마케팅 프로젝트
    RESEARCH = "research"  # 연구 프로젝트
    DESIGN = "design"  # 디자인 프로젝트
    INTERNAL = "internal"  # 내부 프로젝트
    CLIENT = "client"  # 고객 프로젝트
    OTHER = "other"  # 기타 프로젝트

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.SOFTWARE, "소프트웨어"),
            (cls.MARKETING, "마케팅"),
            (cls.RESEARCH, "연구"),
            (cls.DESIGN, "디자인"),
            (cls.INTERNAL, "내부"),
            (cls.CLIENT, "고객"),
            (cls.OTHER, "기타"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.SOFTWARE,
            cls.MARKETING,
            cls.RESEARCH,
            cls.DESIGN,
            cls.INTERNAL,
            cls.CLIENT,
            cls.OTHER,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()


class ProjectVisibility:
    """프로젝트 가시성 상수"""

    PUBLIC = "public"  # 공개 프로젝트
    PRIVATE = "private"  # 비공개 프로젝트
    INTERNAL = "internal"  # 조직 내부 프로젝트

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.PUBLIC, "공개"),
            (cls.PRIVATE, "비공개"),
            (cls.INTERNAL, "내부"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.PUBLIC, cls.PRIVATE, cls.INTERNAL]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_public(cls, visibility: str) -> bool:
        """공개 프로젝트인지 확인"""
        return visibility == cls.PUBLIC

    @classmethod
    def is_restricted(cls, visibility: str) -> bool:
        """접근 제한이 있는 프로젝트인지 확인"""
        return visibility in [cls.PRIVATE, cls.INTERNAL]


# ============================================================================
# 프로젝트 관련 기본값 및 제한
# ============================================================================

# 기본값
DEFAULT_PROJECT_STATUS = ProjectStatus.PLANNING
DEFAULT_PROJECT_PRIORITY = ProjectPriority.MEDIUM
DEFAULT_PROJECT_TYPE = ProjectType.SOFTWARE
DEFAULT_PROJECT_VISIBILITY = ProjectVisibility.PRIVATE

# 프로젝트 제한
PROJECT_LIMITS = {
    "max_name_length": 200,
    "max_description_length": 2000,
    "max_members": 100,
    "max_tasks": 1000,
    "max_attachments": 50,
    "max_attachment_size": 50 * 1024 * 1024,  # 50MB
}

# 프로젝트 멤버 제한
MEMBER_LIMITS = {
    "max_owners": 3,  # 최대 소유자 수
    "max_managers": 10,  # 최대 매니저 수
    "min_members": 1,  # 최소 멤버 수 (소유자 포함)
}

# 프로젝트 템플릿
PROJECT_TEMPLATES = {
    ProjectType.SOFTWARE: {
        "default_tasks": [
            "요구사항 분석",
            "설계 및 아키텍처",
            "개발",
            "테스트",
            "배포",
        ],
        "default_milestones": [
            "프로젝트 시작",
            "설계 완료",
            "개발 완료",
            "테스트 완료",
            "프로젝트 완료",
        ],
    },
    ProjectType.MARKETING: {
        "default_tasks": [
            "시장 조사",
            "캠페인 기획",
            "콘텐츠 제작",
            "캠페인 실행",
            "결과 분석",
        ],
        "default_milestones": [
            "기획 완료",
            "콘텐츠 제작 완료",
            "캠페인 시작",
            "캠페인 완료",
        ],
    },
    ProjectType.RESEARCH: {
        "default_tasks": [
            "문헌 조사",
            "연구 설계",
            "데이터 수집",
            "데이터 분석",
            "결과 정리",
        ],
        "default_milestones": [
            "연구 계획 완료",
            "데이터 수집 완료",
            "분석 완료",
            "보고서 완료",
        ],
    },
}

# 프로젝트 알림 설정
NOTIFICATION_SETTINGS = {
    "project_created": True,
    "project_updated": True,
    "member_added": True,
    "member_removed": True,
    "status_changed": True,
    "deadline_approaching": True,
    "task_assigned": True,
}

# 프로젝트 백업 설정
BACKUP_SETTINGS = {
    "auto_backup": True,
    "backup_interval": "daily",  # daily, weekly, monthly
    "retention_period": 90,  # 90일
    "backup_include_files": True,
}

# 프로젝트 권한 매트릭스
PERMISSION_MATRIX = {
    ProjectMemberRole.OWNER: {
        "view_project": True,
        "edit_project": True,
        "delete_project": True,
        "manage_members": True,
        "assign_tasks": True,
        "create_tasks": True,
        "edit_tasks": True,
        "delete_tasks": True,
        "manage_settings": True,
        "view_analytics": True,
    },
    ProjectMemberRole.MANAGER: {
        "view_project": True,
        "edit_project": True,
        "delete_project": False,
        "manage_members": True,
        "assign_tasks": True,
        "create_tasks": True,
        "edit_tasks": True,
        "delete_tasks": True,
        "manage_settings": False,
        "view_analytics": True,
    },
    ProjectMemberRole.DEVELOPER: {
        "view_project": True,
        "edit_project": False,
        "delete_project": False,
        "manage_members": False,
        "assign_tasks": False,
        "create_tasks": True,
        "edit_tasks": True,
        "delete_tasks": False,
        "manage_settings": False,
        "view_analytics": False,
    },
    ProjectMemberRole.TESTER: {
        "view_project": True,
        "edit_project": False,
        "delete_project": False,
        "manage_members": False,
        "assign_tasks": False,
        "create_tasks": True,
        "edit_tasks": True,
        "delete_tasks": False,
        "manage_settings": False,
        "view_analytics": False,
    },
    ProjectMemberRole.VIEWER: {
        "view_project": True,
        "edit_project": False,
        "delete_project": False,
        "manage_members": False,
        "assign_tasks": False,
        "create_tasks": False,
        "edit_tasks": False,
        "delete_tasks": False,
        "manage_settings": False,
        "view_analytics": False,
    },
}

# 프로젝트 색상 테마
PROJECT_COLORS = {
    ProjectPriority.LOW: "#10B981",  # 녹색
    ProjectPriority.MEDIUM: "#3B82F6",  # 파란색
    ProjectPriority.HIGH: "#F59E0B",  # 주황색
    ProjectPriority.CRITICAL: "#EF4444",  # 빨간색
}

STATUS_COLORS = {
    ProjectStatus.PLANNING: "#6B7280",  # 회색
    ProjectStatus.ACTIVE: "#10B981",  # 녹색
    ProjectStatus.ON_HOLD: "#F59E0B",  # 주황색
    ProjectStatus.COMPLETED: "#3B82F6",  # 파란색
    ProjectStatus.CANCELLED: "#EF4444",  # 빨간색
    ProjectStatus.ARCHIVED: "#9CA3AF",  # 연한 회색
}

# 프로젝트 진행률 계산 기준
PROGRESS_CALCULATION = {
    "method": "task_based",  # task_based, milestone_based, time_based
    "include_subtasks": True,
    "weight_by_priority": False,
    "exclude_cancelled_tasks": True,
}

# 프로젝트 이메일 템플릿
PROJECT_EMAIL_TEMPLATES = {
    "project_created": "project_created.html",
    "member_invited": "project_member_invited.html",
    "status_changed": "project_status_changed.html",
    "deadline_reminder": "project_deadline_reminder.html",
    "project_completed": "project_completed.html",
}
