"""
데이터베이스 유틸리티

데이터베이스 작업 및 상태 확인을 위한 도우미 함수들입니다.
"""

import logging
from typing import Any, Dict

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from core.database import AsyncSessionLocal, Base, engine

logger = logging.getLogger(__name__)


async def check_database_health() -> Dict[str, Any]:
    """
    종합적인 데이터베이스 상태 확인
    """
    health_info = {
        "status": "알 수 없음",
        "connection": False,
        "tables": [],
        "version": None,
        "error": None,
    }

    try:
        async with engine.begin() as conn:
            # 기본 연결 테스트
            result = await conn.execute(text("SELECT 1"))
            health_info["connection"] = result.fetchone() is not None

            # 데이터베이스 버전 가져오기
            try:
                version_result = await conn.execute(text("SELECT version()"))
                version_row = version_result.fetchone()
                if version_row:
                    health_info["version"] = version_row[0]
            except SQLAlchemyError as e:
                logger.warning("데이터베이스 버전을 가져올 수 없습니다: %s", e)

            # 테이블 존재 여부 확인
            try:
                tables_result = await conn.execute(
                    text(
                        """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """
                    )
                )
                health_info["tables"] = [row[0] for row in tables_result.fetchall()]
            except SQLAlchemyError as e:
                logger.warning("테이블 목록을 가져올 수 없습니다: %s", e)

            health_info["status"] = "정상"

    except SQLAlchemyError as e:
        health_info["status"] = "비정상"
        health_info["error"] = str(e)
        logger.error("데이터베이스 상태 확인에 실패했습니다: %s", e)

    return health_info


async def test_database_operations() -> Dict[str, Any]:
    """
    기본적인 데이터베이스 작업 테스트
    """
    test_results = {
        "connection": False,
        "create_session": False,
        "query_execution": False,
        "transaction": False,
        "error": None,
    }

    try:
        # 연결 테스트
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            test_results["connection"] = True

        # 세션 생성 테스트
        async with AsyncSessionLocal() as session:
            test_results["create_session"] = True

            # 쿼리 실행 테스트
            result = await session.execute(text("SELECT CURRENT_TIMESTAMP"))
            timestamp = result.fetchone()
            if timestamp:
                test_results["query_execution"] = True

            # 트랜잭션 테스트
            try:
                await session.execute(text("SELECT 1"))
                await session.commit()
                test_results["transaction"] = True
            except Exception as e:
                await session.rollback()
                raise e

    except SQLAlchemyError as e:
        test_results["error"] = str(e)
        logger.error("데이터베이스 작업 테스트에 실패했습니다: %s", e)

    return test_results


async def get_database_stats() -> Dict[str, Any]:
    """
    데이터베이스 통계 및 정보 가져오기
    """
    stats = {
        "database_size": None,
        "table_count": 0,
        "connection_count": None,
        "uptime": None,
        "error": None,
    }

    try:
        async with engine.begin() as conn:
            # 데이터베이스 크기 가져오기
            try:
                size_result = await conn.execute(
                    text(
                        """
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """
                    )
                )
                size_row = size_result.fetchone()
                if size_row:
                    stats["database_size"] = size_row[0]
            except SQLAlchemyError as e:
                logger.warning("데이터베이스 크기를 가져올 수 없습니다: %s", e)

            # 테이블 개수 가져오기
            try:
                count_result = await conn.execute(
                    text(
                        """
                    SELECT COUNT(*)
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                """
                    )
                )
                count_row = count_result.fetchone()
                if count_row:
                    stats["table_count"] = count_row[0]
            except SQLAlchemyError as e:
                logger.warning("테이블 개수를 가져올 수 없습니다: %s", e)

            # 연결 개수 가져오기
            try:
                conn_result = await conn.execute(
                    text(
                        """
                    SELECT COUNT(*)
                    FROM pg_stat_activity
                    WHERE state = 'active'
                """
                    )
                )
                conn_row = conn_result.fetchone()
                if conn_row:
                    stats["connection_count"] = conn_row[0]
            except SQLAlchemyError as e:
                logger.warning("연결 개수를 가져올 수 없습니다: %s", e)

            # 가동 시간 가져오기
            try:
                uptime_result = await conn.execute(
                    text(
                        """
                    SELECT date_trunc(
                        'second',
                        current_timestamp - pg_postmaster_start_time()
                    )
                """
                    )
                )
                uptime_row = uptime_result.fetchone()
                if uptime_row:
                    stats["uptime"] = str(uptime_row[0])
            except SQLAlchemyError as e:
                logger.warning("가동 시간을 가져올 수 없습니다: %s", e)

    except SQLAlchemyError as e:
        stats["error"] = str(e)
        logger.error("데이터베이스 통계를 가져오는데 실패했습니다: %s", e)

    return stats


async def initialize_database():
    """
    기본 설정으로 데이터베이스 초기화
    """
    logger.info("🔧 데이터베이스를 초기화하는 중...")

    try:
        # 연결 확인
        health = await check_database_health()
        if health["status"] != "정상":
            raise ValueError(
                f"데이터베이스가 비정상입니다: {health.get('error', '알 수 없는 오류')}"
            )

        # 모든 모델을 가져와서 등록되도록 함

        # 테이블 생성
        async with engine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: logger.info("📊 데이터베이스 테이블을 생성하는 중...")
            )

            await conn.run_sync(Base.metadata.create_all)

        logger.info("✅ 데이터베이스 초기화가 완료되었습니다")
        return True

    except SQLAlchemyError as e:
        logger.error("❌ 데이터베이스 초기화에 실패했습니다: %s", e)
        return False


async def reset_database():
    """
    데이터베이스 재설정 (모든 테이블 삭제 후 재생성) - 주의해서 사용하세요!
    """
    logger.warning("⚠️ 데이터베이스를 재설정하는 중 - 모든 데이터가 손실됩니다!")

    try:
        async with engine.begin() as conn:
            # 모든 테이블 삭제
            await conn.run_sync(Base.metadata.drop_all)
            logger.info("🗑️ 모든 테이블이 삭제되었습니다")

            # 모든 테이블 재생성
            await conn.run_sync(Base.metadata.create_all)
            logger.info("📊 모든 테이블이 재생성되었습니다")

        logger.info("✅ 데이터베이스 재설정이 완료되었습니다")
        return True

    except SQLAlchemyError as e:
        logger.error("❌ 데이터베이스 재설정에 실패했습니다: %s", e)
        return False
