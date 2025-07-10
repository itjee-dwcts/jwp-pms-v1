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
from fastapi import APIRouter, FastAPI
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


# 기본 함수들을 먼저 정의 (import 실패에 대비)
def default_setup_logging():
    """
    기본 로깅 설정 함수
    utils.logger import가 실패할 경우 사용되는 대체 함수
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    print("⚠️ 기본 로깅 설정을 사용합니다.")


async def default_check_database_connection() -> bool:
    """
    기본 데이터베이스 연결 확인 함수 (항상 False 반환)
    """
    return False


async def default_create_tables() -> None:
    """
    기본 테이블 생성 함수 (아무것도 하지 않음)
    """


# 기본값으로 설정
setup_logging = default_setup_logging
check_database_connection = default_check_database_connection
create_tables = default_create_tables


# 기본 설정 클래스 정의 (전역으로 이동)
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


# 기본 라우터들을 전역으로 정의 (import 실패에 대비)
auth_router = APIRouter()
calendar_router = APIRouter()
dashboard_router = APIRouter()
health_router = APIRouter()
projects_router = APIRouter()
system_router = APIRouter()
tasks_router = APIRouter()
uploads_router = APIRouter()
users_router = APIRouter()
chat_router = APIRouter()

# 기본 설정으로 시작
settings = DefaultSettings()
IMPORT_SUCCESS = False
IMPORT_STEP = "start"

# 로컬 모듈 imports (경로 설정 후)
# print("✅ Import 로딩중...", flush=True)
# sys.stdout.flush()

try:
    # API 라우터 imports

    IMPORT_STEP = "api.auth"
    from api.auth import router as auth_router

    IMPORT_STEP = "api.calendar"
    from api.calendar import router as calendar_router

    IMPORT_STEP = "api.chat"
    from api.chat import router as chat_router

    IMPORT_STEP = "api.dashboard"
    from api.dashboard import router as dashboard_router

    IMPORT_STEP = "api.health"
    from api.health import router as health_router

    IMPORT_STEP = "api.project"
    from api.project import router as projects_router

    IMPORT_STEP = "api.system"
    from api.system import router as system_router

    IMPORT_STEP = "api.task"
    from api.task import router as tasks_router

    IMPORT_STEP = "api.uploads"
    from api.uploads import router as uploads_router

    IMPORT_STEP = "api.user"
    from api.user import router as users_router

    # 핵심 모듈 imports
    IMPORT_STEP = "core.config"
    from core.config import get_settings

    IMPORT_STEP = "core.database"
    from core.database import check_database_connection, create_tables

    IMPORT_STEP = "utils.logger"
    from utils.logger import setup_logging

    # 성공적으로 import된 경우 settings 가져오기
    settings = get_settings()
    IMPORT_SUCCESS = True
    IMPORT_STEP = "complete"

    print("✅ 모든 모듈이 성공적으로 import되었습니다.")

except ImportError as e:
    print(f"❌ Import 오류 발생: {e}")
    print(f"현재 Python 경로: {sys.path}")
    print(f"src 디렉토리: {src_dir}")
    print(f"backend 디렉토리: {backend_dir}")
    print(f"import 단계: {IMPORT_STEP}")

    # 대체 import 시도 (절대 경로)
    try:
        import importlib.util

        # 모듈 경로를 직접 지정해서 import
        def import_module_from_path(module_name: str, file_path: Path):
            """주어진 파일 경로에서 모듈을 동적으로 로드하는 함수"""
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                return module
            raise ImportError(f"Could not load {module_name} from {file_path}")

        # 설정 모듈 로드 시도
        config_path = src_dir / "core" / "config.py"
        if config_path.exists():
            settings_module = import_module_from_path("settings", config_path)
            settings = settings_module.get_settings()
            print("✅ 설정 모듈을 직접 로드했습니다.")
        else:
            raise ImportError("설정 파일을 찾을 수 없습니다.") from e

    except ImportError as fallback_error:
        print(f"❌ 대체 import도 실패: {fallback_error}")
        print("⚠️ 기본 설정으로 실행을 시도합니다...")

        # 기본 설정 사용 (이미 위에서 정의됨)
        print("⚠️ 기본 설정과 빈 라우터를 사용합니다.")


# 로깅 설정 (이제 안전하게 호출 가능)
setup_logging()
logger = logging.getLogger(__name__)

# import 결과 로그
if IMPORT_SUCCESS:
    logger.info("✅ 모든 모듈 import 성공")
else:
    logger.warning("⚠️ 일부 모듈 import 실패 - 기본 설정으로 실행")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """
    애플리케이션 생명주기 이벤트
    시작과 종료 시 필요한 작업들을 처리합니다.
    """
    # 시작 로직
    logger.info("🚀 PMS 백엔드 API 시작 중...")
    logger.info("🌍 실행 환경: %s", getattr(settings, "ENVIRONMENT", "unknown"))
    logger.info("🔧 디버그 모드: %s", getattr(settings, "DEBUG", False))

    # 데이터베이스 연결 확인 (import 성공 시만)
    if IMPORT_SUCCESS:
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
    else:
        logger.warning("⚠️ 모듈 import 실패로 데이터베이스 연결을 확인하지 않습니다")

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
    logger.info("🌐 CORS가 다음 도메인에 대해 활성화되었습니다: %s", cors_origins)

# 정적 파일 설정
UPLOAD_PATH = getattr(settings, "UPLOAD_PATH", "uploads")
uploads_dir = Path(UPLOAD_PATH)
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
            "import_status": "완전" if IMPORT_SUCCESS else "제한적",
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
                "graphql": "/graphql",
            },
            "features": {
                "user_management": "✅ 사용 가능" if IMPORT_SUCCESS else "⚠️ 제한적",
                "project_management": "✅ 사용 가능" if IMPORT_SUCCESS else "⚠️ 제한적",
                "task_management": "✅ 사용 가능" if IMPORT_SUCCESS else "⚠️ 제한적",
                "calendar": "✅ 사용 가능" if IMPORT_SUCCESS else "⚠️ 제한적",
                "file_upload": "✅ 사용 가능" if IMPORT_SUCCESS else "⚠️ 제한적",
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
        # 데이터베이스 연결 확인 (import 성공 시만)
        db_status = await check_database_connection() if IMPORT_SUCCESS else False

        return JSONResponse(
            {
                "status": "정상" if db_status else "성능 저하",
                "version": getattr(settings, "VERSION", "0.1.0"),
                "environment": getattr(settings, "ENVIRONMENT", "development"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "import_status": "완전" if IMPORT_SUCCESS else "제한적",
                "checks": {
                    "database": ("✅ 연결됨" if db_status else "❌ 연결 끊김"),
                    "api": "✅ 실행 중",
                    "uploads": "✅ 사용 가능",
                    "modules": "✅ 완전 로드됨" if IMPORT_SUCCESS else "⚠️ 부분 로드됨",
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


logger.info("📋 API 라우터 등록 시작")

# API 라우터 포함 (이제 안전하게 사용 가능)
API_V1_STR = getattr(settings, "API_V1_STR", "/api/v1")

# 기본 상태 확인은 항상 포함
app.include_router(health_router, prefix=API_V1_STR, tags=["상태확인"])
app.include_router(system_router, prefix=API_V1_STR, tags=["시스템"])

# 나머지 라우터들 포함
app.include_router(auth_router, prefix=f"{API_V1_STR}/auth", tags=["인증"])
app.include_router(users_router, prefix=f"{API_V1_STR}/users", tags=["사용자"])
app.include_router(projects_router, prefix=f"{API_V1_STR}/projects", tags=["프로젝트"])
app.include_router(tasks_router, prefix=f"{API_V1_STR}/tasks", tags=["작업"])
app.include_router(calendar_router, prefix=f"{API_V1_STR}/calendar", tags=["캘린더"])
app.include_router(
    dashboard_router, prefix=f"{API_V1_STR}/dashboard", tags=["대시보드"]
)
app.include_router(uploads_router, prefix=f"{API_V1_STR}/uploads", tags=["파일업로드"])
app.include_router(chat_router, prefix=f"{API_V1_STR}/chat", tags=["채팅"])

logger.info("📋 API 라우터 등록 완료")


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
        import_status = "완전" if IMPORT_SUCCESS else "제한적"
        return f"{project_name} v{version} (모듈 로드: {import_status})"


schema = strawberry.Schema(Query)
graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")


def find_free_port(start_port: int = 8001) -> int:
    """
    사용 가능한 포트를 찾는 함수

    Args:
        start_port: 시작 포트 번호 (기본값: 8001)

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
    port = find_free_port(8001)
    host = "127.0.0.1"

    project_name = getattr(settings, "PROJECT_NAME", "PMS Backend API")
    debug_mode = getattr(settings, "DEBUG", True)

    logger.info("🚀 %s 시작 중", project_name)
    logger.info("🌐 서버 URL: http://%s:%s", host, port)
    logger.info("📖 API 문서: http://%s:%s/docs", host, port)
    logger.info("🔧 상태 확인: http://%s:%s/health", host, port)
    logger.info("🔗 GraphQL 플레이그라운드: http://%s:%s/graphql", host, port)

    if not IMPORT_SUCCESS:
        logger.warning("⚠️ 일부 모듈이 로드되지 않았습니다. 제한된 기능으로 실행됩니다.")

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
