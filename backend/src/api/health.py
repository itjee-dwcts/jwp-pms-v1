"""
헬스 체크 API Routes

시스템 상태 확인 및 모니터링 엔드포인트
"""

import logging
import platform
from datetime import datetime
from typing import Any, Dict

import psutil
from core.config import settings
from core.database import get_database_health
from fastapi import APIRouter, HTTPException
from schemas.common import HealthCheckResponse, SystemInfoResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    기본 헬스 체크 엔드포인트
    """
    try:
        return HealthCheckResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            uptime_seconds=0,
            details={},
        )
    except Exception as e:
        logger.error("헬스 체크 실패: %s", e)
        raise HTTPException(
            status_code=503, detail="서비스를 사용할 수 없습니다"
        ) from e


@router.get("/health/detailed")
async def detailed_health_check():
    """
    데이터베이스 및 시스템 정보를 포함한 상세 헬스 체크
    """
    health_data: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {},
    }

    try:
        # 데이터베이스 상태 확인
        try:
            db_health = await get_database_health()
            health_data["database"] = db_health
        except Exception as e:
            health_data["database"] = {"status": "error", "error": str(e)}
            health_data["status"] = "degraded"

        # 시스템 정보
        try:
            health_data["system"] = get_system_info()
        except Exception as e:
            health_data["system"] = {"error": str(e)}

        return health_data

    except Exception as e:
        logger.error("상세 헬스 체크 실패: %s", e)
        raise HTTPException(
            status_code=503, detail="서비스를 사용할 수 없습니다"
        ) from e


@router.get("/health/database")
async def database_health_check():
    """
    데이터베이스 전용 헬스 체크
    """
    try:
        db_health = await get_database_health()

        if db_health.get("status") == "healthy":
            return db_health
        else:
            raise HTTPException(status_code=503, detail=db_health)

    except Exception as e:
        logger.error("데이터베이스 헬스 체크 실패: %s", e)
        raise HTTPException(
            status_code=503, detail="데이터베이스를 사용할 수 없습니다"
        ) from e


@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info_endpoint():
    """
    시스템 정보 조회
    """
    try:
        system_info = get_system_info()

        return SystemInfoResponse(
            application={
                "name": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
            },
            system={
                "uptime": system_info.get("uptime", "알 수 없음"),
                "memory": system_info.get("memory", {}),
                "cpu_percent": system_info.get("cpu_percent", 0.0),
                "disk": system_info.get("disk", {}),
            },
            configuration={},
            features={},
        )

    except Exception as e:
        logger.error("시스템 정보 조회 실패: %s", e)
        raise HTTPException(
            status_code=500, detail="시스템 정보를 조회할 수 없습니다"
        ) from e


def get_system_info() -> Dict[str, Any]:
    """
    시스템 정보 조회
    """
    try:
        # CPU 정보
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()

        # 메모리 정보
        memory = psutil.virtual_memory()
        memory_info = {
            "total": memory.total,
            "used": memory.used,
            "available": memory.available,
            "percentage": memory.percent,
        }

        # 디스크 정보
        disk = psutil.disk_usage("/")
        disk_info = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percentage": (disk.used / disk.total) * 100,
        }

        # 시스템 가동 시간
        boot_time = psutil.boot_time()
        uptime_seconds = datetime.now().timestamp() - boot_time
        uptime_str = format_uptime(uptime_seconds)

        return {
            "platform": platform.platform(),
            "architecture": platform.architecture()[0],
            "processor": platform.processor(),
            "python_version": platform.python_version(),
            "cpu_count": cpu_count,
            "cpu_percent": cpu_percent,
            "memory": memory_info,
            "disk": disk_info,
            "uptime": uptime_str,
            "uptime_seconds": uptime_seconds,
        }

    except Exception as e:
        logger.error("시스템 정보 조회 실패: %s", e)
        return {"error": str(e)}


def format_uptime(seconds: float) -> str:
    """
    가동 시간(초)을 사람이 읽기 쉬운 문자열로 변환
    """
    try:
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        minutes = int((seconds % 3600) // 60)

        parts = []
        if days > 0:
            parts.append(f"{days}일")
        if hours > 0:
            parts.append(f"{hours}시간")
        if minutes > 0:
            parts.append(f"{minutes}분")

        if not parts:
            return "1분 미만"

        return ", ".join(parts)

    except Exception:
        return "알 수 없음"


@router.get("/health/readiness")
async def readiness_check():
    """
    Kubernetes readiness probe 엔드포인트
    """
    try:
        # 애플리케이션이 요청을 처리할 준비가 되었는지 확인
        db_health = await get_database_health()

        if db_health.get("status") == "healthy":
            return {
                "status": "ready",
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:
            raise HTTPException(status_code=503, detail="준비되지 않음")

    except Exception as e:
        logger.error("준비 상태 확인 실패: %s", e)
        raise HTTPException(status_code=503, detail="준비되지 않음") from e


@router.get("/health/liveness")
async def liveness_check():
    """
    Kubernetes liveness probe 엔드포인트
    """
    try:
        # 애플리케이션이 살아있는지 기본 확인
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        logger.error("생존 상태 확인 실패: %s", e)
        raise HTTPException(status_code=503, detail="응답하지 않음") from e


@router.get("/metrics")
async def get_metrics():
    """
    기본 메트릭 엔드포인트 (Prometheus 호환 형식 추가 가능)
    """
    try:
        system_info = get_system_info()
        db_health = await get_database_health()

        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_usage_percent": system_info.get("cpu_percent", 0),
                "memory_usage_percent": system_info.get("memory", {}).get(
                    "percentage", 0
                ),
                "disk_usage_percent": system_info.get("disk", {}).get("percentage", 0),
            },
            "database": {
                "status": db_health.get("status", "알 수 없음"),
                "connection_count": db_health.get("performance", {}).get(
                    "active_connections", 0
                ),
            },
            "application": {
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
            },
        }

        return metrics

    except Exception as e:
        logger.error("메트릭 조회 실패: %s", e)
        raise HTTPException(
            status_code=500, detail="메트릭을 조회할 수 없습니다"
        ) from e
