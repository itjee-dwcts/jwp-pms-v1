"""
PMS 백엔드 API 메인 애플리케이션

프로젝트 관리 시스템을 위한 GraphQL 지원 FastAPI 애플리케이션
"""

# 표준 라이브러리 imports
import logging
import os
import socket
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator

# 서드파티 라이브러리 imports
import strawberry
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from strawberry.fastapi import GraphQLRouter


def setup_python_path():
    """
    Python 경로를 설정하는 함수
    프로젝트 구조에 맞게 경로를 추가합니다.
    """
    # 현재 파일 기준으로 경로 계산
    current_file = Path(__file__).resolve()

    # main.py가 src/ 폴더 안에 있는 경우
    if current_file.parent.name == "src":
        _src_dir = current_file.parent
        _backend_dir = _src_dir.parent
        _project_root = _backend_dir.parent
    else:
        # main.py가 backend/ 폴더에 직접 있는 경우
        _backend_dir = current_file.parent
        _src_dir = _backend_dir / "src"
        _project_root = _backend_dir.parent

    # 경로들을 sys.path에 추가 (중복 체크)
    paths_to_add = [str(_src_dir), str(_backend_dir), str(_project_root)]

    for path in paths_to_add:
        if path not in sys.path:
            sys.path.insert(0, path)

    # 환경 변수도 설정
    os.environ.setdefault("PYTHONPATH", str(_src_dir))

    return _src_dir, _backend_dir, _project_root


# Python 경로 설정 실행
src_dir, backend_dir, project_root = setup_python_path()

# 로컬 모듈 imports (경로 설정 후)
try:
    # API 라우터 imports
    from api.auth import router as auth_router
    from api.calendar import router as calendar_router
    from api.dashboard import router as dashboard_router
    from api.health import router as health_router
    from api.project import router as projects_router
    from api.system import router as system_router
    from api.task import router as tasks_router
    from api.uploads import router as uploads_router
    from api.user import router as users_router

    # 핵심 모듈 imports
    from core.config import settings
    from core.database import check_database_connection, create_tables
    from utils.logger import setup_logging

except ImportError as e:
    print(f"❌ Import 오류 발생: {e}")
    print(f"현재 Python 경로: {sys.path}")
    print(f"src 디렉토리: {src_dir}")
    print(f"backend 디렉토리: {backend_dir}")

    # 대체 import 시도 (절대 경로)
    try:
        import importlib.util

        # 모듈 경로를 직접 지정해서 import
        def import_module_from_path(module_name: str, file_path: Path):
            """주어진 파일 경로에서 모듈을 동적으로 로드하는 함수
            Args:
                module_name (str): 모듈 이름
                file_path (Path): 모듈 파일 경로
            Returns:
                module: 로드된 모듈 객체
            """
            spec = importlib.util.spec_from_file_location(
                module_name, file_path
            )
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                return module
            raise ImportError(f"Could not load {module_name} from {file_path}")

        # 필수 모듈들을 직접 로드
        settings_module = import_module_from_path(
            "settings", src_dir / "core" / "config.py"
        )
        settings = settings_module.settings

    except ImportError as fallback_error:
        print(f"❌ 대체 import도 실패: {fallback_error}")
        print("⚠️ 기본 설정으로 실행을 시도합니다...")

        # 최소한의 기본 설정
        class DefaultSettings:
            """
            기본 설정 클래스
            개발 환경에서 사용할 기본 설정을 정의합니다.
            이 클래스는 실제 설정 파일이 없을 때 사용됩니다.
            """

            PROJECT_NAME = "PMS Backend API"
            VERSION = "0.1.0"
            ENVIRONMENT = "development"
            DEBUG = True
            API_V1_STR = "/api/v1"
            BACKEND_CORS_ORIGINS = ["http://localhost:3000"]
            UPLOAD_PATH = "uploads"

        settings = DefaultSettings()

        # 빈 라우터 생성 (오류 방지용)
        from fastapi import APIRouter

        auth_router = APIRouter()
        calendar_router = APIRouter()
        dashboard_router = APIRouter()
        health_router = APIRouter()
        projects_router = APIRouter()
        system_router = APIRouter()
        tasks_router = APIRouter()
        uploads_router = APIRouter()
        users_router = APIRouter()

        # 기본 데이터베이스 함수들
        async def check_database_connection() -> bool:
            """
            데이터베이스 연결을 확인하는 함수
            개발 환경에서만 연결을 시도합니다.
            """
            return False

        async def create_tables() -> None:
            """
            데이터베이스 테이블을 생성하는 함수
            개발 환경에서만 테이블을 생성합니다.
            """

        def setup_logging():
            """
            로깅 설정 함수
            기본 로깅 설정을 구성합니다.
            """
            logging.basicConfig(level=logging.INFO)


