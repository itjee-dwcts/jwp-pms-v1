"""
Core 패키지

핵심 기능 및 유틸리티
"""

# 데이터베이스 관련
from .base import Base

# 설정 관련
from .config import settings
from .database import (
    AsyncSessionLocal,
    backup_database,
    check_database_connection,
    check_migration_status,
    cleanup_old_logs,
    cleanup_old_sessions,
    close_database_connections,
    create_tables,
    db_monitor,
    drop_tables,
    engine,
    execute_raw_sql,
    get_async_session,
    get_database_health,
    get_database_info,
    get_engine,
    get_performance_metrics,
    get_session_factory,
    get_sync_engine,
    get_table_info,
    initialize_database,
    restore_database,
    vacuum_database,
)

# 데이터베이스 유틸리티
from .db_utils import (
    check_database_health,
    get_database_stats,
    reset_database,
    test_database_operations,
)
from .db_utils import initialize_database as init_db

# 보안 관련
from .security import (
    AuthManager,
    SecurityHeaders,
    TokenData,
    auth_manager,
    check_password_strength,
    create_access_token,
    create_refresh_token,
    generate_email_verification_token,
    get_password_hash,
    pwd_context,
    verify_email_verification_token,
    verify_password,
)

__all__ = [
    # 데이터베이스 기본
    "Base",
    "engine",
    "AsyncSessionLocal",
    "get_async_session",
    "get_engine",
    "get_session_factory",
    "get_sync_engine",
    # 데이터베이스 관리
    "create_tables",
    "drop_tables",
    "initialize_database",
    "check_database_connection",
    "get_database_info",
    "get_table_info",
    "get_database_health",
    "get_performance_metrics",
    "check_migration_status",
    # 데이터베이스 백업/복원
    "backup_database",
    "restore_database",
    # 데이터베이스 모니터링
    "db_monitor",
    "vacuum_database",
    # 데이터베이스 정리
    "cleanup_old_sessions",
    "cleanup_old_logs",
    "close_database_connections",
    # 유틸리티
    "execute_raw_sql",
    # 데이터베이스 유틸리티 (db_utils)
    "check_database_health",
    "test_database_operations",
    "get_database_stats",
    "init_db",
    "reset_database",
    # 보안 - 인증 관리
    "AuthManager",
    "auth_manager",
    "TokenData",
    # 보안 - 토큰 관리
    "create_access_token",
    "create_refresh_token",
    "generate_email_verification_token",
    "verify_email_verification_token",
    # 보안 - 비밀번호 관리
    "get_password_hash",
    "verify_password",
    "check_password_strength",
    "pwd_context",
    # 보안 - 헤더
    "SecurityHeaders",
    # 설정
    "settings",
]
