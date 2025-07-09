"""
애플리케이션 설정

환경 변수 관리를 위한 Pydantic 설정
"""

import secrets
from typing import List, Optional, Union

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    field_validator,  # type: ignore
)
from pydantic_settings import BaseSettings  # type: ignore


class Settings(BaseSettings):
    """
    환경 변수에서 로드되는 애플리케이션 설정
    """

    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PMS Backend API"
    VERSION: str = "0.1.0"

    # 환경 설정
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

    # 보안 설정
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 데이터베이스 설정
    # DATABASE_URL: PostgresDsn
    DATABASE_URL: str = (
        "postgresql+asyncpg://pms_admin:PmsAdmin!!@10.10.150.85:6297/pms"
    )
    DATABASE_URL_SYNC: Optional[str] = None

    # Redis 설정
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS 설정
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """
        쉼표로 구분된 문자열 또는 리스트에서 CORS origins 조합
        """
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # OAuth 설정
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None

    # 파일 업로드 설정
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_PATH: str = "uploads/"

    # 이메일 설정
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[EmailStr] = None
    SMTP_PASSWORD: Optional[str] = None

    # Celery 설정
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # 페이지네이션 설정
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # 속도 제한 설정
    RATE_LIMIT_PER_MINUTE: int = 1000

    # 모니터링 설정
    SENTRY_DSN: Optional[str] = None

    # OpenAI 설정 (채팅 서비스용)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_DEFAULT_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.7

    # 로깅 관련 설정 (logger.py에서 사용)
    LOG_FILE_PATH: str = "logs/pms.log"
    LOG_ERROR_FILE_PATH: str = "logs/pms_errors.log"
    LOG_SECURITY_FILE_PATH: str = "logs/security.log"
    LOG_AUDIT_FILE_PATH: str = "logs/audit.log"
    LOG_MAX_BYTES: int = 10485760  # 10MB
    LOG_BACKUP_COUNT: int = 5

    class Config:
        """
        설정을 위한 Pydantic 설정
        """

        env_file = ".env"
        case_sensitive = True


# 전역 설정 인스턴스 생성
settings = Settings()


def get_settings() -> Settings:
    """
    애플리케이션 설정 인스턴스 반환

    Returns:
        Settings: 애플리케이션 설정
    """
    return settings


def get_database_url() -> str:
    """
    비동기 작업용 데이터베이스 URL 반환

    Returns:
        str: 데이터베이스 URL
    """
    return str(settings.DATABASE_URL)


def get_sync_database_url() -> str:
    """
    동기 작업용 데이터베이스 URL 반환 (Alembic 등)

    Returns:
        str: 동기용 데이터베이스 URL
    """
    if settings.DATABASE_URL_SYNC:
        return settings.DATABASE_URL_SYNC

    # 비동기 URL을 동기 URL로 변환
    async_url = str(settings.DATABASE_URL)
    return async_url.replace("postgresql+asyncpg://", "postgresql://")


def is_production() -> bool:
    """
    운영 환경 여부 확인

    Returns:
        bool: 운영 환경인 경우 True
    """
    return settings.ENVIRONMENT.lower() == "production"


def is_development() -> bool:
    """
    개발 환경 여부 확인

    Returns:
        bool: 개발 환경인 경우 True
    """
    return settings.ENVIRONMENT.lower() == "development"


def get_cors_origins() -> List[str]:
    """
    CORS origins 목록 반환

    Returns:
        List[str]: CORS origins 목록
    """
    return [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