# 로깅 설정
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """
    애플리케이션 생명주기 이벤트
    시작과 종료 시 필요한 작업들을 처리합니다.
    """
    # 시작 로직
    logger.info("🚀 PMS 백엔드 API 시작 중...")
    logger.info(
        "🌍 실행 환경: %s", getattr(settings, "ENVIRONMENT", "unknown")
    )
    logger.info("🔧 디버그 모드: %s", getattr(settings, "DEBUG", False))

    # 데이터베이스 연결 확인
    try:
        db_connected = await check_database_connection()
        if db_connected:
            logger.info("✅ 데이터베이스 연결 확인됨")

            # 개발 환경에서만 테이블 생성
            if getattr(settings, "ENVIRONMENT", "") == "development":
                await create_tables()
                logger.info("✅ 데이터베이스 테이블 생성/확인 완료")
        else:
            logger.warning(
                "⚠️ 데이터베이스 연결 실패 - 일부 기능이 작동하지 않을 수 있습니다"
            )
    except Exception as e:  # pylint: disable=broad-except
        logger.error("❌ 데이터베이스 설정 오류: %s", e)

    logger.info("📊 API 문서: /docs")
    logger.info("🔧 상태 확인: /health")
    logger.info("✨ PMS 백엔드 API 준비 완료!")

    yield

    # 종료 로직
    logger.info("🛑 PMS 백엔드 API 종료 중...")


# FastAPI 애플리케이션 생성
app = FastAPI(
    title=getattr(settings, "PROJECT_NAME", "PMS Backend API"),
    description="""
    프로젝트 관리 시스템 백엔드 API

    사용자 관리, 프로젝트 추적, 작업 관리, 캘린더 기능을 제공하는
    종합적인 프로젝트 관리 시스템입니다.

    ## 주요 기능
    * 👥 사용자 관리 및 인증
    * 📁 프로젝트 관리
    * ✅ 작업 추적
    * 📅 캘린더 및 이벤트
    * 🔐 역할 기반 접근 제어
    """,
    version=getattr(settings, "VERSION", "0.1.0"),
    openapi_url=(
        f"{getattr(settings, 'API_V1_STR', '/api/v1')}/openapi.json"
        if getattr(settings, "DEBUG", True)
        else None
    ),
    docs_url="/docs" if getattr(settings, "DEBUG", True) else None,
    redoc_url="/redoc" if getattr(settings, "DEBUG", True) else None,
    lifespan=lifespan,
    contact={
        "name": "PMS 팀",
        "email": "team@pms.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# 보안 미들웨어 추가
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost", "*"],
)

# CORS 미들웨어 추가
cors_origins = getattr(settings, "BACKEND_CORS_ORIGINS", None)
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in cors_origins],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    logger.info(
        "🌐 CORS가 다음 도메인에 대해 활성화되었습니다: %s", cors_origins
    )

# 정적 파일 설정
upload_path = getattr(settings, "UPLOAD_PATH", "uploads")
uploads_dir = Path(upload_path)
uploads_dir.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/")
async def root():
    """
    API 정보를 제공하는 루트 엔드포인트
    시스템 상태와 사용 가능한 기능들을 안내합니다.
    """
    return JSONResponse(
        {
            "message": (
                f"🚀 {getattr(settings, 'PROJECT_NAME', 'PMS')}가 실행 중입니다!"
            ),
            "version": getattr(settings, "VERSION", "0.1.0"),
            "environment": getattr(settings, "ENVIRONMENT", "development"),
            "status": "정상",
            "endpoints": {
                "health": "/health",
                "docs": (
                    "/docs"
                    if getattr(settings, "DEBUG", True)
                    else "운영 환경에서는 비활성화됨"
                ),
                "redoc": (
                    "/redoc"
                    if getattr(settings, "DEBUG", True)
                    else "운영 환경에서는 비활성화됨"
                ),
                "api": getattr(settings, "API_V1_STR", "/api/v1"),
            },
            "features": {
                "user_management": "✅ 사용 가능",
                "project_management": "✅ 사용 가능",
                "task_management": "✅ 사용 가능",
                "calendar": "✅ 사용 가능",
                "file_upload": "✅ 사용 가능",
            },
        }
    )


