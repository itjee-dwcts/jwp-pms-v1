"""
데이터베이스 설정

PostgreSQL을 위한 SQLAlchemy 비동기 데이터베이스 설정입니다.
"""

import logging
import os
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncGenerator
from urllib.parse import urlparse

from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import (
    DatabaseError,
    DataError,
    IntegrityError,
    OperationalError,
    SQLAlchemyError,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from constants.user import UserRole, UserStatus
from models.user import User

from .base import Base
from .config import get_database_url, get_sync_database_url
from .security import get_password_hash

logger = logging.getLogger(__name__)

# 데이터베이스 URL
DATABASE_URL = get_database_url()

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # SQL 로깅을 위해 True로 설정
    future=True,
    poolclass=NullPool,  # 개발용 커넥션 풀링 비활성화
)

# 비동기 세션 메이커 생성
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    비동기 데이터베이스 세션을 가져오는 의존성
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except (DatabaseError, SQLAlchemyError, OperationalError) as e:
            logger.error("데이터베이스 세션 오류: %s", e)
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """
    모든 데이터베이스 테이블 생성
    """
    try:
        # Base에 등록하기 위해 모든 모델 가져오기
        import_all_models()

        async with engine.begin() as conn:
            # Base에 등록하기 위해 모든 모델 가져오기
            # from models import User  # noqa

            await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ 데이터베이스 테이블이 성공적으로 생성되었습니다")
    except OperationalError as e:
        logger.error("❌ 데이터베이스 테이블 생성 중 연결 오류: %s", e)
        raise
    except DatabaseError as e:
        logger.error("❌ 테이블 생성 중 데이터베이스 오류: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("❌ 데이터베이스 테이블 생성 중 SQLAlchemy 오류: %s", e)
        raise


async def drop_tables():
    """
    모든 데이터베이스 테이블 삭제 (주의해서 사용!)
    """
    try:
        # Base에 등록하기 위해 모든 모델 가져오기
        import_all_models()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            logger.warning("⚠️ 모든 데이터베이스 테이블이 삭제되었습니다")
    except OperationalError as e:
        logger.error("❌ 데이터베이스 테이블 삭제 중 연결 오류: %s", e)
        raise
    except DatabaseError as e:
        logger.error("❌ 테이블 삭제 중 데이터베이스 오류: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("❌ 데이터베이스 테이블 삭제 중 SQLAlchemy 오류: %s", e)
        raise


async def check_database_connection() -> bool:
    """
    데이터베이스 연결이 작동하는지 확인
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except OperationalError as e:
        logger.error("데이터베이스 연결 확인 실패 (운영 오류): %s", e)
        return False
    except DatabaseError as e:
        logger.error("데이터베이스 연결 확인 실패 (데이터베이스 오류): %s", e)
        return False
    except SQLAlchemyError as e:
        logger.error("데이터베이스 연결 확인 실패 (SQLAlchemy 오류): %s", e)
        return False


async def get_database_info() -> dict:
    """
    데이터베이스 정보 가져오기
    """
    try:
        async with engine.begin() as conn:
            # PostgreSQL 버전 가져오기
            version_result = await conn.execute(text("SELECT version()"))
            version = version_result.scalar()

            # 데이터베이스 이름 가져오기
            db_name_result = await conn.execute(text("SELECT current_database()"))
            db_name = db_name_result.scalar()

            # 현재 사용자 가져오기
            user_result = await conn.execute(text("SELECT current_user"))
            user = user_result.scalar()

            return {
                "database": db_name,
                "user": user,
                "version": version,
                "status": "연결됨",
            }
    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error("데이터베이스 연결 오류: %s", e)
        return {"status": "연결_오류", "error": str(e)}
    except DatabaseError as e:
        # 데이터베이스 관련 오류
        logger.error("데이터베이스 오류: %s", e)
        return {"status": "데이터베이스_오류", "error": str(e)}
    except SQLAlchemyError as e:
        # SQLAlchemy 관련 오류
        logger.error("SQLAlchemy 오류: %s", e)
        return {"status": "sqlalchemy_오류", "error": str(e)}


async def get_table_info() -> dict:
    """
    데이터베이스 테이블 정보 가져오기
    """
    try:
        async with engine.begin() as conn:
            # 테이블 이름 가져오기
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

            # 각 테이블의 총 행 수 가져오기
            table_counts = {}
            for table in tables:
                try:
                    count_result = await conn.execute(
                        text(f"SELECT COUNT(*) FROM {table}")
                    )
                    table_counts[table] = count_result.scalar()
                except OperationalError as e:
                    logger.error("사용자 수 가져오는 중 연결 오류: %s", e)
                    table_counts[table] = "N/A"
                except DatabaseError as e:
                    logger.error("사용자 수 가져오는 중 데이터베이스 오류: %s", e)
                    table_counts[table] = "N/A"
                except SQLAlchemyError as e:
                    logger.error("사용자 수 가져오는 중 SQLAlchemy 오류: %s", e)
                    table_counts[table] = "N/A"

            return {
                "tables": tables,
                "table_counts": table_counts,
                "total_tables": len(tables),
            }
    except OperationalError as e:
        logger.error("테이블 정보 가져오는 중 데이터베이스 연결 오류: %s", e)
        return {"error": f"연결 오류: {e}"}
    except DatabaseError as e:
        logger.error("테이블 정보 가져오는 중 데이터베이스 오류: %s", e)
        return {"error": f"데이터베이스 오류: {e}"}
    except SQLAlchemyError as e:
        logger.error("테이블 정보 가져오는 중 SQLAlchemy 오류: %s", e)
        return {"error": f"SQLAlchemy 오류: {e}"}


def import_all_models():
    """
    SQLAlchemy에 등록되도록 모든 모델 가져오기
    """
    try:
        logger.debug("모든 모델이 성공적으로 가져와졌습니다")
    except ImportError as e:
        logger.warning("일부 모델을 가져올 수 없습니다: %s", e)


async def initialize_database():
    """
    필요한 설정으로 데이터베이스 초기화
    """
    logger.info("🔧 데이터베이스를 초기화하는 중...")

    try:
        # 연결 확인
        if not await check_database_connection():
            raise ConnectionError("데이터베이스 연결에 실패했습니다")

        # 모든 모델 가져오기
        import_all_models()

        # 테이블 생성
        await create_tables()

        # 초기화 스크립트 실행
        await run_initialization_scripts()

        logger.info("✅ 데이터베이스 초기화가 완료되었습니다")
        return True

    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error("❌ 초기화 중 데이터베이스 연결 오류: %s", e)
        return False
    except IntegrityError as e:
        # 제약 조건 위반 (초기 데이터 삽입 시)
        logger.error("❌ 초기화 중 무결성 오류: %s", e)
        return False
    except DatabaseError as e:
        # 데이터베이스 관련 오류 (테이블 생성 실패 등)
        logger.error("❌ 초기화 중 데이터베이스 오류: %s", e)
        return False
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 관련 오류
        logger.error("❌ 초기화 중 SQLAlchemy 오류: %s", e)
        return False
    except ImportError as e:
        # 모델 import 실패
        logger.error("❌ 초기화 중 모델 가져오기 오류: %s", e)
        return False


async def run_initialization_scripts():
    """
    데이터베이스 초기화 스크립트 실행
    """
    try:
        async with AsyncSessionLocal() as session:
            # 기본 관리자 사용자가 존재하지 않으면 생성
            await create_default_admin_user(session)

            # 필요시 기본 역할/권한 생성
            await create_default_roles()

            await session.commit()
            logger.info("✅ 초기화 스크립트가 완료되었습니다")

    except IntegrityError as e:
        # 중복 데이터 삽입 시도 (이미 존재하는 관리자 등)
        logger.warning(
            ("⚠️ 초기화 중 무결성 제약 조건 (예상될 수 있음): %s"),
            e,
        )
        # 롤백하고 계속 진행
        await session.rollback()
    except OperationalError as e:
        # 데이터베이스 연결 문제
        logger.error("❌ 초기화 스크립트 중 연결 오류: %s", e)
        await session.rollback()
        raise
    except DatabaseError as e:
        # 데이터베이스 관련 오류
        logger.error("❌ 초기화 스크립트 중 데이터베이스 오류: %s", e)
        await session.rollback()
        raise
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 오류
        logger.error("❌ 초기화 스크립트 중 SQLAlchemy 오류: %s", e)
        await session.rollback()
        raise


async def create_default_admin_user(session: AsyncSession):
    """
    기본 관리자 사용자가 존재하지 않으면 생성
    """
    try:
        # 관리자 사용자 존재 확인
        result = await session.execute(
            select(User).where(User.email == "jongho.woo@computer.co.kr")
        )
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            # 기본 관리자 사용자 생성
            admin_user = User(
                username="admin",
                email="jongho.woo@computer.co.kr",
                full_name="관리자",
                password=get_password_hash("admin123!"),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            logger.info("✅ 기본 관리자 사용자가 생성되었습니다")
        else:
            logger.info("✅ 기본 관리자 사용자가 이미 존재합니다")

    except IntegrityError as e:
        # 동시 실행으로 인한 중복 생성 시도
        logger.warning("⚠️ 관리자 사용자가 이미 존재합니다 (동시 생성): %s", e)
        raise  # 상위에서 처리하도록 전파
    except DataError as e:
        # 잘못된 데이터 형식
        logger.error("❌ 관리자 사용자 생성 중 데이터 형식 오류: %s", e)
        raise
    except SQLAlchemyError as e:
        # 기타 SQLAlchemy 오류
        logger.error("❌ 관리자 사용자 생성 중 SQLAlchemy 오류: %s", e)
        raise


async def create_default_roles() -> None:
    """
    필요시 기본 역할과 권한 생성
    """
    try:
        # 향후 역할/권한 시스템을 위한 자리 표시자
        # 현재는 사용자 모델의 열거형을 통해 역할이 처리됨
        logger.info("✅ 기본 역할이 확인되었습니다")

    except SQLAlchemyError as e:
        logger.error("❌ 기본 역할 생성 중 SQLAlchemy 오류: %s", e)
        raise


async def backup_database(backup_path: str | None = None):
    """
    pg_dump를 사용하여 데이터베이스 백업 생성
    """

    try:
        # 제공되지 않으면 백업 파일명 생성
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backup_pms_{timestamp}.sql"

        # 백업 디렉토리가 존재하는지 확인
        backup_file = Path(backup_path)
        backup_file.parent.mkdir(parents=True, exist_ok=True)

        # URL에서 데이터베이스 연결 정보 가져오기

        db_url = urlparse(get_sync_database_url())

        # pg_dump 명령 구성
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
            "--no-password",  # .pgpass 또는 환경 변수 사용
            # 비밀번호용
        ]

        # 사용 가능한 경우 비밀번호 환경 변수 설정
        env = os.environ.copy()
        if db_url.password:
            env["PGPASSWORD"] = db_url.password

        # pg_dump 실행
        logger.info("📦 데이터베이스 백업 시작: %s", backup_path)

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,  # 5분 타임아웃
            check=False,  # 0이 아닌 종료 시 예외를 발생시키지 않음
        )

        if result.returncode == 0:
            file_size = backup_file.stat().st_size
            logger.info("✅ 데이터베이스 백업이 성공적으로 완료되었습니다")
            logger.info(
                "📦 백업 파일: %s (크기: %s 바이트)",
                backup_path,
                file_size,
            )

            return {
                "status": "성공",
                "backup_path": str(backup_file.absolute()),
                "file_size": file_size,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            logger.error("❌ 데이터베이스 백업에 실패했습니다: %s", result.stderr)
            return {
                "status": "오류",
                "error": result.stderr,
                "command": " ".join(cmd),
            }

    except subprocess.TimeoutExpired:
        logger.error("❌ 데이터베이스 백업 시간이 초과되었습니다")
        return {"status": "타임아웃", "error": "백업 작업 시간이 초과되었습니다"}

    except FileNotFoundError:
        logger.error(
            "❌ pg_dump 명령을 찾을 수 없습니다. %s를 설치해주세요",
            "PostgreSQL 클라이언트 도구",
        )
        return {
            "status": "오류",
            "error": (
                "pg_dump를 찾을 수 없습니다. PostgreSQL 클라이언트 도구를 설치해주세요"
            ),
        }

    except (subprocess.SubprocessError, OSError) as e:
        logger.error("❌ 데이터베이스 백업에 실패했습니다: %s", e)
        return {"status": "오류", "error": str(e)}


async def restore_database(backup_path: str):
    """
    psql을 사용하여 백업에서 데이터베이스 복원
    """

    try:
        backup_file = Path(backup_path)

        # 백업 파일이 존재하는지 확인
        if not backup_file.exists():
            raise FileNotFoundError(f"백업 파일을 찾을 수 없습니다: {backup_path}")

        # 데이터베이스 연결 정보 가져오기

        db_url = urlparse(get_sync_database_url())

        # psql 명령 구성
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

        # 사용 가능한 경우 비밀번호 환경 변수 설정
        env = os.environ.copy()
        if db_url.password:
            env["PGPASSWORD"] = db_url.password

        # psql 실행
        logger.info("📦 데이터베이스 복원 시작: %s", backup_path)

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=600,  # 10분 타임아웃
            check=False,  # 0이 아닌 종료 시 예외를 발생시키지 않음
        )

        if result.returncode == 0:
            logger.info("✅ 데이터베이스 복원이 성공적으로 완료되었습니다")
            return {
                "status": "성공",
                "backup_path": backup_path,
                "restored_at": datetime.now().isoformat(),
            }
        else:
            logger.error("❌ 데이터베이스 복원에 실패했습니다: %s", result.stderr)
            return {
                "status": "오류",
                "error": result.stderr,
                "command": " ".join(cmd),
            }

    except subprocess.TimeoutExpired:
        logger.error("❌ 데이터베이스 복원 시간이 초과되었습니다")
        return {"status": "타임아웃", "error": "복원 작업 시간이 초과되었습니다"}

    except FileNotFoundError as e:
        logger.error("❌ 복원 중 파일 오류: %s", e)
        return {"status": "오류", "error": str(e)}

    except (subprocess.SubprocessError, OSError) as e:
        logger.error("❌ 데이터베이스 복원에 실패했습니다: %s", e)
        return {"status": "오류", "error": str(e)}


async def get_database_health() -> dict:
    """
    종합적인 데이터베이스 상태 정보 가져오기
    """
    health_info = {
        "status": "알 수 없음",
        "connection": False,
        "tables": 0,
        "info": {},
        "performance": {},
    }

    try:
        # 기본 연결 확인
        health_info["connection"] = await check_database_connection()

        if health_info["connection"]:
            # 데이터베이스 정보 가져오기
            health_info["info"] = await get_database_info()

            # 테이블 정보 가져오기
            table_info = await get_table_info()
            health_info["tables"] = table_info.get("total_tables", 0)

            # 성능 지표 가져오기
            health_info["performance"] = await get_performance_metrics()

            health_info["status"] = "정상"
        else:
            health_info["status"] = "비정상"

    except (OperationalError, DatabaseError, SQLAlchemyError) as e:
        health_info["status"] = "오류"
        health_info["error"] = str(e)
        logger.error("데이터베이스 상태 확인에 실패했습니다: %s", e)

    return health_info


async def get_performance_metrics() -> dict:
    """
    데이터베이스 성능 지표 가져오기
    """
    try:
        async with engine.begin() as conn:
            # 연결 수 가져오기
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

            # 데이터베이스 크기 가져오기
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

            # 캐시 적중률 가져오기
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
        logger.warning("성능 지표 가져오는 중 연결 오류: %s", e)
        return {"error": "연결 오류"}
    except DatabaseError as e:
        logger.warning("성능 지표 가져오는 중 데이터베이스 오류: %s", e)
        return {"error": "데이터베이스 오류"}
    except SQLAlchemyError as e:
        logger.warning("성능 지표 가져오는 중 SQLAlchemy 오류: %s", e)
        return {"error": "SQLAlchemy 오류"}


# 데이터베이스 이벤트 핸들러
async def on_database_connect():
    """
    데이터베이스 연결 이벤트 핸들러
    """
    logger.info("🔗 데이터베이스가 연결되었습니다")


async def on_database_disconnect():
    """
    데이터베이스 연결 해제 이벤트 핸들러
    """
    logger.info("🔌 데이터베이스 연결이 해제되었습니다")


# 연결 풀 관리
async def close_database_connections():
    """
    모든 데이터베이스 연결 닫기
    """
    try:
        await engine.dispose()
        logger.info("🔌 데이터베이스 연결이 닫혔습니다")
    except (OperationalError, DatabaseError, SQLAlchemyError) as e:
        logger.error("❌ 데이터베이스 연결 닫기 오류: %s", e)


# 데이터베이스 마이그레이션 도우미
async def check_migration_status():
    """
    데이터베이스 마이그레이션 상태 확인
    """
    try:
        async with engine.begin() as conn:
            # alembic 버전 테이블이 존재하는지 확인
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
                # 현재 마이그레이션 버전 가져오기
                version_result = await conn.execute(
                    text(
                        """
                    SELECT version_num FROM alembic_version
                """
                    )
                )
                current_version = version_result.scalar()

                return {
                    "status": "관리됨",
                    "current_version": current_version,
                    "has_migrations": True,
                }
            else:
                return {
                    "status": "관리되지 않음",
                    "current_version": None,
                    "has_migrations": False,
                }

    except OperationalError as e:
        logger.error("마이그레이션 상태 확인 중 연결 오류: %s", e)
        return {"status": "연결_오류", "error": str(e)}
    except DatabaseError as e:
        logger.error("마이그레이션 상태 확인 중 데이터베이스 오류: %s", e)
        return {"status": "데이터베이스_오류", "error": str(e)}
    except SQLAlchemyError as e:
        logger.error("마이그레이션 상태 확인 중 SQLAlchemy 오류: %s", e)
        return {"status": "sqlalchemy_오류", "error": str(e)}


# Alembic 마이그레이션용
def get_sync_engine():
    """
    Alembic 마이그레이션을 위한 동기 엔진 가져오기
    """
    return create_engine(get_sync_database_url())


# 유틸리티 함수
def get_engine():
    """데이터베이스 엔진 인스턴스 가져오기"""
    return engine


def get_session_factory():
    """세션 팩토리 가져오기"""
    return AsyncSessionLocal


async def execute_raw_sql(sql: str, params: dict | None = None) -> list:
    """
    원시 SQL 쿼리 실행 (주의해서 사용)
    """
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text(sql), params or {})
            if result.returns_rows:
                return list(result.fetchall())
            else:
                return []
    except OperationalError as e:
        logger.error("원시 SQL 실행 중 연결 오류: %s", e)
        raise
    except DatabaseError as e:
        logger.error("원시 SQL 실행 중 데이터베이스 오류: %s", e)
        raise
    except SQLAlchemyError as e:
        logger.error("원시 SQL 실행 중 SQLAlchemy 오류: %s", e)
        raise


# 데이터베이스 모니터링
class DatabaseMonitor:
    """데이터베이스 모니터링 유틸리티"""

    @staticmethod
    async def get_slow_queries(page_size: int = 10):
        """느린 실행 쿼리 가져오기"""
        try:
            async with engine.begin() as conn:
                result = await conn.execute(
                    text(
                        """
                    SELECT query, mean_time, calls, total_time
                    FROM pg_stat_statements
                    ORDER BY mean_time DESC
                    LIMIT :page_size
                """
                    ),
                    {"page_size": page_size},
                )

                return [dict(row) for row in result.fetchall()]
        except (OperationalError, DatabaseError, SQLAlchemyError) as e:
            logger.warning("느린 쿼리를 가져올 수 없습니다: %s", e)
            return []

    @staticmethod
    async def get_table_sizes():
        """테이블 크기 가져오기"""
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
            logger.warning("테이블 크기를 가져올 수 없습니다: %s", e)
            return []


# 전역 데이터베이스 모니터 인스턴스
db_monitor = DatabaseMonitor()


# 데이터베이스 정리 유틸리티
async def cleanup_old_sessions(days: int = 30) -> int:
    """
    오래된 사용자 세션 정리
    """
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        async with AsyncSessionLocal() as session:
            # 만료된 세션 삭제
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

            logger.info("🧹 %d개의 오래된 세션을 정리했습니다", deleted_count)
            return deleted_count

    except OperationalError as e:
        logger.error("❌ 세션 정리 중 연결 오류: %s", e)
        return 0
    except DatabaseError as e:
        logger.error("❌ 세션 정리 중 데이터베이스 오류: %s", e)
        return 0
    except SQLAlchemyError as e:
        logger.error("❌ 세션 정리 중 SQLAlchemy 오류: %s", e)
        return 0


async def cleanup_old_logs(days: int = 90) -> int:
    """
    오래된 활동 로그 정리
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        async with AsyncSessionLocal() as session:
            # 오래된 활동 로그 삭제
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

            logger.info("🧹 %d개의 오래된 활동 로그를 정리했습니다", deleted_count)
            return deleted_count

    except OperationalError as e:
        logger.error("❌ 로그 정리 중 연결 오류: %s", e)
        return 0
    except DatabaseError as e:
        logger.error("❌ 로그 정리 중 데이터베이스 오류: %s", e)
        return 0
    except SQLAlchemyError as e:
        logger.error("❌ 로그 정리 중 SQLAlchemy 오류: %s", e)
        return 0


async def vacuum_database():
    """
    유지보수를 위해 데이터베이스에서 VACUUM ANALYZE 실행
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("VACUUM ANALYZE"))
            logger.info("🧹 데이터베이스 정리가 완료되었습니다")
            return True
    except OperationalError as e:
        logger.error("❌ 정리 중 연결 오류: %s", e)
        return False
    except DatabaseError as e:
        logger.error("❌ 정리 중 데이터베이스 오류: %s", e)
        return False
    except SQLAlchemyError as e:
        logger.error("❌ 정리 중 SQLAlchemy 오류: %s", e)
        return False
