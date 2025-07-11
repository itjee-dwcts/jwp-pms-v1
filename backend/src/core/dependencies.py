"""
FastAPI 의존성

인증, 데이터베이스, 권한을 위한 공통 의존성
"""

import logging
import time
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.user import UserRole
from core.database import get_async_session
from core.security import verify_token
from models.project import ProjectMember
from models.task import Task, TaskAssignment
from models.user import User

logger = logging.getLogger(__name__)

# HTTP Bearer 토큰 스키마
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> Optional[User]:
    """
    JWT 토큰에서 현재 사용자 조회
    """
    print("🔐 [DEBUG] get_current_user 함수 시작")

    if not credentials:
        print("❌ [DEBUG] credentials가 없음 - 토큰이 제공되지 않음")
        return None

    try:
        print(f"🔍 [DEBUG] 토큰 검증 시작 - token: {credentials.credentials[:20]}...")

        # JWT 토큰 디코딩
        token_data = verify_token(credentials.credentials)
        if token_data is None:
            print("❌ [DEBUG] 토큰 검증 실패 - verify_token이 None 반환")
            raise ValueError("토큰 검증에 실패했습니다")

        if token_data.sub is None:
            print("❌ [DEBUG] 토큰 데이터에 'sub' 클레임이 없음")
            raise ValueError("토큰 데이터에 'sub' 클레임이 없습니다")

        print(f"✅ [DEBUG] 토큰 검증 성공 - user_id: {token_data.sub}")

        # 데이터베이스에서 사용자 조회
        print(f"🔍 [DEBUG] 데이터베이스에서 사용자 조회 중 - user_id: {token_data.sub}")
        result = await db.execute(select(User).where(User.id == UUID(token_data.sub)))
        user = result.scalar_one_or_none()

        if not user:
            print(f"❌ [DEBUG] 사용자를 찾을 수 없음 - user_id: {token_data.sub}")
            logger.warning("토큰 주체에 대한 사용자를 찾을 수 없음: %s", token_data.sub)
            return None

        print(f"✅ [DEBUG] 사용자 조회 성공 - username: {user.username}, id: {user.id}")

        user_is_active = getattr(user, "is_active", False)
        if not user_is_active:
            print(
                f"❌ [DEBUG] 비활성 사용자 - username: {user.username}, id: {user.id}"
            )
            logger.warning("비활성 사용자가 접근을 시도함: %s", user.id)
            return None

        print(f"✅ [DEBUG] 활성 사용자 확인 완료 - username: {user.username}")

        # 마지막 활성 타임스탬프 업데이트
        print("🔄 [DEBUG] 마지막 활성 시간 업데이트 중...")
        user.update_last_active()
        await db.commit()

        print(f"✅ [DEBUG] get_current_user 완료 - 사용자: {user.username}")
        return user

    except Exception as e:  # pylint: disable=broad-except
        print(f"❌ [DEBUG] get_current_user 예외 발생: {e}")
        print(f"❌ [DEBUG] 예외 타입: {type(e)}")
        logger.warning("토큰 검증 실패: %s", e)
        return None


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> User:
    """
    현재 활성 사용자 조회 (인증되지 않은 경우 예외 발생)
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증되지 않았습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    현재 관리자 사용자 조회 (관리자가 아닌 경우 예외 발생)
    """
    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    if current_user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다",
        )

    return current_user


def require_role(required_role: str):
    """
    역할 기반 접근 제어를 위한 의존성 팩토리
    """

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not has_role(current_user, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"'{required_role}' 역할이 필요합니다",
            )
        return current_user

    return role_checker


def require_any_role(*required_roles: str):
    """
    다중 역할 기반 접근 제어를 위한 의존성 팩토리
    """

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not any(has_role(current_user, role) for role in required_roles):
            roles_str = ", ".join(required_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"다음 역할 중 하나가 필요합니다: {roles_str}",
            )
        return current_user

    return role_checker