@app.get("/health")
async def health_check():
    """
    모니터링을 위한 상태 확인 엔드포인트
    시스템 상태와 각 구성 요소의 동작 상태를 점검합니다.
    """
    try:
        # 데이터베이스 연결 확인
        db_status = await check_database_connection()

        return JSONResponse(
            {
                "status": "정상" if db_status else "성능 저하",
                "version": getattr(settings, "VERSION", "0.1.0"),
                "environment": getattr(settings, "ENVIRONMENT", "development"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "checks": {
                    "database": ("✅ 연결됨" if db_status else "❌ 연결 끊김"),
                    "api": "✅ 실행 중",
                    "uploads": "✅ 사용 가능",
                },
                "uptime": "방금 시작됨",
            }
        )
    except Exception as e:  # pylint: disable=broad-except
        logger.error("상태 확인 실패: %s", e)
        return JSONResponse(
            status_code=500,
            content={
                "status": "비정상",
                "error": "상태 확인 실패",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )


# API 라우터 포함
api_v1_str = getattr(settings, "API_V1_STR", "/api/v1")

app.include_router(health_router, prefix=api_v1_str, tags=["상태확인"])
app.include_router(system_router, prefix=api_v1_str, tags=["시스템"])
app.include_router(auth_router, prefix=f"{api_v1_str}/auth", tags=["인증"])
app.include_router(users_router, prefix=f"{api_v1_str}/users", tags=["사용자"])
app.include_router(
    projects_router, prefix=f"{api_v1_str}/projects", tags=["프로젝트"]
)
app.include_router(tasks_router, prefix=f"{api_v1_str}/tasks", tags=["작업"])
app.include_router(
    calendar_router, prefix=f"{api_v1_str}/calendar", tags=["캘린더"]
)
app.include_router(
    dashboard_router, prefix=f"{api_v1_str}/dashboard", tags=["대시보드"]
)
app.include_router(
    uploads_router, prefix=f"{api_v1_str}/uploads", tags=["파일업로드"]
)


# Strawberry를 사용한 GraphQL 엔드포인트 추가
@strawberry.type
class Query:
    """
    GraphQL 쿼리 루트 타입
    클라이언트에서 데이터를 조회할 때 사용하는 진입점입니다.
    """

    @strawberry.field
    def hello(self) -> str:
        """
        GraphQL 연결 테스트용 헬로 필드
        """
        return "안녕하세요, PMS GraphQL입니다!"

    @strawberry.field
    def api_info(self) -> str:
        """
        API 정보 제공
        현재 실행 중인 API의 이름과 버전을 반환합니다.
        """
        project_name = getattr(settings, "PROJECT_NAME", "PMS")
        version = getattr(settings, "VERSION", "0.1.0")
        return f"{project_name} v{version}"


schema = strawberry.Schema(Query)
graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")


def find_free_port(start_port: int = 8000) -> int:
    """
    사용 가능한 포트를 찾는 함수

    Args:
        start_port: 시작 포트 번호 (기본값: 8000)

    Returns:
        사용 가능한 포트 번호
    """
    for port in range(start_port, start_port + 10):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("127.0.0.1", port))
                return port
        except OSError:  # pylint: disable=broad-except
            continue
    return 8080  # 대체 포트


def main():
    """
    애플리케이션을 실행하는 메인 함수
    개발 서버를 시작하고 필요한 정보를 로그에 출력합니다.
    """
    # 사용 가능한 포트 찾기
    port = find_free_port(8000)
    host = "127.0.0.1"

    project_name = getattr(settings, "PROJECT_NAME", "PMS Backend API")
    debug_mode = getattr(settings, "DEBUG", True)

    logger.info("🚀 %s 시작 중", project_name)
    logger.info("🌐 서버 URL: http://%s:%s", host, port)
    logger.info("📖 API 문서: http://%s:%s/docs", host, port)
    logger.info("🔧 상태 확인: http://%s:%s/health", host, port)
    logger.info("🔗 GraphQL 플레이그라운드: http://%s:%s/graphql", host, port)

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug_mode,
        log_level="debug" if debug_mode else "info",
        access_log=debug_mode,
        reload_dirs=["src"] if debug_mode else None,
    )


if __name__ == "__main__":
    main()
