# ============================================================================
# constants/task.py - 작업 관련 상수 정의
# ============================================================================

"""
Task Related Constants

작업(Task) 상태, 우선순위, 타입 등 작업 관련 상수들을 정의합니다.
"""


class TaskStatus:
    """작업 상태 상수"""

    TODO = "todo"  # 시작되지 않은 작업
    IN_PROGRESS = "in_progress"  # 진행 중인 작업
    IN_REVIEW = "in_review"  # 검토 중인 작업
    TESTING = "testing"  # 테스트 단계의 작업
    DONE = "done"  # 완료된 작업
    CLOSED = "closed"  # 종료된 작업
    BLOCKED = "blocked"  # 외부 의존성으로 인해 차단된 작업

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.TODO, "할 일"),
            (cls.IN_PROGRESS, "진행 중"),
            (cls.IN_REVIEW, "검토 중"),
            (cls.TESTING, "테스트 중"),
            (cls.DONE, "완료"),
            (cls.CLOSED, "종료"),
            (cls.BLOCKED, "차단됨"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.TODO,
            cls.IN_PROGRESS,
            cls.IN_REVIEW,
            cls.TESTING,
            cls.DONE,
            cls.CLOSED,
            cls.BLOCKED,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_completed(cls, status: str) -> bool:
        """작업 상태가 완료를 나타내는지 확인"""
        return status in [cls.DONE, cls.CLOSED]

    @classmethod
    def is_incompleted(cls, status: str) -> bool:
        """작업 상태가 미완료를 나타내는지 확인"""
        return status in [
            cls.TODO,
            cls.IN_PROGRESS,
            cls.IN_REVIEW,
            cls.TESTING,
            cls.BLOCKED,
        ]

    @classmethod
    def is_active(cls, status: str) -> bool:
        """작업 상태가 활성 작업을 나타내는지 확인"""
        return status in [
            cls.TODO,
            cls.IN_PROGRESS,
            cls.IN_REVIEW,
            cls.TESTING,
        ]

    @classmethod
    def is_blocked(cls, status: str) -> bool:
        """작업 상태가 차단됨을 나타내는지 확인"""
        return status == cls.BLOCKED

    @classmethod
    def is_review_required(cls, status: str) -> bool:
        """작업 상태가 검토가 필요함을 나타내는지 확인"""
        return status in [
            cls.IN_REVIEW,
            cls.TESTING,
        ]

    @classmethod
    def is_open(cls, status: str) -> bool:
        """작업 상태가 작업 가능함을 나타내는지 확인"""
        return status in [
            cls.TODO,
            cls.IN_PROGRESS,
            cls.IN_REVIEW,
            cls.TESTING,
        ]

    @classmethod
    def is_closed(cls, status: str) -> bool:
        """작업 상태가 종료됨을 나타내는지 확인"""
        return status in [cls.DONE, cls.CLOSED, cls.BLOCKED]

    @classmethod
    def get_next_status(cls, current_status: str) -> str | None:
        """현재 상태를 기반으로 다음 논리적 상태 반환"""
        next_status_map = {
            cls.TODO: cls.IN_PROGRESS,
            cls.IN_PROGRESS: cls.IN_REVIEW,
            cls.IN_REVIEW: cls.TESTING,
            cls.TESTING: cls.DONE,
            cls.DONE: cls.CLOSED,
            cls.CLOSED: None,  # 종료 후에는 다음 상태 없음
            cls.BLOCKED: None,  # 차단된 작업은 진행되지 않음
        }
        return next_status_map.get(current_status, None)

    @classmethod
    def get_incomplete_statuses(cls):
        """미완료를 나타내는 모든 상태 반환"""
        return [
            cls.TODO,
            cls.IN_PROGRESS,
            cls.IN_REVIEW,
            cls.TESTING,
            cls.BLOCKED,
        ]

    @classmethod
    def get_complete_statuses(cls):
        """완료를 나타내는 모든 상태 반환"""
        return [cls.DONE, cls.CLOSED]

    @classmethod
    def get_available_transitions(cls, current_status: str) -> list[str]:
        """현재 상태에서 가능한 전환 상태들 반환"""
        transitions = {
            cls.TODO: [cls.IN_PROGRESS, cls.BLOCKED],
            cls.IN_PROGRESS: [cls.IN_REVIEW, cls.DONE, cls.BLOCKED],
            cls.IN_REVIEW: [cls.IN_PROGRESS, cls.TESTING, cls.DONE],
            cls.TESTING: [cls.IN_PROGRESS, cls.DONE, cls.BLOCKED],
            cls.DONE: [cls.CLOSED, cls.IN_PROGRESS],  # 재오픈 가능
            cls.CLOSED: [cls.TODO],  # 재시작 가능
            cls.BLOCKED: [cls.TODO, cls.IN_PROGRESS],
        }
        return transitions.get(current_status, [])

    @classmethod
    def can_transition_to(cls, from_status: str, to_status: str) -> bool:
        """한 상태에서 다른 상태로 전환 가능한지 확인"""
        available = cls.get_available_transitions(from_status)
        return to_status in available


class TaskPriority:
    """작업 우선순위 상수"""

    LOW = "low"  # 낮은 우선순위
    MEDIUM = "medium"  # 보통 우선순위
    HIGH = "high"  # 높은 우선순위
    CRITICAL = "critical"  # 중요한 우선순위
    BLOCKER = "blocker"  # 차단 우선순위

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.LOW, "낮음"),
            (cls.MEDIUM, "보통"),
            (cls.HIGH, "높음"),
            (cls.CRITICAL, "중요"),
            (cls.BLOCKER, "차단"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.LOW, cls.MEDIUM, cls.HIGH, cls.CRITICAL, cls.BLOCKER]

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
            cls.BLOCKER: 5,
        }
        return weights.get(priority, 0)

    @classmethod
    def is_high_priority(cls, priority: str) -> bool:
        """높은 우선순위인지 확인"""
        return priority in [cls.HIGH, cls.CRITICAL, cls.BLOCKER]

    @classmethod
    def is_urgent(cls, priority: str) -> bool:
        """긴급한 우선순위인지 확인"""
        return priority in [cls.CRITICAL, cls.BLOCKER]

    @classmethod
    def requires_immediate_attention(cls, priority: str) -> bool:
        """즉시 처리가 필요한 우선순위인지 확인"""
        return priority == cls.BLOCKER

    @classmethod
    def get_priority_color(cls, priority: str) -> str:
        """우선순위별 색상 반환"""
        colors = {
            cls.LOW: "green",
            cls.MEDIUM: "blue",
            cls.HIGH: "orange",
            cls.CRITICAL: "red",
            cls.BLOCKER: "purple",
        }
        return colors.get(priority, "gray")

    @classmethod
    def get_sla_hours(cls, priority: str) -> int:
        """우선순위별 SLA 시간 반환"""
        sla_hours = {
            cls.BLOCKER: 1,  # 1시간
            cls.CRITICAL: 4,  # 4시간
            cls.HIGH: 24,  # 1일
            cls.MEDIUM: 72,  # 3일
            cls.LOW: 168,  # 1주일
        }
        return sla_hours.get(priority, 168)


