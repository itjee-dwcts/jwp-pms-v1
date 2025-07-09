"""
API 라우터 패키지

FastAPI 라우터와 GraphQL 엔드포인트를 제공합니다.
각 모듈별 라우터를 중앙에서 관리하고 임포트를 단순화합니다.
"""

import logging
from typing import List

from fastapi import APIRouter

# 개별 라우터 imports
try:
    from .auth import router as auth_router
except ImportError:
    auth_router = APIRouter()

try:
    from .calendar import router as calendar_router
except ImportError:
    calendar_router = APIRouter()

try:
    from .chat import router as chat_router
except ImportError:
    chat_router = APIRouter()

try:
    from .dashboard import router as dashboard_router
except ImportError:
    dashboard_router = APIRouter()

try:
    from .health import router as health_router
except ImportError:
    health_router = APIRouter()

try:
    from .project import router as project_router
except ImportError:
    project_router = APIRouter()

try:
    from .system import router as system_router
except ImportError:
    system_router = APIRouter()

try:
    from .task import router as task_router
except ImportError:
    task_router = APIRouter()

try:
    from .uploads import router as uploads_router
except ImportError:
    uploads_router = APIRouter()

try:
    from .user import router as user_router
except ImportError:
    user_router = APIRouter()


def get_all_routers() -> List[tuple[str, APIRouter, str]]:
    """
    모든 라우터를 반환하는 함수

    Returns:
        List[tuple[str, APIRouter, str]]: (라우터명, 라우터객체, 태그) 튜플 리스트
    """
    return [
        ("auth", auth_router, "인증"),
        ("calendar", calendar_router, "캘린더"),
        ("chat", chat_router, "채팅"),
        ("dashboard", dashboard_router, "대시보드"),
        ("health", health_router, "상태확인"),
        ("project", project_router, "프로젝트"),
        ("system", system_router, "시스템"),
        ("task", task_router, "작업"),
        ("uploads", uploads_router, "파일업로드"),
        ("user", user_router, "사용자"),
    ]


def register_routers(app, api_prefix: str = "/api/v1"):
    """
    FastAPI 앱에 모든 라우터를 등록하는 함수

    Args:
        app: FastAPI 애플리케이션 인스턴스
        api_prefix: API 경로 접두사 (기본값: "/api/v1")
    """
    routers = get_all_routers()

    for name, router, tag in routers:
        if name in ["health", "system"]:
            # 기본 경로에 등록
            app.include_router(router, prefix=api_prefix, tags=[tag])
        else:
            # 하위 경로에 등록
            app.include_router(router, prefix=f"{api_prefix}/{name}", tags=[tag])


# 모든 라우터를 외부에서 import할 수 있도록 정의
__all__ = [
    "auth_router",
    "calendar_router",
    "chat_router",
    "dashboard_router",
    "health_router",
    "project_router",
    "system_router",
    "task_router",
    "uploads_router",
    "user_router",
    "get_all_routers",
    "register_routers",
]


# 패키지 정보
__version__ = "1.0.0"
__author__ = "PMS 개발팀"
__description__ = "PMS Backend API 라우터 패키지"

# 라우터 상태 정보
ROUTER_STATUS = {
    "auth": "사용자 인증 및 권한 관리",
    "calendar": "캘린더 및 이벤트 관리",
    "chat": "OpenAI 채팅 및 AI 상호작용",
    "dashboard": "대시보드 및 통계",
    "health": "시스템 상태 확인",
    "project": "프로젝트 관리",
    "system": "시스템 설정 및 관리",
    "task": "작업 및 할일 관리",
    "uploads": "파일 업로드 및 관리",
    "user": "사용자 프로필 관리",
}


def get_router_info() -> dict:
    """
    라우터 정보를 반환하는 함수

    Returns:
        dict: 라우터별 상태 및 설명 정보
    """
    return {
        "total_routers": len(__all__) - 2,  # 함수 2개 제외
        "routers": ROUTER_STATUS,
        "version": __version__,
        "description": __description__,
    }


# 로깅용 함수
def log_router_status():
    """
    라우터 로드 상태를 로깅하는 함수
    """

    logger = logging.getLogger(__name__)

    try:
        loaded_routers = []
        failed_routers = []

        for name, _ in ROUTER_STATUS.items():
            router_var = f"{name}_router"
            if router_var in globals():
                router = globals()[router_var]
                if hasattr(router, "routes") and router.routes:
                    loaded_routers.append(name)
                else:
                    failed_routers.append(name)

        logger.info("✅ 로드된 라우터: %s", loaded_routers)
        if failed_routers:
            logger.warning("⚠️ 빈 라우터: %s", failed_routers)

        logger.info(
            "📊 라우터 로드 상태: %d/%d", len(loaded_routers), len(ROUTER_STATUS)
        )

    except ImportError as e:
        logger.error("❌ 라우터 상태 확인 실패: %s", e)


# 패키지 import 시 자동으로 상태 로깅
if __name__ != "__main__":
    try:
        log_router_status()
    except Exception:
        # 로깅 실패 시 무시 (silent fail)
        pass
