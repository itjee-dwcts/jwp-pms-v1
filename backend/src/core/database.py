"""
Database Configuration

SQLAlchemy async database setup for PostgreSQL.
"""

import logging
import os
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncGenerator
from urllib.parse import urlparse

from core.config import get_database_url, get_sync_database_url
from core.constants import UserRole, UserStatus
from core.security import get_password_hash
from models.user import User
from sqlalchemy import MetaData, create_engine, select, text
from sqlalchemy.exc import (
    DatabaseError,
    DataError,
    IntegrityError,
    OperationalError,
    SQLAlchemyError,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool

logger = logging.getLogger(__name__)

# Database URL
DATABASE_URL = get_database_url()

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    future=True,
    poolclass=NullPool,  # Disable connection pooling for development
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create declarative base
Base = declarative_base()

# Naming convention for constraints
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "ux": "ux_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

Base.metadata = MetaData(naming_convention=naming_convention)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except (DatabaseError, SQLAlchemyError, OperationalError) as e:
            logger.error("Database session error: %s", e)
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """
    Create all database tables
    """
    try:
        # Import all models to register them with Base
        import_all_models()

        async with engine.begin() as conn:
            # Import all models to register them with Base
            # from models import User  # noqa

            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database tables created successfully")
    except OperationalError as e:
        logger.error("❌ Connection error creating database tables: %s", e)
        raise
    except DatabaseError as e:
        logger.error("❌ Database error creating tables: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error creating database tables: %s", e)
        raise


async def drop_tables():
    """
    Drop all database tables (use with caution!)
    """
    try:
        # Import all models to register them with Base
        import_all_models()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            logger.warning("⚠️ All database tables dropped")
    except OperationalError as e:
        logger.error("❌ Connection error dropping database tables: %s", e)
        raise
    except DatabaseError as e:
        logger.error("❌ Database error dropping tables: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error dropping database tables: %s", e)
        raise


async def check_database_connection() -> bool:
    """
    Check if database connection is working
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except OperationalError as e:
        logger.error("Database connection check failed (operational): %s", e)
        return False
    except DatabaseError as e:
        logger.error("Database connection check failed (database): %s", e)
        return False
    except SQLAlchemyError as e:
        logger.error("Database connection check failed (sqlalchemy): %s", e)
        return False


async def get_database_info() -> dict:
    """
    Get database information
    """
    try:
        async with engine.begin() as conn:
            # Get PostgreSQL version
            version_result = await conn.execute(text("SELECT version()"))
            version = version_result.scalar()

            # Get database name
            db_name_result = await conn.execute(
                text("SELECT current_database()")
            )
            db_name = db_name_result.scalar()

            # Get current user
            user_result = await conn.execute(text("SELECT current_user"))
            user = user_result.scalar()

            return {
                "database": db_name,
                "user": user,
                "version": version,
                "status": "connected",
            }
    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error("Database connection error: %s", e)
        return {"status": "connection_error", "error": str(e)}
    except DatabaseError as e:
        # 데이터베이스 관련 오류
        logger.error("Database error: %s", e)
        return {"status": "database_error", "error": str(e)}
    except SQLAlchemyError as e:
        # SQLAlchemy 관련 오류
        logger.error("SQLAlchemy error: %s", e)
        return {"status": "sqlalchemy_error", "error": str(e)}


async def get_table_info() -> dict:
    """
    Get information about database tables
    """
    try:
        async with engine.begin() as conn:
            # Get table names
            tables_result = await conn.execute(
                text(
                    """
                        SELECT  table_name
                        FROM    information_schema.tables
                        WHERE   table_schema = 'public'
                        ORDER BY table_name
                    """
                )
            )
            tables = [row[0] for row in tables_result.fetchall()]

            # Get total row counts for each table
            table_counts = {}
            for table in tables:
                try:
                    count_result = await conn.execute(
                        text(f"SELECT COUNT(*) FROM {table}")
                    )
                    table_counts[table] = count_result.scalar()
                except OperationalError as e:
                    logger.error("Connection error getting user count: %s", e)
                    table_counts[table] = "N/A"
                except DatabaseError as e:
                    logger.error("Database error getting user count: %s", e)
                    table_counts[table] = "N/A"
                except SQLAlchemyError as e:
                    logger.error("SQLAlchemy error getting user count: %s", e)
                    table_counts[table] = "N/A"

            return {
                "tables": tables,
                "table_counts": table_counts,
                "total_tables": len(tables),
            }
    except OperationalError as e:
        logger.error("Database connection error getting table info: %s", e)
        return {"error": f"Connection error: {e}"}
    except DatabaseError as e:
        logger.error("Database error getting table info: %s", e)
        return {"error": f"Database error: {e}"}
    except SQLAlchemyError as e:
        logger.error("SQLAlchemy error getting table info: %s", e)
        return {"error": f"SQLAlchemy error: {e}"}


def import_all_models():
    """
    Import all models to ensure they are registered with SQLAlchemy
    """
    try:

        logger.debug("All models imported successfully")
    except ImportError as e:
        logger.warning("Some models could not be imported: %s", e)


async def initialize_database():
    """
    Initialize database with required setup
    """
    logger.info("🔧 Initializing database...")

    try:
        # Check connection
        if not await check_database_connection():
            raise ConnectionError("Database connection failed")

        # Import all models
        import_all_models()

        # Create tables
        await create_tables()

        # Run any initialization scripts
        await run_initialization_scripts()

        logger.info("✅ Database initialization completed")
        return True

    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error(
            "❌ Database connection error during initialization: %s", e
        )
        return False
    except IntegrityError as e:
        # 제약 조건 위반 (초기 데이터 삽입 시)
        logger.error("❌ Integrity error during initialization: %s", e)
        return False
    except DatabaseError as e:
        # 데이터베이스 관련 오류 (테이블 생성 실패 등)
        logger.error("❌ Database error during initialization: %s", e)
        return False
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 관련 오류
        logger.error("❌ SQLAlchemy error during initialization: %s", e)
        return False
    except ImportError as e:
        # 모델 import 실패
        logger.error("❌ Model import error during initialization: %s", e)
        return False


async def run_initialization_scripts():
    """
    Run database initialization scripts
    """
    try:
        async with AsyncSessionLocal() as session:
            # Create default admin user if not exists
            await create_default_admin_user(session)

            # Create default roles/permissions if needed
            await create_default_roles()

            await session.commit()
            logger.info("✅ Initialization scripts completed")

    except IntegrityError as e:
        # 중복 데이터 삽입 시도 (이미 존재하는 관리자 등)
        logger.warning(
            (
                "⚠️ Integrity constraint during initialization "
                "(may be expected): %s"
            ),
            e,
        )
        # 롤백하고 계속 진행
        await session.rollback()
    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error(
            "❌ Connection error during initialization scripts: %s", e
        )
        await session.rollback()
        raise
    except DatabaseError as e:
        # 데이터베이스 관련 오류
        logger.error("❌ Database error during initialization scripts: %s", e)
        await session.rollback()
        raise
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 오류
        logger.error(
            "❌ SQLAlchemy error during initialization scripts: %s", e
        )
        await session.rollback()
        raise


async def create_default_admin_user(session: AsyncSession):
    """
    Create default admin user if it doesn't exist
    """
    try:

        # Check if admin user exists
        result = await session.execute(
            select(User).where(User.email == "jongho.woo@computer.co.kr")
        )
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            # Create default admin user
            admin_user = User(
                username="admin",
                email="jongho.woo@computer.co.kr",
                full_name="Administrator",
                password=get_password_hash("admin123!"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            logger.info("✅ Default admin user created")
        else:
            logger.info("✅ Default admin user already exists")

    except IntegrityError as e:
        # 동시 실행으로 인한 중복 생성 시도
        logger.warning(
            "⚠️ Admin user already exists (concurrent creation): %s", e
        )
        raise  # 상위에서 처리하도록 전파
    except DataError as e:
        # 잘못된 데이터 형식
        logger.error("❌ Data format error creating admin user: %s", e)
        raise
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 오류
        logger.error("❌ SQLAlchemy error creating admin user: %s", e)
        raise


async def create_default_roles() -> None:
    """
    Create default roles and permissions if needed
    """
    try:
        # This is a placeholder for future role/permission system
        # For now, roles are handled via enums in the user model
        logger.info("✅ Default roles verified")

    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error creating default roles: %s", e)
        raise


async def backup_database(backup_path: str | None = None):
    """
    Create database backup using pg_dump
    """

    try:
        # Generate backup filename if not provided
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backup_pms_{timestamp}.sql"

        # Ensure backup directory exists
        backup_file = Path(backup_path)
        backup_file.parent.mkdir(parents=True, exist_ok=True)

        # Get database connection info from URL

        db_url = urlparse(get_sync_database_url())

        # Build pg_dump command
        cmd = [
            "pg_dump",
            "-h",
            db_url.hostname or "localhost",
            "-p",
            str(db_url.port or 5432),
            "-U",
            db_url.username or "postgres",
            "-d",
            db_url.path.lstrip("/") if db_url.path else "postgres",
            "-f",
            str(backup_file),
            "--verbose",
            "--no-password",  # Use .pgpass or environment variables
            # for password
        ]

        # Set password environment variable if available
        env = os.environ.copy()
        if db_url.password:
            env["PGPASSWORD"] = db_url.password

        # Execute pg_dump
        logger.info("📦 Starting database backup to: %s", backup_path)

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes timeout
            check=False,  # Explicitly do not raise exception on non-zero exit
        )

        if result.returncode == 0:
            file_size = backup_file.stat().st_size
            logger.info("✅ Database backup completed successfully")
            logger.info(
                "📦 Backup file: %s (Size: %s bytes)",
                backup_path,
                file_size,
            )

            return {
                "status": "success",
                "backup_path": str(backup_file.absolute()),
                "file_size": file_size,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            logger.error("❌ Database backup failed: %s", result.stderr)
            return {
                "status": "error",
                "error": result.stderr,
                "command": " ".join(cmd),
            }

    except subprocess.TimeoutExpired:
        logger.error("❌ Database backup timed out")
        return {"status": "timeout", "error": "Backup operation timed out"}

    except FileNotFoundError:
        logger.error(
            "❌ pg_dump command not found. Please install %s",
            "PostgreSQL client tools",
        )
        return {
            "status": "error",
            "error": ("pg_dump not found. " "Install PostgreSQL client tools"),
        }

    except (subprocess.SubprocessError, OSError) as e:
        logger.error("❌ Database backup failed: %s", e)
        return {"status": "error", "error": str(e)}


async def restore_database(backup_path: str):
    """
    Restore database from backup using psql
    """

    try:
        backup_file = Path(backup_path)

        # Check if backup file exists
        if not backup_file.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_path}")

        # Get database connection info

        db_url = urlparse(get_sync_database_url())

        # Build psql command
        cmd = [
            "psql",
            "-h",
            db_url.hostname or "localhost",
            "-p",
            str(db_url.port or 5432),
            "-U",
            db_url.username or "postgres",
            "-d",
            db_url.path.lstrip("/") if db_url.path else "postgres",
            "-f",
            str(backup_file),
            "--quiet",
        ]

        # Set password environment variable if available
        env = os.environ.copy()
        if db_url.password:
            env["PGPASSWORD"] = db_url.password

        # Execute psql
        logger.info("📦 Starting database restore from: %s", backup_path)

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=600,  # 10 minutes timeout
            check=False,  # Explicitly do not raise exception on non-zero exit
        )

        if result.returncode == 0:
            logger.info("✅ Database restore completed successfully")
            return {
                "status": "success",
                "backup_path": backup_path,
                "restored_at": datetime.now().isoformat(),
            }
        else:
            logger.error("❌ Database restore failed: %s", result.stderr)
            return {
                "status": "error",
                "error": result.stderr,
                "command": " ".join(cmd),
            }

    except subprocess.TimeoutExpired:
        logger.error("❌ Database restore timed out")
        return {"status": "timeout", "error": "Restore operation timed out"}

    except FileNotFoundError as e:
        logger.error("❌ File error during restore: %s", e)
        return {"status": "error", "error": str(e)}

    except (subprocess.SubprocessError, OSError) as e:
        logger.error("❌ Database restore failed: %s", e)
        return {"status": "error", "error": str(e)}


async def get_database_health() -> dict:
    """
    Get comprehensive database health information
    """
    health_info = {
        "status": "unknown",
        "connection": False,
        "tables": 0,
        "info": {},
        "performance": {},
    }

    try:
        # Check basic connection
        health_info["connection"] = await check_database_connection()

        if health_info["connection"]:
            # Get database info
            health_info["info"] = await get_database_info()

            # Get table info
            table_info = await get_table_info()
            health_info["tables"] = table_info.get("total_tables", 0)

            # Get performance metrics
            health_info["performance"] = await get_performance_metrics()

            health_info["status"] = "healthy"
        else:
            health_info["status"] = "unhealthy"

    except (OperationalError, DatabaseError, SQLAlchemyError) as e:
        health_info["status"] = "error"
        health_info["error"] = str(e)
        logger.error("Database health check failed: %s", e)

    return health_info


async def get_performance_metrics() -> dict:
    """
    Get database performance metrics
    """
    try:
        async with engine.begin() as conn:
            # Get connection count
            conn_result = await conn.execute(
                text(
                    """
                SELECT count(*) as connection_count
                FROM pg_stat_activity
                WHERE state = 'active'
            """
                )
            )
            connection_count = conn_result.scalar()

            # Get database size
            size_result = await conn.execute(
                text(
                    """
                SELECT pg_size_pretty(
                    pg_database_size(current_database())
                ) as database_size
            """
                )
            )
            database_size = size_result.scalar()

            # Get cache hit ratio
            cache_result = await conn.execute(
                text(
                    """
                SELECT
                    round(
                        (
                            sum(heap_blks_hit) /
                            (sum(heap_blks_hit) + sum(heap_blks_read))
                        ) * 100, 2
                    ) as cache_hit_ratio
                FROM pg_statio_user_tables
            """
                )
            )
            cache_hit_ratio = cache_result.scalar() or 0

            return {
                "active_connections": connection_count,
                "database_size": database_size,
                "cache_hit_ratio": f"{cache_hit_ratio}%",
                "last_checked": datetime.now().isoformat(),
            }

    except OperationalError as e:
        logger.warning("Connection error getting performance metrics: %s", e)
        return {"error": "Connection error"}
    except DatabaseError as e:
        logger.warning("Database error getting performance metrics: %s", e)
        return {"error": "Database error"}
    except SQLAlchemyError as e:
        logger.warning("SQLAlchemy error getting performance metrics: %s", e)
        return {"error": "SQLAlchemy error"}


# Database event handlers
async def on_database_connect():
    """
    Handler for database connection events
    """
    logger.info("🔗 Database connected")


async def on_database_disconnect():
    """
    Handler for database disconnection events
    """
    logger.info("🔌 Database disconnected")


# Connection pool management
async def close_database_connections():
    """
    Close all database connections
    """
    try:
        await engine.dispose()
        logger.info("🔌 Database connections closed")
    except (OperationalError, DatabaseError, SQLAlchemyError) as e:
        logger.error("❌ Error closing database connections: %s", e)


# Database migration helpers
async def check_migration_status():
    """
    Check the status of database migrations
    """
    try:
        async with engine.begin() as conn:
            # Check if alembic version table exists
            version_table_result = await conn.execute(
                text(
                    """
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables
                            WHERE table_schema = 'public'
                            AND table_name = 'alembic_version'
                        )
                    """
                )
            )

            has_version_table = version_table_result.scalar()

            if has_version_table:
                # Get current migration version
                version_result = await conn.execute(
                    text(
                        """
                    SELECT version_num FROM alembic_version
                """
                    )
                )
                current_version = version_result.scalar()

                return {
                    "status": "managed",
                    "current_version": current_version,
                    "has_migrations": True,
                }
            else:
                return {
                    "status": "unmanaged",
                    "current_version": None,
                    "has_migrations": False,
                }

    except OperationalError as e:
        logger.error("Connection error checking migration status: %s", e)
        return {"status": "connection_error", "error": str(e)}
    except DatabaseError as e:
        logger.error("Database error checking migration status: %s", e)
        return {"status": "database_error", "error": str(e)}
    except SQLAlchemyError as e:
        logger.error("SQLAlchemy error checking migration status: %s", e)
        return {"status": "sqlalchemy_error", "error": str(e)}


# For Alembic migrations
def get_sync_engine():
    """
    Get synchronous engine for Alembic migrations
    """
    return create_engine(get_sync_database_url())


# Utility functions
def get_engine():
    """Get the database engine instance"""
    return engine


def get_session_factory():
    """Get the session factory"""
    return AsyncSessionLocal


async def execute_raw_sql(sql: str, params: dict | None = None) -> list:
    """
    Execute raw SQL query (use with caution)
    """
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text(sql), params or {})
            if result.returns_rows:
                return list(result.fetchall())
            else:
                return []
    except OperationalError as e:
        logger.error("Connection error executing raw SQL: %s", e)
        raise
    except DatabaseError as e:
        logger.error("Database error executing raw SQL: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("SQLAlchemy error executing raw SQL: %s", e)
        raise


# Database monitoring
class DatabaseMonitor:
    """Database monitoring utilities"""

    @staticmethod
    async def get_slow_queries(limit: int = 10):
        """Get slow running queries"""
        try:
            async with engine.begin() as conn:
                result = await conn.execute(
                    text(
                        """
                    SELECT query, mean_time, calls, total_time
                    FROM pg_stat_statements
                    ORDER BY mean_time DESC
                    LIMIT :limit
                """
                    ),
                    {"limit": limit},
                )

                return [dict(row) for row in result.fetchall()]
        except (OperationalError, DatabaseError, SQLAlchemyError) as e:
            logger.warning("Could not get slow queries: %s", e)
            return []

    @staticmethod
    async def get_table_sizes():
        """Get table sizes"""
        try:
            async with engine.begin() as conn:
                result = await conn.execute(
                    text(
                        """
                    SELECT
                        schemaname,
                        tablename,
                        pg_size_pretty(
                            pg_total_relation_size(schemaname||'.'||tablename)
                        ) as size,
                        pg_total_relation_size(
                            schemaname||'.'||tablename
                        ) as size_bytes
                    FROM pg_tables
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(
                        schemaname||'.'||tablename
                    ) DESC
                """
                    )
                )

                return [dict(row) for row in result.fetchall()]
        except (OperationalError, DatabaseError, SQLAlchemyError) as e:
            logger.warning("Could not get table sizes: %s", e)
            return []


# Global database monitor instance
db_monitor = DatabaseMonitor()


# Database cleanup utilities
async def cleanup_old_sessions(days: int = 30) -> int:
    """
    Clean up old user sessions
    """
    try:

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        async with AsyncSessionLocal() as session:
            # Delete expired sessions
            result = await session.execute(
                text(
                    """
                        DELETE FROM user_sessions
                        WHERE created_at < :cutoff_date
                        OR expires_at < :now
                    """
                ),
                {"cutoff_date": cutoff_date, "now": datetime.utcnow()},
            )

            deleted_count = getattr(result, "rowcount", 0)
            await session.commit()

            logger.info("🧹 Cleaned up %d old sessions", deleted_count)
            return deleted_count

    except OperationalError as e:
        logger.error("❌ Connection error during session cleanup: %s", e)
        return 0
    except DatabaseError as e:
        logger.error("❌ Database error during session cleanup: %s", e)
        return 0
    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error during session cleanup: %s", e)
        return 0


async def cleanup_old_logs(days: int = 90) -> int:
    """
    Clean up old activity logs
    """
    try:

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        async with AsyncSessionLocal() as session:
            # Delete old activity logs
            result = await session.execute(
                text(
                    """
                        DELETE FROM user_activity_logs
                        WHERE created_at < :cutoff_date
                    """
                ),
                {"cutoff_date": cutoff_date},
            )

            result_count = getattr(result, "rowcount", 0)
            deleted_count = result_count
            await session.commit()

            logger.info("🧹 Cleaned up %d old activity logs", deleted_count)
            return deleted_count

    except OperationalError as e:
        logger.error("❌ Connection error during log cleanup: %s", e)
        return 0
    except DatabaseError as e:
        logger.error("❌ Database error during log cleanup: %s", e)
        return 0
    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error during log cleanup: %s", e)
        return 0


async def vacuum_database():
    """
    Run VACUUM ANALYZE on database for maintenance
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("VACUUM ANALYZE"))
            logger.info("🧹 Database vacuum completed")
            return True
    except OperationalError as e:
        logger.error("❌ Connection error during vacuum: %s", e)
        return False
    except DatabaseError as e:
        logger.error("❌ Database error during vacuum: %s", e)
        return False
    except SQLAlchemyError as e:
        logger.error("❌ SQLAlchemy error during vacuum: %s", e)
        return False
