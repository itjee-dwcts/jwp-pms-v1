# ============================================================================
# constants/user.py - 사용자 관련 상수 정의
# ============================================================================

"""
User Related Constants

사용자, 역할, 권한 관련 상수들을 정의합니다.
"""


class UserRole:
    """사용자 역할 상수"""

    ADMIN = "admin"  # 모든 권한을 가진 관리자
    MANAGER = "manager"  # 프로젝트나 팀 관리자
    DEVELOPER = "developer"  # 개발자
    TESTER = "tester"  # 테스터
    GUEST = "guest"  # 제한된 접근 권한을 가진 게스트
    CONTRIBUTOR = "contributor"  # 콘텐츠 기여자
    VIEWER = "viewer"  # 읽기 전용 사용자

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ADMIN, "관리자"),
            (cls.MANAGER, "매니저"),
            (cls.DEVELOPER, "개발자"),
            (cls.TESTER, "테스터"),
            (cls.GUEST, "게스트"),
            (cls.CONTRIBUTOR, "기여자"),
            (cls.VIEWER, "뷰어"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.ADMIN,
            cls.MANAGER,
            cls.DEVELOPER,
            cls.TESTER,
            cls.GUEST,
            cls.CONTRIBUTOR,
            cls.VIEWER,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_admin(cls, role: str) -> bool:
        """관리자 역할인지 확인"""
        return role == cls.ADMIN

    @classmethod
    def is_manager_or_above(cls, role: str) -> bool:
        """매니저 이상의 역할인지 확인"""
        return role in [cls.ADMIN, cls.MANAGER]

    @classmethod
    def can_manage_projects(cls, role: str) -> bool:
        """프로젝트 관리 권한이 있는지 확인"""
        return role in [cls.ADMIN, cls.MANAGER]

    @classmethod
    def can_assign_tasks(cls, role: str) -> bool:
        """작업 할당 권한이 있는지 확인"""
        return role in [cls.ADMIN, cls.MANAGER]

    @classmethod
    def can_delete_content(cls, role: str) -> bool:
        """콘텐츠 삭제 권한이 있는지 확인"""
        return role in [cls.ADMIN, cls.MANAGER]

    @classmethod
    def get_hierarchy_level(cls, role: str) -> int:
        """역할의 계층 수준 반환 (높을수록 권한이 많음)"""
        hierarchy = {
            cls.GUEST: 1,
            cls.VIEWER: 2,
            cls.CONTRIBUTOR: 3,
            cls.TESTER: 4,
            cls.DEVELOPER: 5,
            cls.MANAGER: 6,
            cls.ADMIN: 7,
        }
        return hierarchy.get(role, 0)


class UserStatus:
    """사용자 상태 상수"""

    ACTIVE = "active"  # 활성 사용자 계정
    INACTIVE = "inactive"  # 비활성 사용자 계정
    SUSPENDED = "suspended"  # 일시 정지된 사용자 계정
    PENDING = "pending"  # 활성화 또는 승인 대기 중인 계정

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ACTIVE, "활성"),
            (cls.INACTIVE, "비활성"),
            (cls.SUSPENDED, "일시정지"),
            (cls.PENDING, "대기중"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.ACTIVE, cls.INACTIVE, cls.SUSPENDED, cls.PENDING]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_active(cls, status: str) -> bool:
        """활성 상태인지 확인"""
        return status == cls.ACTIVE

    @classmethod
    def can_login(cls, status: str) -> bool:
        """로그인 가능한 상태인지 확인"""
        return status == cls.ACTIVE

    @classmethod
    def is_suspended(cls, status: str) -> bool:
        """일시 정지 상태인지 확인"""
        return status == cls.SUSPENDED

    @classmethod
    def needs_activation(cls, status: str) -> bool:
        """활성화가 필요한 상태인지 확인"""
        return status in [cls.INACTIVE, cls.PENDING]


class Permission:
    """권한 상수"""

    READ = "read"  # 읽기 권한
    WRITE = "write"  # 쓰기 권한
    DELETE = "delete"  # 삭제 권한
    ADMIN = "admin"  # 관리자 권한

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.READ, "읽기"),
            (cls.WRITE, "쓰기"),
            (cls.DELETE, "삭제"),
            (cls.ADMIN, "관리자"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.READ, cls.WRITE, cls.DELETE, cls.ADMIN]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def get_permission_level(cls, permission: str) -> int:
        """권한 수준 반환 (높을수록 강한 권한)"""
        levels = {
            cls.READ: 1,
            cls.WRITE: 2,
            cls.DELETE: 3,
            cls.ADMIN: 4,
        }
        return levels.get(permission, 0)

    @classmethod
    def has_permission(cls, user_permission: str, required_permission: str) -> bool:
        """사용자가 요구되는 권한을 가지고 있는지 확인"""
        return cls.get_permission_level(user_permission) >= cls.get_permission_level(
            required_permission
        )


