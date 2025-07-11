"""
시스템 서비스

시스템 정보, 상태 확인, 설정 관리 등의 비즈니스 로직을 제공합니다.
"""

import platform
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from core.config import settings


class SystemService:
    """
    시스템 관련 비즈니스 로직을 처리하는 서비스 클래스
    """

    def __init__(self):
        """시스템 서비스 초기화"""
        self._start_time = time.time()
        self._request_count = 0

    def get_system_info(self) -> Dict[str, Any]:
        """
        시스템 및 애플리케이션 정보 조회

        Returns:
            Dict[str, Any]: 시스템 정보
        """
        return {
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
                "processor": platform.processor(),
                "system": platform.system(),
                "release": platform.release(),
            },
            "configuration": {
                "database_configured": bool(settings.DATABASE_URL),
                "cors_enabled": bool(settings.BACKEND_CORS_ORIGINS),
                "upload_path": str(settings.UPLOAD_PATH),
                "max_file_size": f"{settings.MAX_FILE_SIZE / 1024 / 1024:.1f} MB",
                "secret_key_configured": bool(settings.SECRET_KEY),
                "jwt_configured": bool(settings.SECRET_KEY),
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
                "redis_support": bool(getattr(settings, "REDIS_URL", None)),
                "celery_support": bool(getattr(settings, "CELERY_BROKER_URL", None)),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_version_info(self) -> Dict[str, str]:
        """
        애플리케이션 버전 정보 조회

        Returns:
            Dict[str, str]: 버전 정보
        """
        return {
            "version": settings.VERSION,
            "api_version": "v1",
            "build_date": getattr(settings, "BUILD_DATE", "2024-01-01"),
            "commit_hash": getattr(settings, "COMMIT_HASH", "development"),
            "environment": settings.ENVIRONMENT,
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        }

    def get_application_status(self) -> Dict[str, Any]:
        """
        현재 애플리케이션 상태 조회

        Returns:
            Dict[str, Any]: 애플리케이션 상태
        """
        # 중요한 디렉토리 존재 확인
        uploads_dir = Path(settings.UPLOAD_PATH)

        # 업타임 계산
        uptime_seconds = int(time.time() - self._start_time)
        uptime_hours = uptime_seconds // 3600
        uptime_minutes = (uptime_seconds % 3600) // 60
        uptime_str = f"{uptime_hours}시간 {uptime_minutes}분"

        return {
            "status": "running",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "api": "healthy",
                "database": self._check_database_status(),
                "file_system": "healthy" if uploads_dir.exists() else "degraded",
                "upload_directory": "available"
                if uploads_dir.exists() and uploads_dir.is_dir()
                else "unavailable",
            },
            "metrics": {
                "uptime": uptime_str,
                "uptime_seconds": uptime_seconds,
                "total_requests": self._request_count,
                "start_time": datetime.fromtimestamp(self._start_time).isoformat(),
            },
            "resources": {
                "disk_space": self._get_disk_usage(),
                "memory_info": self._get_memory_info(),
            },
        }

    def get_endpoints_info(self) -> Dict[str, Any]:
        """
        사용 가능한 API 엔드포인트 목록 조회

        Returns:
            Dict[str, Any]: 엔드포인트 정보
        """
        return {
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
            "modules": {
                "authentication": f"{settings.API_V1_STR}/auth/*",
                "users": f"{settings.API_V1_STR}/user/*",
                "projects": f"{settings.API_V1_STR}/project/*",
                "tasks": f"{settings.API_V1_STR}/task/*",
                "calendar": f"{settings.API_V1_STR}/calendar/*",
                "dashboard": f"{settings.API_V1_STR}/dashboard/*",
                "chat": f"{settings.API_V1_STR}/chat/*",
                "uploads": f"{settings.API_V1_STR}/uploads/*",
            },
            "future_endpoints": {
                "graphql": "/graphql",
                "websocket": "/ws",
            },
        }

    def increment_request_count(self) -> None:
        """요청 수 증가"""
        self._request_count += 1

    def get_health_summary(self) -> Dict[str, str]:
        """
        간단한 헬스 체크 요약

        Returns:
            Dict[str, str]: 헬스 상태 요약
        """
        uploads_dir = Path(settings.UPLOAD_PATH)

        return {
            "status": "healthy",
            "database": self._check_database_status(),
            "file_system": "ok" if uploads_dir.exists() else "error",
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _check_database_status(self) -> str:
        """
        데이터베이스 연결 상태 확인

        Returns:
            str: 데이터베이스 상태
        """
        try:
            # 실제 구현에서는 데이터베이스 연결 테스트
            if settings.DATABASE_URL:
                return "connected"
            else:
                return "not_configured"
        except Exception:
            return "error"

    def _get_disk_usage(self) -> Dict[str, str]:
        """
        디스크 사용량 정보 조회

        Returns:
            Dict[str, str]: 디스크 사용량 정보
        """
        try:
            import shutil

            total, used, free = shutil.disk_usage(settings.UPLOAD_PATH)

            return {
                "total": f"{total // (1024**3)} GB",
                "used": f"{used // (1024**3)} GB",
                "free": f"{free // (1024**3)} GB",
                "usage_percent": f"{(used / total * 100):.1f}%",
            }
        except Exception:
            return {"status": "unavailable"}

    def _get_memory_info(self) -> Dict[str, str]:
        """
        메모리 사용량 정보 조회

        Returns:
            Dict[str, str]: 메모리 사용량 정보
        """
        try:
            import psutil

            memory = psutil.virtual_memory()

            return {
                "total": f"{memory.total // (1024**2)} MB",
                "available": f"{memory.available // (1024**2)} MB",
                "percent": f"{memory.percent}%",
                "used": f"{memory.used // (1024**2)} MB",
            }
        except ImportError:
            return {"status": "psutil_not_available"}
        except Exception:
            return {"status": "unavailable"}

    def get_environment_info(self) -> Dict[str, Any]:
        """
        환경 설정 정보 조회

        Returns:
            Dict[str, Any]: 환경 정보
        """
        return {
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "timezone": getattr(settings, "TIMEZONE", "UTC"),
            "language": getattr(settings, "LANGUAGE_CODE", "ko-kr"),
            "allowed_hosts": getattr(settings, "ALLOWED_HOSTS", []),
            "cors_origins": bool(settings.BACKEND_CORS_ORIGINS),
            "api_version": settings.API_V1_STR,
        }


# 의존성 주입용 함수
def get_system_service() -> SystemService:
    """
    SystemService 인스턴스를 반환하는 의존성 주입 함수

    Returns:
        SystemService: 시스템 서비스 인스턴스
    """
    return SystemService()
