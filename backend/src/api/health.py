"""
Health Check API Routes

System health and monitoring endpoints.
"""

import logging
import platform
from datetime import datetime
from typing import Any, Dict

import psutil
from core.config import settings
from core.database import get_async_session, get_database_health
from fastapi import APIRouter, Depends, HTTPException
from schemas.common import HealthCheckResponse, SystemInfoResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Basic health check endpoint
    """
    try:
        return HealthCheckResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            details={},
        )
    except Exception as e:
        logger.error("Health check failed: %s", e)
        raise HTTPException(status_code=503, detail="Service unavailable") from e


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_async_session)):
    """
    Detailed health check with database and system information
    """
    health_data: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {},
    }

    try:
        # Database health
        try:
            db_health = await get_database_health()
            health_data["database"] = db_health
        except Exception as e:  # pylint: disable=broad-except
            health_data["database"] = {"status": "error", "error": str(e)}
            health_data["status"] = "degraded"

        # System information
        try:
            health_data["system"] = get_system_info()
        except Exception as e:  # pylint: disable=broad-except
            health_data["system"] = {"error": str(e)}

        return health_data

    except Exception as e:
        logger.error("Detailed health check failed: %s", e)
        raise HTTPException(status_code=503, detail="Service unavailable") from e


@router.get("/health/database")
async def database_health_check():
    """
    Database-specific health check
    """
    try:
        db_health = await get_database_health()

        if db_health.get("status") == "healthy":
            return db_health
        else:
            raise HTTPException(status_code=503, detail=db_health)

    except Exception as e:
        logger.error("Database health check failed: %s", e)
        raise HTTPException(status_code=503, detail="Database unavailable") from e


@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info_endpoint():
    """
    Get system information
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
                "uptime": system_info.get("uptime", "unknown"),
                "memory": system_info.get("memory", {}),
                "cpu_percent": system_info.get("cpu_percent", 0.0),
                "disk": system_info.get("disk", {}),
            },
            configuration={},
            features={},
        )

    except Exception as e:
        logger.error("System info retrieval failed: %s", e)
        raise HTTPException(
            status_code=500, detail="Failed to retrieve system information"
        ) from e


def get_system_info() -> Dict[str, Any]:
    """
    Get system information
    """
    try:
        # CPU information
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()

        # Memory information
        memory = psutil.virtual_memory()
        memory_info = {
            "total": memory.total,
            "used": memory.used,
            "available": memory.available,
            "percentage": memory.percent,
        }

        # Disk information
        disk = psutil.disk_usage("/")
        disk_info = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percentage": (disk.used / disk.total) * 100,
        }

        # System uptime
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

    except Exception as e:  # pylint: disable=broad-except
        logger.error("Failed to get system info: %s", e)
        return {"error": str(e)}


def format_uptime(seconds: float) -> str:
    """
    Format uptime seconds into human-readable string
    """
    try:
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        minutes = int((seconds % 3600) // 60)

        parts = []
        if days > 0:
            parts.append(f"{days} day{'s' if days != 1 else ''}")
        if hours > 0:
            parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
        if minutes > 0:
            parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

        if not parts:
            return "less than a minute"

        return ", ".join(parts)

    except Exception:  # pylint: disable=broad-except
        return "unknown"


@router.get("/health/readiness")
async def readiness_check():
    """
    Kubernetes readiness probe endpoint
    """
    try:
        # Check if the application is ready to serve requests
        db_health = await get_database_health()

        if db_health.get("status") == "healthy":
            return {
                "status": "ready",
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:
            raise HTTPException(status_code=503, detail="Not ready")

    except Exception as e:
        logger.error("Readiness check failed: %s", e)
        raise HTTPException(status_code=503, detail="Not ready") from e


@router.get("/health/liveness")
async def liveness_check():
    """
    Kubernetes liveness probe endpoint
    """
    try:
        # Basic check to see if the application is alive
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        logger.error("Liveness check failed: %s", e)
        raise HTTPException(status_code=503, detail="Not alive") from e


@router.get("/metrics")
async def get_metrics():
    """
    Basic metrics endpoint (Prometheus-compatible format could be added)
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
                "status": db_health.get("status", "unknown"),
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
        logger.error("Metrics retrieval failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics") from e
