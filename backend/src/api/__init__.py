"""
API Routes Package

FastAPI routes and GraphQL endpoints.
"""

from .auth import router as auth_router
from .calendar import router as calendar_router
from .dashboard import router as dashboard_router
from .health import router as health_router
from .project import router as project_router
from .system import router as system_router
from .task import router as task_router
from .uploads import router as uploads_router
from .user import router as user_router

__all__ = [
    "auth_router",
    "calendar_router",
    "dashboard_router",
    "uploads_router",
    "user_router",
    "project_router",
    "task_router",
    "health_router",
    "system_router",
]
