"""
비즈니스 로직 서비스 패키지

비즈니스 로직과 데이터 처리를 포함하는 서비스 계층입니다.
각 도메인별 서비스 클래스와 의존성 주입 함수를 제공합니다.
"""

# 인증 서비스
# try:
#     from .auth import AuthService, get_auth_service
# except ImportError:
#     AuthService = None
#     get_auth_service = None

# 캘린더 서비스
try:
    from .calendar import CalendarService, get_calendar_service
except ImportError:
    CalendarService = None
    get_calendar_service = None

# 채팅 서비스
try:
    from .chat import ChatService, get_chat_service
except ImportError:
    ChatService = None
    get_chat_service = None

# 대시보드 서비스
try:
    from .dashboard import DashboardService, get_dashboard_service
except ImportError:
    DashboardService = None
    get_dashboard_service = None

# 파일 서비스
try:
    from .file import FileService, get_file_service
except ImportError:
    FileService = None
    get_file_service = None

# 프로젝트 서비스
try:
    from .project import ProjectService, get_project_service
except ImportError:
    ProjectService = None
    get_project_service = None

# 시스템 서비스
try:
    from .system import SystemService, get_system_service
except ImportError:
    SystemService = None
    get_system_service = None

# 작업 서비스
try:
    from .task import TaskService, get_task_service
except ImportError:
    TaskService = None
    get_task_service = None

# 업로드 서비스
try:
    from .upload import UploadService, get_upload_service
except ImportError:
    UploadService = None
    get_upload_service = None

# 사용자 서비스
try:
    from .user import UserService, get_user_service
except ImportError:
    UserService = None
    get_user_service = None

__all__ = [
    # 인증 서비스
    # "AuthService",
    # "get_auth_service",
    # 캘린더 서비스
    "CalendarService",
    "get_calendar_service",
    # 채팅 서비스
    "ChatService",
    "get_chat_service",
    # 대시보드 서비스
    "DashboardService",
    "get_dashboard_service",
    # 파일 서비스
    "FileService",
    "get_file_service",
    # 프로젝트 서비스
    "ProjectService",
    "get_project_service",
    # 시스템 서비스
    "SystemService",
    "get_system_service",
    # 작업 서비스
    "TaskService",
    "get_task_service",
    # 업로드 서비스
    "UploadService",
    "get_upload_service",
    # 사용자 서비스
    "UserService",
    "get_user_service",
]

# 서비스 가용성 상태
SERVICE_STATUS = {
    # "auth": AuthService is not None,
    "calendar": CalendarService is not None,
    "chat": ChatService is not None,
    "dashboard": DashboardService is not None,
    "file": FileService is not None,
    "project": ProjectService is not None,
    "system": SystemService is not None,
    "task": TaskService is not None,
    "upload": UploadService is not None,
    "user": UserService is not None,
}


def get_available_services():
    """
    사용 가능한 서비스 목록을 반환합니다.

    Returns:
        dict: 서비스명과 가용성 상태
    """
    return {name: status for name, status in SERVICE_STATUS.items() if status}


def get_service_count():
    """
    로드된 서비스 개수를 반환합니다.

    Returns:
        tuple: (로드된 서비스 수, 전체 서비스 수)
    """
    loaded = sum(1 for status in SERVICE_STATUS.values() if status)
    total = len(SERVICE_STATUS)
    return loaded, total