class TaskType:
    """작업 타입 상수"""

    FEATURE = "feature"  # 기능 개발
    BUG = "bug"  # 버그 수정
    IMPROVEMENT = "improvement"  # 개선 또는 향상
    RESEARCH = "research"  # 연구 작업
    DOCUMENTATION = "documentation"  # 문서화 작업
    TESTING = "testing"  # 테스트 작업
    MAINTENANCE = "maintenance"  # 유지보수 작업
    REFACTORING = "refactoring"  # 리팩토링 작업

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.FEATURE, "기능"),
            (cls.BUG, "버그"),
            (cls.IMPROVEMENT, "개선"),
            (cls.RESEARCH, "연구"),
            (cls.DOCUMENTATION, "문서화"),
            (cls.TESTING, "테스트"),
            (cls.MAINTENANCE, "유지보수"),
            (cls.REFACTORING, "리팩토링"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.FEATURE,
            cls.BUG,
            cls.IMPROVEMENT,
            cls.RESEARCH,
            cls.DOCUMENTATION,
            cls.TESTING,
            cls.MAINTENANCE,
            cls.REFACTORING,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_development_task(cls, task_type: str) -> bool:
        """개발 관련 작업인지 확인"""
        return task_type in [cls.FEATURE, cls.BUG, cls.IMPROVEMENT, cls.REFACTORING]

    @classmethod
    def requires_testing(cls, task_type: str) -> bool:
        """테스트가 필요한 작업 타입인지 확인"""
        return task_type in [cls.FEATURE, cls.BUG, cls.IMPROVEMENT]

    @classmethod
    def is_maintenance_task(cls, task_type: str) -> bool:
        """유지보수 관련 작업인지 확인"""
        return task_type in [cls.MAINTENANCE, cls.REFACTORING]

    @classmethod
    def get_type_icon(cls, task_type: str) -> str:
        """작업 타입별 아이콘 반환"""
        icons = {
            cls.FEATURE: "✨",
            cls.BUG: "🐛",
            cls.IMPROVEMENT: "🔧",
            cls.RESEARCH: "🔍",
            cls.DOCUMENTATION: "📝",
            cls.TESTING: "🧪",
            cls.MAINTENANCE: "⚙️",
            cls.REFACTORING: "♻️",
        }
        return icons.get(task_type, "📋")

    @classmethod
    def get_estimated_complexity(cls, task_type: str) -> str:
        """작업 타입별 예상 복잡도 반환"""
        complexity = {
            cls.FEATURE: "medium",
            cls.BUG: "low",
            cls.IMPROVEMENT: "medium",
            cls.RESEARCH: "high",
            cls.DOCUMENTATION: "low",
            cls.TESTING: "low",
            cls.MAINTENANCE: "medium",
            cls.REFACTORING: "high",
        }
        return complexity.get(task_type, "medium")


class TaskComplexity:
    """작업 복잡도 상수"""

    TRIVIAL = "trivial"  # 매우 간단한 작업 (1-2시간)
    SIMPLE = "simple"  # 간단한 작업 (반나절)
    MEDIUM = "medium"  # 보통 작업 (1-2일)
    COMPLEX = "complex"  # 복잡한 작업 (3-5일)
    VERY_COMPLEX = "very_complex"  # 매우 복잡한 작업 (1주 이상)

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.TRIVIAL, "매우 간단"),
            (cls.SIMPLE, "간단"),
            (cls.MEDIUM, "보통"),
            (cls.COMPLEX, "복잡"),
            (cls.VERY_COMPLEX, "매우 복잡"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.TRIVIAL, cls.SIMPLE, cls.MEDIUM, cls.COMPLEX, cls.VERY_COMPLEX]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_story_points(cls, complexity: str) -> int:
        """복잡도별 스토리 포인트 반환"""
        points = {
            cls.TRIVIAL: 1,
            cls.SIMPLE: 2,
            cls.MEDIUM: 5,
            cls.COMPLEX: 8,
            cls.VERY_COMPLEX: 13,
        }
        return points.get(complexity, 5)

    @classmethod
    def get_estimated_hours(cls, complexity: str) -> int:
        """복잡도별 예상 소요 시간 반환 (시간)"""
        hours = {
            cls.TRIVIAL: 2,
            cls.SIMPLE: 4,
            cls.MEDIUM: 16,
            cls.COMPLEX: 32,
            cls.VERY_COMPLEX: 80,
        }
        return hours.get(complexity, 16)