def has_role(user: User, required_role: str) -> bool:
    """
    사용자가 필요한 역할을 가지고 있는지 확인
    """
    # 역할 계층: 관리자 > 프로젝트 매니저 > 개발자 > 뷰어
    role_hierarchy = {
        UserRole.ADMIN: 0,
        UserRole.MANAGER: 1,
        UserRole.DEVELOPER: 2,
        UserRole.VIEWER: 3,
    }

    role = getattr(user, "role", UserRole.GUEST)
    user_level = role_hierarchy.get(role, 0)
    required_level = role_hierarchy.get(required_role, 0)

    return user_level >= required_level


def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    관리자 역할을 요구하는 의존성
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    if current_user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다",
        )
    return current_user


def require_project_manager(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    프로젝트 매니저 역할 이상을 요구하는 의존성
    """
    if not has_role(current_user, UserRole.MANAGER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="프로젝트 매니저 권한이 필요합니다",
        )
    return current_user


def require_developer(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    개발자 역할 이상을 요구하는 의존성
    """
    if not has_role(current_user, UserRole.DEVELOPER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="개발자 권한이 필요합니다",
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_session),
) -> Optional[User]:
    """
    현재 사용자를 선택적으로 조회 (인증되지 않은 경우 예외 발생하지 않음)
    """
    return await get_current_user(credentials, db)


class RateLimiter:
    """
    간단한 속도 제한 의존성
    """

    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.requests = {}

    async def __call__(self, request):
        client_ip = request.client.host
        current_time = time.time()

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # 오래된 요청 제거
        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if current_time - req_time < self.period
        ]

        # 속도 제한 확인
        if len(self.requests[client_ip]) >= self.calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="요청 속도 제한을 초과했습니다",
            )

        # 현재 요청 추가
        self.requests[client_ip].append(current_time)


# 미리 정의된 속도 제한기
rate_limit_auth = RateLimiter(calls=10, period=60)  # 분당 10회 호출
rate_limit_api = RateLimiter(calls=100, period=60)  # 분당 100회 호출
rate_limit_upload = RateLimiter(calls=5, period=60)  # 분당 5회 업로드


async def verify_project_access(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> bool:
    """
    사용자가 특정 프로젝트에 접근할 수 있는지 확인
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)
    # 관리자는 모든 프로젝트에 접근 가능
    if current_user_role == UserRole.ADMIN:
        return True

    # 사용자가 프로젝트 멤버인지 확인
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()

    return member is not None


async def verify_task_access(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
) -> bool:
    """
    사용자가 특정 작업에 접근할 수 있는지 확인
    """

    current_user_role = getattr(current_user, "role", UserRole.GUEST)

    # 관리자는 모든 작업에 접근 가능
    if current_user_role == UserRole.ADMIN:
        return True

    # 작업 조회 및 프로젝트 멤버십 확인
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        return False

    # 사용자가 작업에 할당되었는지 확인
    assignment_result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == current_user.id,
        )
    )
    assignment = assignment_result.scalar_one_or_none()

    if assignment:
        return True

    # 사용자가 프로젝트 멤버인지 확인
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    member = member_result.scalar_one_or_none()

    return member is not None


def create_access_checker(resource_type: str):
    """
    리소스별 접근 검사기를 생성하는 팩토리 함수
    """

    async def access_checker(
        resource_id: int,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_async_session),
    ) -> bool:
        if resource_type == "project":
            return await verify_project_access(resource_id, current_user, db)
        elif resource_type == "task":
            return await verify_task_access(resource_id, current_user, db)
        else:
            # 기본값: 관리자만 접근 허용
            current_user_role = getattr(current_user, "role", UserRole.GUEST)
            return current_user_role == UserRole.ADMIN

    return access_checker


# 편의 의존성
require_project_access = create_access_checker("project")
require_task_access = create_access_checker("task")


async def get_pagination_params(
    page_no: int = 1,
    page_size: int = 20,
) -> dict:
    """
    검증이 포함된 페이지네이션 매개변수 조회
    """
    if page_no < 1:
        page_no = 1
    if page_size < 1:
        page_size = 1
    if page_size > 100:
        page_size = 100

    return {"page_no": (page_no - 1) * page_size, "page_size": page_size}


async def get_sort_params(
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    """
    검증이 포함된 정렬 매개변수 조회
    """
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "desc"

    return {
        "sort_by": sort_by,
        "sort_order": sort_order.lower(),
    }
