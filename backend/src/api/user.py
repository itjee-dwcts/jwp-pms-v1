"""
사용자 API Routes

관리자용 사용자 관리 엔드포인트
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user, require_admin
from models.user import User
from schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
)
from services.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def list_users(
    page_no: int = Query(0, ge=0, description="건너뛸 레코드 수"),
    page_size: int = Query(50, ge=1, le=100, description="반환할 레코드 수"),
    search_text: Optional[str] = Query(None, description="이름 또는 이메일로 검색"),
    user_role: Optional[str] = Query(None, description="역할별 필터"),
    user_status: Optional[str] = Query(None, description="상태별 필터"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    필터링 및 페이지네이션을 지원하는 사용자 목록 조회
    """
    try:
        print("[DEBUG] list_projects 호출됨")
        print(f"[DEBUG] 사용자 ID: {current_user.id}")
        print(f"[DEBUG] 페이지 번호: {page_no}, 페이지 크기: {page_size}")

        # 사용자 서비스 인스턴스 생성
        user_service = UserService(db)

        # 사용자 목록 조회
        print(f"[DEBUG] 사용자 목록 조회 시작: 페이지 {page_no}, 크기 {page_size}")
        print(
            f"[DEBUG] 검색 텍스트: {search_text}, 역할: {user_role}, 상태: {user_status}"
        )
        print(f"[DEBUG] 현재 사용자 ID: {current_user.id}")
        result = await user_service.list_users(
            user_id=UUID(str(current_user.id)),
            page_no=page_no,
            page_size=page_size,
            search_text=search_text,
            user_role=user_role,
            user_status=user_status,
        )

        print(f"[DEBUG] 서비스 호출 완료, 반환 타입: {type(result)}")

        # result가 None이거나 반복 불가한 경우 빈 리스트 반환
        if result is None:
            return UserListResponse.create_response(
                users=[],
                page_no=page_no,
                page_size=page_size,
                total_items=0,
            )

        # 이미 UserListResponse라면 그대로 반환
        if isinstance(result, UserListResponse):
            return result

        # 리스트라면 UserListResponse로 변환
        if isinstance(result, list):
            user_responses = [
                UserResponse.model_validate(user)
                for user in result  # type: ignore
            ]
            return UserListResponse.create_response(
                users=user_responses,
                page_no=page_no,
                page_size=page_size,
                total_items=len(user_responses),
            )

        # 기타 경우 오류 처리
        raise ValueError(f"예상치 못한 반환 타입: {type(result)}")

    except Exception as e:
        logger.error("사용자 목록 조회 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 목록을 조회할 수 없습니다",
        ) from e


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    # current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    ID로 사용자 조회
    """
    try:
        user_service = UserService(db)
        user = await user_service.get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다",
            )

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("사용자 %s 조회 오류: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자를 조회할 수 없습니다",
        ) from e


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새 사용자 생성 (관리자 전용)
    """
    try:
        user_service = UserService(db)

        # 사용자가 이미 존재하는지 확인
        existing_user = await user_service.get_user_by_email_or_username(
            user_data.email, user_data.username
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 이메일 또는 사용자명입니다",
            )

        user = await user_service.create_user(
            user_data, by_user_id=UUID(str(current_user.id))
        )

        logger.info(
            "관리자 %s에 의해 사용자가 생성됨: %s", current_user.username, user.username
        )

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("사용자 생성 오류: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자를 생성할 수 없습니다",
        ) from e


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자 수정 (관리자 전용)
    """
    try:
        user_service = UserService(db)
        user = await user_service.update_user(
            user_id, user_data, by_user_id=UUID(str(current_user.id))
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다",
            )

        logger.info(
            "관리자 %s에 의해 사용자가 수정됨: %s", current_user.username, user.username
        )

        return UserResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("사용자 %s 수정 오류: %s", user_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자를 수정할 수 없습니다",
        ) from e


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자 삭제 (관리자 전용)
    """
    try:
        user_service = UserService(db)
        success = await user_service.delete_user(
            user_id, by_user_id=UUID(str(current_user.id))
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다",
            )

        logger.info(
            "관리자 %s에 의해 사용자가 삭제됨: %s", current_user.username, user_id
        )

        return {"message": "사용자가 성공적으로 삭제되었습니다"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("사용자 %s 삭제 오류: %s", user_id, e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자를 삭제할 수 없습니다",
        ) from e


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
):
    """현재 사용자 프로필 조회"""
    return UserResponse.model_validate(current_user)