# ============================================================================
# 작업 관련 기본값 및 제한
# ============================================================================

# 기본값
DEFAULT_TASK_STATUS = TaskStatus.TODO
DEFAULT_TASK_PRIORITY = TaskPriority.MEDIUM
DEFAULT_TASK_TYPE = TaskType.FEATURE
DEFAULT_TASK_COMPLEXITY = TaskComplexity.MEDIUM

# 작업 제한
TASK_LIMITS = {
    "max_title_length": 200,
    "max_description_length": 5000,
    "max_assignees": 10,
    "max_subtasks": 50,
    "max_attachments": 20,
    "max_comments": 1000,
    "max_time_logs": 100,
}

# 작업 상태별 색상
STATUS_COLORS = {
    TaskStatus.TODO: "#6B7280",  # 회색
    TaskStatus.IN_PROGRESS: "#3B82F6",  # 파란색
    TaskStatus.IN_REVIEW: "#F59E0B",  # 주황색
    TaskStatus.TESTING: "#8B5CF6",  # 보라색
    TaskStatus.DONE: "#10B981",  # 녹색
    TaskStatus.CLOSED: "#6B7280",  # 회색
    TaskStatus.BLOCKED: "#EF4444",  # 빨간색
}

# 우선순위별 색상
PRIORITY_COLORS = {
    TaskPriority.LOW: "#10B981",  # 녹색
    TaskPriority.MEDIUM: "#3B82F6",  # 파란색
    TaskPriority.HIGH: "#F59E0B",  # 주황색
    TaskPriority.CRITICAL: "#EF4444",  # 빨간색
    TaskPriority.BLOCKER: "#7C3AED",  # 보라색
}