class AccessLevel:
    """접근 수준 상수"""

    PUBLIC = "public"  # 공개 접근
    PRIVATE = "private"  # 비공개 접근
    TEAM = "team"  # 팀 접근
    ORGANIZATION = "organization"  # 조직 접근

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.PUBLIC, "공개"),
            (cls.PRIVATE, "비공개"),
            (cls.TEAM, "팀"),
            (cls.ORGANIZATION, "조직"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [cls.PUBLIC, cls.PRIVATE, cls.TEAM, cls.ORGANIZATION]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_public(cls, access_level: str) -> bool:
        """공개 접근인지 확인"""
        return access_level == cls.PUBLIC

    @classmethod
    def is_restricted(cls, access_level: str) -> bool:
        """접근 제한이 있는지 확인"""
        return access_level != cls.PUBLIC


class TokenType:
    """토큰 타입 상수"""

    ACCESS = "access"
    REFRESH = "refresh"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"

    @classmethod
    def choices(cls):
        """선택 가능한 모든 항목을 튜플 리스트로 반환"""
        return [
            (cls.ACCESS, "액세스"),
            (cls.REFRESH, "리프레시"),
            (cls.PASSWORD_RESET, "비밀번호 재설정"),
            (cls.EMAIL_VERIFICATION, "이메일 인증"),
        ]

    @classmethod
    def values(cls):
        """모든 가능한 값을 리스트로 반환"""
        return [
            cls.ACCESS,
            cls.REFRESH,
            cls.PASSWORD_RESET,
            cls.EMAIL_VERIFICATION,
        ]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        """값이 유효한지 확인"""
        return value in cls.values()

    @classmethod
    def is_auth_token(cls, token_type: str) -> bool:
        """인증 토큰인지 확인"""
        return token_type in [cls.ACCESS, cls.REFRESH]

    @classmethod
    def is_verification_token(cls, token_type: str) -> bool:
        """검증 토큰인지 확인"""
        return token_type in [cls.PASSWORD_RESET, cls.EMAIL_VERIFICATION]


# ============================================================================
# 사용자 관련 기본값 및 제한
# ============================================================================

# 기본값
DEFAULT_USER_ROLE = UserRole.DEVELOPER
DEFAULT_USER_STATUS = UserStatus.PENDING

# 시스템 사용자
SYSTEM_USER_ID = 1  # 자동화된 작업을 위한 시스템 사용자
ADMIN_USER_ID = 2  # 기본 관리자 사용자

# 이메일 템플릿
EMAIL_TEMPLATES = {
    "welcome": "welcome.html",
    "password_reset": "password_reset.html",
    "email_verification": "email_verification.html",
    "user_invitation": "user_invitation.html",
}

# 토큰 만료 시간 (초)
TOKEN_EXPIRY = {
    TokenType.ACCESS: 3600,  # 1시간
    TokenType.REFRESH: 2592000,  # 30일
    TokenType.PASSWORD_RESET: 1800,  # 30분
    TokenType.EMAIL_VERIFICATION: 86400,  # 24시간
}

# 비밀번호 정책
PASSWORD_POLICY = {
    "min_length": 8,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_numbers": True,
    "require_special_chars": True,
    "max_length": 128,
}

# API 요청 제한
USER_RATE_LIMITS = {
    "login": "5/minute",
    "password_reset": "3/hour",
    "email_verification": "3/hour",
    "profile_update": "10/minute",
}

# 사용자 세션 설정
SESSION_SETTINGS = {
    "max_concurrent_sessions": 5,
    "session_timeout": 3600,  # 1시간
    "remember_me_duration": 2592000,  # 30일
}

# 사용자 프로필 제한
PROFILE_LIMITS = {
    "max_name_length": 100,
    "max_bio_length": 500,
    "max_avatar_size": 2 * 1024 * 1024,  # 2MB
    "allowed_avatar_formats": [".jpg", ".jpeg", ".png", ".gif"],
}

# 지원되는 시간대
DEFAULT_TIMEZONE = "UTC"
SUPPORTED_TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
]
