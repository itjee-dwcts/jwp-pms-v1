"""
시스템 정보 API Routes

시스템 및 애플리케이션 정보 엔드포인트
"""

import platform
import sys
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from core.config import settings

router = APIRouter()


@router.get("/info")
async def system_info():
    """
    시스템 및 애플리케이션 정보 조회
    """
    return JSONResponse(
        {
            "application": {
                "name": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "debug": settings.DEBUG,
                "api_version": "v1",
            },
            "system": {
                "platform": platform.platform(),
                "python_version": sys.version,
                "architecture": platform.architecture()[0],
                "hostname": platform.node(),
            },
            "configuration": {
                "database_configured": bool(settings.DATABASE_URL),
                "cors_enabled": bool(settings.BACKEND_CORS_ORIGINS),
                "upload_path": settings.UPLOAD_PATH,
                "max_file_size": (f"{settings.MAX_FILE_SIZE / 1024 / 1024:.1f} MB"),
            },
            "features": {
                "user_management": True,
                "project_management": True,
                "task_management": True,
                "calendar_management": True,
                "file_upload": True,
                "oauth_support": bool(
                    settings.GOOGLE_CLIENT_ID or settings.GITHUB_CLIENT_ID
                ),
                "email_support": bool(settings.SMTP_HOST),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


@router.get("/version")
async def version_info():
    """
    애플리케이션 버전 정보 조회
    """
    return JSONResponse(
        {
            "version": settings.VERSION,
            "api_version": "v1",
            "build_date": "2024-01-01",  # 빌드 시 설정 가능
            "commit_hash": "development",  # 빌드 시 설정 가능
            "environment": settings.ENVIRONMENT,
        }
    )


@router.get("/status")
async def application_status():
    """
    현재 애플리케이션 상태 조회
    """
    # 중요한 디렉토리가 존재하는지 확인
    uploads_dir = Path(settings.UPLOAD_PATH)

    status = {
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "healthy",
            "database": "checking...",  # 헬스 체크에 의해 업데이트됨
            "file_system": "healthy" if uploads_dir.exists() else "degraded",
        },
        "metrics": {
            "uptime": "방금 시작됨",  # 향후 개선 가능
            "total_requests": "N/A",  # 미들웨어로 향후 개선 가능
            "active_connections": "N/A",  # 향후 개선 가능
        },
    }

    return JSONResponse(status)


@router.get("/endpoints")
async def list_endpoints():
    """
    사용 가능한 API 엔드포인트 목록 조회
    """
    endpoints = {
        "documentation": {
            "swagger_ui": "/docs" if settings.DEBUG else "비활성화됨",
            "redoc": "/redoc" if settings.DEBUG else "비활성화됨",
            "openapi_spec": (
                f"{settings.API_V1_STR}/openapi.json"
                if settings.DEBUG
                else "비활성화됨"
            ),
        },
        "health": {
            "basic": "/health",
            "detailed": f"{settings.API_V1_STR}/health/detailed",
            "readiness": f"{settings.API_V1_STR}/health/ready",
            "liveness": f"{settings.API_V1_STR}/health/live",
        },
        "system": {
            "info": f"{settings.API_V1_STR}/info",
            "version": f"{settings.API_V1_STR}/version",
            "status": f"{settings.API_V1_STR}/status",
            "endpoints": f"{settings.API_V1_STR}/endpoints",
        },
        "api": {
            "root": "/",
            "api_root": settings.API_V1_STR,
            "uploads": "/uploads",
        },
        "future_endpoints": {
            "authentication": f"{settings.API_V1_STR}/auth/*",
            "users": f"{settings.API_V1_STR}/users/*",
            "projects": f"{settings.API_V1_STR}/projects/*",
            "tasks": f"{settings.API_V1_STR}/tasks/*",
            "calendar": f"{settings.API_V1_STR}/calendar/*",
            "graphql": "/graphql",
        },
    }

    return JSONResponse(endpoints)