# 작업 타입별 색상
TYPE_COLORS = {
    TaskType.FEATURE: "#10B981",  # 녹색
    TaskType.BUG: "#EF4444",  # 빨간색
    TaskType.IMPROVEMENT: "#3B82F6",  # 파란색
    TaskType.RESEARCH: "#8B5CF6",  # 보라색
    TaskType.DOCUMENTATION: "#6B7280",  # 회색
    TaskType.TESTING: "#F59E0B",  # 주황색
    TaskType.MAINTENANCE: "#84CC16",  # 라임색
    TaskType.REFACTORING: "#06B6D4",  # 시안색
}

# 작업 템플릿
TASK_TEMPLATES = {
    TaskType.FEATURE: {
        "checklist": [
            "요구사항 분석 완료",
            "설계 문서 작성",
            "구현 완료",
            "단위 테스트 작성",
            "통합 테스트 완료",
            "코드 리뷰 완료",
            "문서 업데이트",
        ],
        "default_complexity": TaskComplexity.MEDIUM,
        "requires_review": True,
    },
    TaskType.BUG: {
        "checklist": [
            "버그 재현 확인",
            "원인 분석",
            "수정 완료",
            "테스트 완료",
            "회귀 테스트 완료",
        ],
        "default_complexity": TaskComplexity.SIMPLE,
        "requires_review": True,
    },
    TaskType.DOCUMENTATION: {
        "checklist": [
            "내용 구성",
            "초안 작성",
            "검토 및 수정",
            "최종 승인",
            "배포",
        ],
        "default_complexity": TaskComplexity.SIMPLE,
        "requires_review": True,
    },
}

# 작업 자동화 규칙
AUTOMATION_RULES = {
    "auto_assign_reviewer": True,
    "auto_transition_on_pr": True,
    "auto_close_on_deploy": False,
    "notify_on_status_change": True,
    "escalate_overdue_tasks": True,
    "auto_create_subtasks": False,
}

# 작업 알림 설정
NOTIFICATION_EVENTS = {
    "task_assigned": True,
    "task_updated": True,
    "status_changed": True,
    "priority_changed": True,
    "due_date_approaching": True,
    "task_overdue": True,
    "comment_added": True,
    "mention_in_comment": True,
}

# 작업 메트릭스
METRICS_CONFIG = {
    "track_time_spent": True,
    "track_story_points": True,
    "calculate_velocity": True,
    "burndown_chart": True,
    "cycle_time": True,
    "lead_time": True,
}

# 작업 이메일 템플릿
TASK_EMAIL_TEMPLATES = {
    "task_assigned": "task_assigned.html",
    "task_updated": "task_updated.html",
    "task_completed": "task_completed.html",
    "task_overdue": "task_overdue.html",
    "task_mentioned": "task_mentioned.html",
}

# 작업 상태 전환 권한
STATUS_TRANSITION_PERMISSIONS = {
    TaskStatus.TODO: ["assignee", "creator", "project_manager"],
    TaskStatus.IN_PROGRESS: ["assignee", "project_manager"],
    TaskStatus.IN_REVIEW: ["assignee", "reviewer", "project_manager"],
    TaskStatus.TESTING: ["tester", "project_manager"],
    TaskStatus.DONE: ["assignee", "reviewer", "project_manager"],
    TaskStatus.CLOSED: ["project_manager", "project_owner"],
    TaskStatus.BLOCKED: ["assignee", "project_manager"],
}
