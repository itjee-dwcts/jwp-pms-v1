"""
Logging Configuration

Structured logging setup for the application.
"""

import logging
import logging.config
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from core.config import settings
from structlog.stdlib import LoggerFactory


def setup_logging():
    """
    Setup structured logging configuration
    """
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            (
                structlog.processors.JSONRenderer()
                if settings.ENVIRONMENT == "production"
                else structlog.dev.ConsoleRenderer(colors=True)
            ),
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Logging configuration
    config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "simple": {
                "format": "%(levelname)s - %(message)s",
            },
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.LOG_LEVEL,
                "formatter": "detailed" if settings.DEBUG else "simple",
                "stream": sys.stdout,
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "detailed",
                "filename": "logs/pms.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": "logs/pms_errors.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "security_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "WARNING",
                "formatter": "detailed",
                "filename": "logs/security.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "encoding": "utf8",
            },
            "audit_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "detailed",
                "filename": "logs/audit.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,
                "encoding": "utf8",
            },
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console", "file", "error_file"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["console", "error_file"],
                "level": "ERROR",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "sqlalchemy": {
                "handlers": ["console", "file"],
                "level": "WARNING",
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "handlers": ["console", "file"],
                "level": "WARNING",
                "propagate": False,
            },
            "alembic": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "fastapi": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "security": {
                "handlers": ["console", "security_file"],
                "level": "WARNING",
                "propagate": False,
            },
            "audit": {
                "handlers": ["console", "audit_file"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }

    # Apply logging configuration
    logging.config.dictConfig(config)

    # Set third-party loggers to appropriate levels
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured - Level: {settings.LOG_LEVEL}, "
        f"Environment: {settings.ENVIRONMENT}"
    )


class SecurityLogger:
    """
    Security-focused logger for authentication and authorization events
    """

    def __init__(self):
        self.logger = logging.getLogger("security")

    def log_login_attempt(
        self, username: str, success: bool, ip_address: Optional[str] = None
    ):
        """Log login attempt"""
        if success:
            self.logger.info(
                f"Successful login - Username: {username}, IP: {ip_address}"
            )
        else:
            self.logger.warning(
                f"Failed login attempt - Username: {username}, IP: {ip_address}"
            )

    def log_logout(self, username: str, ip_address: str = None):
        """Log logout event"""
        self.logger.info(f"User logout - Username: {username}, IP: {ip_address}")

    def log_password_change(self, username: str, ip_address: str = None):
        """Log password change"""
        self.logger.info(f"Password changed - Username: {username}, IP: {ip_address}")

    def log_permission_denied(self, username: str, resource: str, action: str):
        """Log permission denied events"""
        self.logger.warning(
            f"Permission denied - Username: {username}, "
            f"Resource: {resource}, Action: {action}"
        )

    def log_suspicious_activity(self, description: str, username: str = None):
        """Log suspicious activity"""
        self.logger.error(f"Suspicious activity - {description}, Username: {username}")


class AuditLogger:
    """
    Audit logger for business operations
    """

    def __init__(self):
        self.logger = logging.getLogger("audit")

    def log_action(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: str,
        details: dict = None,
    ):
        """Log user action"""
        log_data = {
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "user_id": user_id,
            "details": details or {},
        }
        self.logger.info(f"User action - {log_data}")

    def log_data_access(self, user_id: str, resource: str, access_type: str):
        """Log data access"""
        self.logger.info(
            f"Data access - User: {user_id}, Resource: {resource}, "
            f"Type: {access_type}"
        )

    def log_system_event(self, event: str, details: dict = None):
        """Log system events"""
        self.logger.info(f"System event - {event}, Details: {details or {}}")


# Global logger instances
security_logger = SecurityLogger()
audit_logger = AuditLogger()


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name
    """
    return logging.getLogger(name)


def log_performance(func):
    """
    Decorator to log function performance
    """
    import time
    from functools import wraps

    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        logger = get_logger(func.__module__)

        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.debug(
                f"Function {func.__name__} executed in {execution_time:.4f} seconds"
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"Function {func.__name__} failed after {execution_time:.4f} seconds: {e}"
            )
            raise

    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        logger = get_logger(func.__module__)

        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.debug(
                f"Function {func.__name__} executed in {execution_time:.4f} seconds"
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"Function {func.__name__} failed after {execution_time:.4f} seconds: {e}"
            )
            raise

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def configure_uvicorn_logging():
    """
    Configure uvicorn logging to integrate with our logging setup
    """
    # Disable uvicorn's default logging configuration
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)

    # Remove default handlers
    for handler in uvicorn_logger.handlers[:]:
        uvicorn_logger.removeHandler(handler)

    # Add our handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    uvicorn_logger.addHandler(console_handler)


# Custom filter for sensitive data
class SensitiveDataFilter(logging.Filter):
    """
    Filter to remove sensitive data from logs
    """

    SENSITIVE_FIELDS = [
        "password",
        "token",
        "secret",
        "key",
        "authorization",
        "cookie",
        "session",
    ]

    def filter(self, record):
        if hasattr(record, "getMessage"):
            message = record.getMessage()
            for field in self.SENSITIVE_FIELDS:
                if field in message.lower():
                    # Replace sensitive data with asterisks
                    import re

                    pattern = rf"({field}['\"]?\s*[:=]\s*['\"]?)([^'\",\s]+)"
                    message = re.sub(pattern, r"\1***", message, flags=re.IGNORECASE)
                    record.msg = message
        return True


def add_sensitive_data_filter():
    """
    Add sensitive data filter to all handlers
    """
    sensitive_filter = SensitiveDataFilter()
    root_logger = logging.getLogger()

    for handler in root_logger.handlers:
        handler.addFilter(sensitive_filter)


import asyncio
