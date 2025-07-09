"""
로깅 설정

애플리케이션을 위한 구조화된 로깅 설정
"""

import asyncio
import logging
import logging.config
import re
import sys
import time
from functools import wraps
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from core.config import get_settings
from structlog.stdlib import LoggerFactory

settings = get_settings()


def setup_logging():
    """
    구조화된 로깅 설정 초기화
    """
    # logs 디렉토리가 존재하지 않으면 생성
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # structlog 설정
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

    # 로깅 설정 (설정값 사용)
    config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "detailed": {
                "format": ("%(asctime)s - %(name)s - %(levelname)s - %(message)s"),
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
                "filename": settings.LOG_FILE_PATH,  # 설정값 사용
                "maxBytes": settings.LOG_MAX_BYTES,  # 설정값 사용
                "backupCount": settings.LOG_BACKUP_COUNT,  # 설정값 사용
                "encoding": "utf8",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": settings.LOG_ERROR_FILE_PATH,  # 설정값 사용
                "maxBytes": settings.LOG_MAX_BYTES,
                "backupCount": settings.LOG_BACKUP_COUNT,
                "encoding": "utf8",
            },
            "security_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "WARNING",
                "formatter": "detailed",
                "filename": settings.LOG_SECURITY_FILE_PATH,  # 설정값 사용
                "maxBytes": settings.LOG_MAX_BYTES,
                "backupCount": 10,
                "encoding": "utf8",
            },
            "audit_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "detailed",
                "filename": settings.LOG_AUDIT_FILE_PATH,  # 설정값 사용
                "maxBytes": settings.LOG_MAX_BYTES,
                "backupCount": 10,
                "encoding": "utf8",
            },
        },
        "loggers": {
            "": {  # 루트 로거
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

    # 로깅 설정 적용
    logging.config.dictConfig(config)

    # 서드파티 로거들을 적절한 레벨로 설정
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    # 시작 메시지 로그
    logger = logging.getLogger(__name__)
    logger.info(
        "로깅 설정 완료 - 레벨: %s, 환경: %s",
        settings.LOG_LEVEL,
        settings.ENVIRONMENT,
    )


class SecurityLogger:
    """
    인증 및 권한 부여 이벤트를 위한 보안 중심 로거
    """

    def __init__(self):
        self.logger = logging.getLogger("security")

    def log_login_attempt(
        self, username: str, success: bool, ip_address: Optional[str] = None
    ):
        """로그인 시도 기록"""
        if success:
            self.logger.info(
                "로그인 성공 - 사용자명: %s, IP: %s",
                username,
                ip_address,
            )
        else:
            self.logger.warning(
                "로그인 실패 - 사용자명: %s, IP: %s",
                username,
                ip_address,
            )

    def log_logout(self, username: str, ip_address: Optional[str] = None):
        """로그아웃 이벤트 기록"""
        self.logger.info(
            "사용자 로그아웃 - 사용자명: %s, IP: %s",
            username,
            ip_address,
        )

    def log_password_change(self, username: str, ip_address: Optional[str] = None):
        """비밀번호 변경 기록"""
        self.logger.info(
            "비밀번호 변경됨 - 사용자명: %s, IP: %s",
            username,
            ip_address,
        )

    def log_permission_denied(self, username: str, resource: str, action: str):
        """권한 거부 이벤트 기록"""
        self.logger.warning(
            "권한 거부됨 - 사용자명: %s, 리소스: %s, 작업: %s",
            username,
            resource,
            action,
        )

    def log_suspicious_activity(self, description: str, username: Optional[str] = None):
        """의심스러운 활동 기록"""
        self.logger.error(
            "의심스러운 활동 - %s, 사용자명: %s",
            description,
            username,
        )


class AuditLogger:
    """
    비즈니스 운영을 위한 감사 로거
    """

    def __init__(self):
        self.logger = logging.getLogger("audit")

    def log_action(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: str,
        details: Optional[dict] = None,
    ):
        """사용자 행동 기록"""
        log_data = {
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "user_id": user_id,
            "details": details or {},
        }
        self.logger.info("사용자 행동 - %s", log_data)

    def log_data_access(self, user_id: str, resource: str, access_type: str):
        """데이터 접근 기록"""
        self.logger.info(
            "데이터 접근 - 사용자: %s, 리소스: %s, 유형: %s",
            user_id,
            resource,
            access_type,
        )

    def log_system_event(self, event: str, details: Optional[dict] = None):
        """시스템 이벤트 기록"""
        self.logger.info("시스템 이벤트 - %s, 세부사항: %s", event, details or {})


# 전역 로거 인스턴스
security_logger = SecurityLogger()
audit_logger = AuditLogger()


def get_logger(name: str) -> logging.Logger:
    """
    지정된 이름을 가진 로거 인스턴스 반환

    Args:
        name: 로거 이름

    Returns:
        logging.Logger: 로거 인스턴스
    """
    return logging.getLogger(name)


def log_performance(func):
    """
    함수 성능을 기록하는 데코레이터
    """

    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        logger = get_logger(func.__module__)

        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.debug(
                "함수 %s가 %.4f초 만에 실행됨",
                func.__name__,
                execution_time,
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                "함수 %s가 %.4f초 후 실패함: %s",
                func.__name__,
                execution_time,
                e,
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
                "함수 %s가 %.4f초 만에 실행됨",
                func.__name__,
                execution_time,
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                "함수 %s가 %.4f초 후 실패함: %s",
                func.__name__,
                execution_time,
                e,
            )
            raise

    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def configure_uvicorn_logging():
    """
    uvicorn 로깅을 우리의 로깅 설정과 통합하도록 구성
    """
    # uvicorn의 기본 로깅 설정 비활성화
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)

    # 기본 핸들러 제거
    for handler in uvicorn_logger.handlers[:]:
        uvicorn_logger.removeHandler(handler)

    # 우리의 핸들러 추가
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    uvicorn_logger.addHandler(console_handler)


# 민감한 데이터를 위한 커스텀 필터
class SensitiveDataFilter(logging.Filter):
    """
    로그에서 민감한 데이터를 제거하는 필터
    """

    SENSITIVE_FIELDS = [
        "password",
        "token",
        "secret",
        "key",
        "authorization",
        "cookie",
        "session",
        "비밀번호",
        "토큰",
        "비밀키",
        "인증",
        "쿠키",
        "세션",
    ]

    def filter(self, record):
        """
        로그 레코드에서 민감한 정보 필터링

        Args:
            record: 로그 레코드

        Returns:
            bool: 항상 True (필터링 후 로그 허용)
        """
        if hasattr(record, "getMessage"):
            message = record.getMessage()
            for field in self.SENSITIVE_FIELDS:
                if field in message.lower():
                    # 민감한 데이터를 별표로 교체
                    pattern = rf"({field}['\"]?\s*[:=]\s*['\"]?)([^'\",\s]+)"
                    message = re.sub(pattern, r"\1***", message, flags=re.IGNORECASE)
                    record.msg = message
        return True


def add_sensitive_data_filter():
    """
    모든 핸들러에 민감한 데이터 필터 추가
    """
    sensitive_filter = SensitiveDataFilter()
    root_logger = logging.getLogger()

    for handler in root_logger.handlers:
        handler.addFilter(sensitive_filter)


def log_request(request_id: str, method: str, url: str, user_id: Optional[str] = None):
    """
    HTTP 요청 로그 기록

    Args:
        request_id: 요청 ID
        method: HTTP 메소드
        url: 요청 URL
        user_id: 사용자 ID (선택사항)
    """
    logger = get_logger("api.request")
    logger.info(
        "API 요청 - ID: %s, 메소드: %s, URL: %s, 사용자: %s",
        request_id,
        method,
        url,
        user_id or "익명",
    )


def log_response(
    request_id: str, status_code: int, response_time: float, size: Optional[int] = None
):
    """
    HTTP 응답 로그 기록

    Args:
        request_id: 요청 ID
        status_code: HTTP 상태 코드
        response_time: 응답 시간 (초)
        size: 응답 크기 (바이트, 선택사항)
    """
    logger = get_logger("api.response")
    logger.info(
        "API 응답 - ID: %s, 상태: %d, 시간: %.4f초, 크기: %s바이트",
        request_id,
        status_code,
        response_time,
        size or "알 수 없음",
    )


def log_database_query(query: str, execution_time: float, affected_rows: int = 0):
    """
    데이터베이스 쿼리 로그 기록

    Args:
        query: SQL 쿼리 (간략화된)
        execution_time: 실행 시간 (초)
        affected_rows: 영향받은 행 수
    """
    logger = get_logger("database")
    logger.debug(
        "DB 쿼리 실행 - 쿼리: %s..., 시간: %.4f초, 영향받은 행: %d",
        query[:100],  # 처음 100자만 로그
        execution_time,
        affected_rows,
    )


def log_cache_operation(operation: str, key: str, hit: bool = False):
    """
    캐시 작업 로그 기록

    Args:
        operation: 캐시 작업 (GET, SET, DELETE 등)
        key: 캐시 키
        hit: 캐시 히트 여부 (GET 작업의 경우)
    """
    logger = get_logger("cache")
    if operation.upper() == "GET":
        logger.debug(
            "캐시 %s - 키: %s, 결과: %s",
            operation,
            key,
            "히트" if hit else "미스",
        )
    else:
        logger.debug("캐시 %s - 키: %s", operation, key)


class RequestLogger:
    """
    요청별 로깅을 위한 컨텍스트 로거
    """

    def __init__(self, request_id: str, user_id: Optional[str] = None):
        """
        Args:
            request_id: 요청 고유 ID
            user_id: 사용자 ID (선택사항)
        """
        self.request_id = request_id
        self.user_id = user_id
        self.logger = get_logger("request")

    def info(self, message: str, *args, **kwargs):
        """정보 레벨 로그"""
        formatted_message = f"[요청:{self.request_id}] {message}"
        if self.user_id:
            formatted_message = f"[사용자:{self.user_id}] {formatted_message}"
        self.logger.info(formatted_message, *args, **kwargs)

    def warning(self, message: str, *args, **kwargs):
        """경고 레벨 로그"""
        formatted_message = f"[요청:{self.request_id}] {message}"
        if self.user_id:
            formatted_message = f"[사용자:{self.user_id}] {formatted_message}"
        self.logger.warning(formatted_message, *args, **kwargs)

    def error(self, message: str, *args, **kwargs):
        """오류 레벨 로그"""
        formatted_message = f"[요청:{self.request_id}] {message}"
        if self.user_id:
            formatted_message = f"[사용자:{self.user_id}] {formatted_message}"
        self.logger.error(formatted_message, *args, **kwargs)

    def debug(self, message: str, *args, **kwargs):
        """디버그 레벨 로그"""
        formatted_message = f"[요청:{self.request_id}] {message}"
        if self.user_id:
            formatted_message = f"[사용자:{self.user_id}] {formatted_message}"
        self.logger.debug(formatted_message, *args, **kwargs)

    def critical(self, message: str, *args, **kwargs):
        """치명적 레벨 로그"""
        formatted_message = f"[요청:{self.request_id}] {message}"
        if self.user_id:
            formatted_message = f"[사용자:{self.user_id}] {formatted_message}"
        self.logger.critical(formatted_message, *args, **kwargs)

    def bind(self, **kwargs):
        """
        로거에 추가 컨텍스트 바인딩

        Args:
            **kwargs: 바인딩할 키워드 인자
        """
        self.logger = self.logger.bind(**kwargs)
        return self
