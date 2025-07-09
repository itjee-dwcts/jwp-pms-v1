"""
채팅 API Routes

OpenAI API와 연동하는 채팅 기능 엔드포인트
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.dependencies import get_current_active_user
from models.user import User
from schemas.chat import (
    ChatMessageCreateRequest,
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatMessageSearchRequest,
    ChatSessionCreateRequest,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionSearchRequest,
    ChatSessionUpdateRequest,
    ChatTemplateCreateRequest,
    ChatTemplateListResponse,
    ChatTemplateResponse,
    ChatTemplateSearchRequest,
    ChatUsageStatsResponse,
    OpenAIMessageRequest,
    OpenAIResponse,
)
from services.chat import ChatService
from utils.exceptions import AuthorizationError, BusinessException, NotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# 채팅 세션 관리 API
# ============================================================================


@router.post(
    "/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_chat_session(
    session_data: ChatSessionCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새로운 채팅 세션 생성

    - **title**: 세션 제목 (필수)
    - **description**: 세션 설명 (선택)
    - **model**: 사용할 OpenAI 모델 (기본: gpt-3.5-turbo)
    - **temperature**: 응답 창의성 0.0-2.0 (기본: 0.7)
    - **max_tokens**: 최대 토큰 수 (기본: 1000)
    - **system_prompt**: 시스템 프롬프트 (선택)
    - **tags**: 태그 목록 (선택)
    """
    try:
        logger.info("채팅 세션 생성 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)
        session = await chat_service.create_session(
            user_id=str(current_user.id), session_data=session_data
        )

        return session

    except NotFoundError as e:
        logger.warning("사용자를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 세션 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 세션 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션을 생성할 수 없습니다.",
        ) from e


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_chat_sessions(
    search_text: str = Query(None, description="검색어"),
    session_status: str = Query(None, description="세션 상태"),
    model: str = Query(None, description="사용 모델"),
    is_pinned: bool = Query(None, description="고정 여부"),
    is_favorite: bool = Query(None, description="즐겨찾기 여부"),
    page_no: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자의 채팅 세션 목록 조회

    **필터 옵션:**
    - **search_text**: 제목이나 설명에서 검색
    - **session_status**: 세션 상태 (active, inactive, archived)
    - **model**: OpenAI 모델 필터
    - **is_pinned**: 고정된 세션만 조회
    - **is_favorite**: 즐겨찾기 세션만 조회
    """
    try:
        logger.info("채팅 세션 목록 조회 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)

        search_params = ChatSessionSearchRequest(
            search_text=search_text,
            status=session_status,
            model=model,
            is_pinned=is_pinned,
            is_favorite=is_favorite,
            tags=None,
            start_date=None,
            end_date=None,
        )

        result = await chat_service.list_sessions(
            user_id=str(current_user.id),
            page_no=page_no,
            page_size=page_size,
            search_params=search_params,
        )

        return result

    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 세션 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 세션 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션 목록을 조회할 수 없습니다.",
        ) from e


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    특정 채팅 세션 정보 조회
    """
    try:
        logger.info(
            "채팅 세션 조회 요청: session_id=%s, user_id=%s",
            session_id,
            current_user.id,
        )
        chat_service = ChatService(db)
        session = await chat_service.get_session_by_id(
            session_id=session_id, user_id=str(current_user.id)
        )

        return session

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("채팅 세션 접근 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 세션 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 세션 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션을 조회할 수 없습니다.",
        ) from e


@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: str,
    update_data: ChatSessionUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    채팅 세션 정보 수정

    **수정 가능한 필드:**
    - **title**: 세션 제목
    - **description**: 세션 설명
    - **model**: OpenAI 모델
    - **temperature**: 응답 창의성
    - **max_tokens**: 최대 토큰 수
    - **system_prompt**: 시스템 프롬프트
    - **tags**: 태그 목록
    - **is_pinned**: 고정 여부
    - **is_favorite**: 즐겨찾기 여부
    """
    try:
        logger.info(
            "채팅 세션 수정 요청: session_id=%s, user_id=%s",
            session_id,
            current_user.id,
        )
        chat_service = ChatService(db)

        session = await chat_service.update_session(
            session_id=session_id,
            session_data=update_data,
            user_id=str(current_user.id),
        )

        return session

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("채팅 세션 수정 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 세션 수정 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 세션 수정 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션을 수정할 수 없습니다.",
        ) from e


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    채팅 세션 삭제

    **주의:** 세션과 관련된 모든 메시지가 함께 삭제됩니다.
    """
    try:
        logger.info(
            "채팅 세션 삭제 요청: session_id=%s, user_id=%s",
            session_id,
            current_user.id,
        )
        chat_service = ChatService(db)
        await chat_service.delete_session(
            session_id=session_id, user_id=str(current_user.id)
        )

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("채팅 세션 삭제 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 세션 삭제 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 세션 삭제 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 세션을 삭제할 수 없습니다.",
        ) from e


# ============================================================================
# 채팅 메시지 관리 API
# ============================================================================


@router.get("/sessions/{session_id}/messages", response_model=ChatMessageListResponse)
async def list_session_messages(
    session_id: str,
    search_text: str = Query(None, description="메시지 내용 검색"),
    role: str = Query(None, description="메시지 역할 (user, assistant, system)"),
    message_status: str = Query(None, description="메시지 상태"),
    input_mode: str = Query(None, description="입력 방식"),
    page_no: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(50, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    특정 세션의 메시지 목록 조회

    **필터 옵션:**
    - **search_text**: 메시지 내용에서 검색
    - **role**: 메시지 역할 필터
    - **message_status**: 메시지 상태 필터
    - **input_mode**: 입력 방식 필터
    """
    try:
        logger.info(
            "메시지 목록 조회 요청: session_id=%s, user_id=%s",
            session_id,
            current_user.id,
        )
        chat_service = ChatService(db)

        search_params = ChatMessageSearchRequest(
            session_id=session_id,
            search_text=search_text,
            role=role,
            status=message_status,
            input_mode=input_mode,
            start_date=None,
            end_date=None,
        )

        result = await chat_service.list_session_messages(
            session_id=session_id,
            user_id=str(current_user.id),
            page_no=page_no,
            page_size=page_size,
            search_params=search_params,
        )

        return result

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("메시지 목록 접근 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 메시지 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("메시지 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="메시지 목록을 조회할 수 없습니다.",
        ) from e


@router.post(
    "/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED
)
async def create_message(
    message_data: ChatMessageCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새 메시지 생성

    **주의:** 이 API는 사용자 메시지 저장용입니다.
    AI 응답을 받으려면 `/chat/send` 엔드포인트를 사용하세요.
    """
    try:
        logger.info("메시지 생성 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)
        message = await chat_service.create_message(
            user_id=str(current_user.id), message_data=message_data
        )

        return message

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("메시지 생성 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 메시지 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("메시지 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="메시지를 생성할 수 없습니다.",
        ) from e


# ============================================================================
# OpenAI API 연동
# ============================================================================


@router.post("/send", response_model=OpenAIResponse)
async def send_message_to_ai(
    request: OpenAIMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    OpenAI API에 메시지 전송 및 AI 응답 받기

    **이 엔드포인트는:**
    1. 사용자 메시지를 데이터베이스에 저장
    2. OpenAI API 호출하여 AI 응답 받기
    3. AI 응답을 데이터베이스에 저장
    4. 토큰 사용량 및 비용 계산
    5. 사용량 통계 업데이트

    **요청 데이터:**
    - **session_id**: 채팅 세션 ID
    - **message**: 사용자 메시지 내용
    - **stream**: 스트림 응답 여부 (현재 미구현)
    """
    try:
        logger.info("OpenAI 메시지 전송 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)
        result = await chat_service.send_message_to_openai(
            user_id=str(current_user.id), request=request
        )

        return result

    except NotFoundError as e:
        logger.warning("채팅 세션을 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except AuthorizationError as e:
        logger.warning("OpenAI API 접근 권한 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except BusinessException as e:
        logger.error("비즈니스 로직 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 OpenAI 메시지 전송 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("OpenAI 메시지 전송 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 응답을 가져올 수 없습니다: {str(e)}",
        ) from e


# ============================================================================
# 채팅 템플릿 관리 API
# ============================================================================


@router.post(
    "/templates",
    response_model=ChatTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_chat_template(
    template_data: ChatTemplateCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    새로운 채팅 템플릿 생성

    **템플릿은:**
    - 자주 사용하는 프롬프트를 저장
    - 다른 사용자와 공유 가능 (공개 설정 시)
    - 카테고리와 태그로 분류 가능
    """
    try:
        logger.info("채팅 템플릿 생성 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)
        template = await chat_service.create_template(
            user_id=str(current_user.id), template_data=template_data
        )

        return template

    except NotFoundError as e:
        logger.warning("사용자를 찾을 수 없음: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 템플릿 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 템플릿 생성 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 템플릿을 생성할 수 없습니다.",
        ) from e


@router.get("/templates", response_model=ChatTemplateListResponse)
async def list_chat_templates(
    search_text: str = Query(None, description="템플릿 이름/내용 검색"),
    category: str = Query(None, description="카테고리 필터"),
    is_public: bool = Query(None, description="공개 템플릿만 조회"),
    is_featured: bool = Query(None, description="추천 템플릿만 조회"),
    page_no: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    채팅 템플릿 목록 조회

    **조회 범위:**
    - 본인이 생성한 모든 템플릿
    - 다른 사용자가 공개한 템플릿

    **정렬 기준:**
    - 사용 횟수 많은 순
    - 생성일 최신 순
    """
    try:
        logger.info("채팅 템플릿 목록 조회 요청: user_id=%s", current_user.id)
        chat_service = ChatService(db)

        search_params = ChatTemplateSearchRequest(
            search_text=search_text,
            category=category,
            tags=None,
            is_public=is_public,
            is_featured=is_featured,
        )

        result = await chat_service.list_templates(
            user_id=str(current_user.id),
            page_no=page_no,
            page_size=page_size,
            search_params=search_params,
        )

        return result

    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 템플릿 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("채팅 템플릿 목록 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="채팅 템플릿 목록을 조회할 수 없습니다.",
        ) from e


# ============================================================================
# 사용량 통계 API
# ============================================================================
@router.get("/usage-stats", response_model=List[ChatUsageStatsResponse])
async def get_chat_usage_stats(
    period_type: str = Query("daily", description="통계 기간 (daily, weekly, monthly)"),
    days: int = Query(30, ge=1, le=365, description="조회할 일수"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자의 채팅 사용량 통계 조회

    **통계 정보:**
    - 세션 수
    - 메시지 수
    - 토큰 사용량 (입력/출력)
    - 사용 비용 (예상)
    - 모델별 사용량
    - 응답 시간 평균

    **기간 옵션:**
    - **daily**: 일별 통계 (최근 N일)
    - **weekly**: 주별 통계 (최근 N주)
    - **monthly**: 월별 통계 (최근 N개월)
    """
    try:
        logger.info(
            "사용량 통계 조회 요청: user_id=%s, period_type=%s, days=%d",
            current_user.id,
            period_type,
            days,
        )

        # 기간 타입 검증
        valid_period_types = ["daily", "weekly", "monthly"]
        if period_type not in valid_period_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 기간 타입입니다. 사용 가능한 값: {', '.join(valid_period_types)}",
            )

        chat_service = ChatService(db)
        stats = await chat_service.get_usage_stats(
            user_id=str(current_user.id), period_type=period_type, days=days
        )

        if not stats:
            logger.warning(
                "사용량 통계 없음: user_id=%s, period_type=%s, days=%d",
                current_user.id,
                period_type,
                days,
            )
            return []

        logger.info(
            "사용량 통계 조회 완료: user_id=%s, 통계 항목 수=%d",
            current_user.id,
            len(stats),
        )

        return [ChatUsageStatsResponse.model_validate(stat) for stat in stats]

    except HTTPException:
        raise
    except BusinessException as e:
        logger.error("비즈니스 로직 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    except (ValueError, TypeError) as e:
        logger.error("잘못된 매개변수: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"잘못된 요청 매개변수: {str(e)}",
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 사용량 통계 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error("사용량 통계 조회 실패: user_id=%s, error=%s", current_user.id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용량 통계를 조회할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        ) from e


# ============================================================================
# 추가 통계 API 엔드포인트
# ============================================================================


@router.get("/stats/summary", response_model=dict)
async def get_chat_stats_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용자의 채팅 통계 요약 정보 조회

    **반환 정보:**
    - 총 세션 수
    - 총 메시지 수
    - 총 토큰 사용량
    - 예상 총 비용
    - 가장 많이 사용한 모델
    - 평균 응답 시간
    - 오늘/이번 주/이번 달 사용량
    """
    try:
        logger.info("채팅 통계 요약 조회 요청: user_id=%s", current_user.id)

        chat_service = ChatService(db)
        summary = await chat_service.get_stats_summary(user_id=str(current_user.id))

        if not summary:
            logger.warning("통계 요약 정보 없음: user_id=%s", current_user.id)
            # 기본 요약 정보 반환
            return {
                "total_sessions": 0,
                "total_messages": 0,
                "total_tokens_used": 0,
                "total_cost_estimate": 0.0,
                "most_used_model": None,
                "average_response_time": 0.0,
                "today_usage": {"sessions": 0, "messages": 0, "tokens": 0},
                "this_week_usage": {"sessions": 0, "messages": 0, "tokens": 0},
                "this_month_usage": {"sessions": 0, "messages": 0, "tokens": 0},
            }

        logger.info("채팅 통계 요약 조회 완료: user_id=%s", current_user.id)
        return summary

    except BusinessException as e:
        logger.error("비즈니스 로직 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 채팅 통계 요약 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error(
            "채팅 통계 요약 조회 실패: user_id=%s, error=%s", current_user.id, e
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="통계 요약 정보를 조회할 수 없습니다.",
        ) from e


@router.get("/stats/models", response_model=List[dict])
async def get_model_usage_stats(
    days: int = Query(30, ge=1, le=365, description="조회할 일수"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    모델별 사용량 통계 조회

    **반환 정보:**
    - 모델명
    - 사용 횟수
    - 토큰 사용량
    - 예상 비용
    - 평균 응답 시간
    - 사용률 (%)
    """
    try:
        logger.info(
            "모델별 사용량 통계 조회 요청: user_id=%s, days=%d",
            current_user.id,
            days,
        )

        chat_service = ChatService(db)
        model_stats = await chat_service.get_model_usage_stats(
            user_id=str(current_user.id), days=days
        )

        if not model_stats:
            logger.warning(
                "모델별 사용량 통계 없음: user_id=%s, days=%d",
                current_user.id,
                days,
            )
            return []

        logger.info(
            "모델별 사용량 통계 조회 완료: user_id=%s, 모델 수=%d",
            current_user.id,
            len(model_stats),
        )

        return model_stats

    except BusinessException as e:
        logger.error("비즈니스 로직 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 모델별 사용량 통계 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error(
            "모델별 사용량 통계 조회 실패: user_id=%s, error=%s",
            current_user.id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="모델별 사용량 통계를 조회할 수 없습니다.",
        ) from e


@router.get("/stats/trends", response_model=dict)
async def get_usage_trends(
    days: int = Query(30, ge=7, le=365, description="조회할 일수"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    """
    사용량 트렌드 분석

    **반환 정보:**
    - 일별 사용량 변화
    - 시간대별 사용 패턴
    - 증감률 분석
    - 예측 사용량
    """
    try:
        logger.info(
            "사용량 트렌드 조회 요청: user_id=%s, days=%d",
            current_user.id,
            days,
        )

        chat_service = ChatService(db)
        trends = await chat_service.get_usage_trends(
            user_id=str(current_user.id), days=days
        )

        if not trends:
            logger.warning(
                "사용량 트렌드 데이터 없음: user_id=%s, days=%d",
                current_user.id,
                days,
            )
            return {
                "daily_usage": [],
                "hourly_pattern": [],
                "growth_rate": 0.0,
                "predicted_usage": 0,
            }

        logger.info("사용량 트렌드 조회 완료: user_id=%s", current_user.id)
        return trends

    except BusinessException as e:
        logger.error("비즈니스 로직 오류: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
    except SQLAlchemyError as e:
        logger.error("데이터베이스 오류로 사용량 트렌드 조회 실패: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스 오류가 발생했습니다.",
        ) from e
    except Exception as e:
        logger.error(
            "사용량 트렌드 조회 실패: user_id=%s, error=%s",
            current_user.id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용량 트렌드를 조회할 수 없습니다.",
        ) from e
