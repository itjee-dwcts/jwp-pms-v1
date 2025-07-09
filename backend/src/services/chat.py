"""
채팅 서비스 (비즈니스 로직)

OpenAI API와 연동하여 채팅 기능을 제공하는 서비스
"""

import json
import logging
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, cast

import openai
from constants.chat import MessageRole, MessageStatus, OpenAIModel, SessionStatus
from core.config import get_settings
from core.database import get_async_session
from models.chat import ChatMessage, ChatSession, ChatTemplate, ChatUsageStats
from models.user import User
from openai.types.chat import (
    ChatCompletionAssistantMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
)
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
    OpenAIMessageRequest,
    OpenAIResponse,
)
from sqlalchemy import and_, desc, extract, func, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select
from sqlalchemy.sql.functions import count
from utils.exceptions import AuthorizationError, BusinessException, NotFoundError

logger = logging.getLogger(__name__)
settings = get_settings()


class ChatService:
    """
    채팅 서비스 클래스
    - 채팅 세션 관리
    - OpenAI API 연동
    - 메시지 저장 및 조회
    - 사용량 통계 관리
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # ========================================================================
    # 채팅 세션 관리
    # ========================================================================

    async def create_session(
        self, user_id: str, session_data: ChatSessionCreateRequest
    ) -> ChatSessionResponse:
        """
        새로운 채팅 세션 생성

        Args:
            user_id: 사용자 ID
            session_data: 세션 생성 데이터

        Returns:
            생성된 채팅 세션
        """
        try:
            # 사용자 존재 확인
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                raise NotFoundError(f"사용자를 찾을 수 없습니다: {user_id}")

            # 제목이 비어있으면 기본 제목 설정
            title = session_data.title.strip()
            if not title:
                title = "새 채팅"

            # 새 세션 생성
            session = ChatSession(
                title=title,
                description=session_data.description,
                model=session_data.model,
                temperature=session_data.temperature,
                max_tokens=session_data.max_tokens,
                system_prompt=session_data.system_prompt,
                user_id=user_id,
                tags=session_data.tags or [],
                status=SessionStatus.ACTIVE,
                last_activity_at=datetime.utcnow(),
                created_by=user_id,
                updated_by=user_id,
            )

            self.db.add(session)
            await self.db.flush()  # ID를 얻기 위해 flush
            await self.db.commit()

            # 관계와 함께 생성된 세션 조회
            result = await self.db.execute(
                select(ChatSession)
                .options(selectinload(ChatSession.user))
                .where(ChatSession.id == session.id)
            )
            created_session = result.scalar_one()

            logger.info("새 채팅 세션 생성됨: %s (사용자: %s)", session.id, user_id)
            return ChatSessionResponse.model_validate(created_session)

        except Exception as e:
            await self.db.rollback()
            logger.error("채팅 세션 생성 실패: %s", e)
            raise

    async def get_session_by_id(
        self, session_id: str, user_id: Optional[str] = None
    ) -> ChatSessionResponse:
        """
        채팅 세션 조회

        Args:
            session_id: 세션 ID
            user_id: 사용자 ID (권한 확인용)

        Returns:
            채팅 세션
        """
        try:
            # 관계와 함께 쿼리 구성
            query = (
                select(ChatSession)
                .options(selectinload(ChatSession.user))
                .where(ChatSession.id == session_id)
            )

            result = await self.db.execute(query)
            session = result.scalar_one_or_none()

            if not session:
                raise NotFoundError(f"채팅 세션을 찾을 수 없습니다: {session_id}")

            session_user_id = getattr(session, "user_id", None)

            # 권한 확인
            if user_id and session_user_id != user_id:
                raise AuthorizationError("이 채팅 세션에 대한 접근 권한이 없습니다")

            return ChatSessionResponse.model_validate(session)

        except Exception as e:
            logger.error("채팅 세션 조회 실패 %s: %s", session_id, e)
            raise

    async def list_sessions(
        self,
        user_id: str,
        page_no: int = 1,
        page_size: int = 20,
        search_params: Optional[ChatSessionSearchRequest] = None,
    ) -> ChatSessionListResponse:
        """
        사용자의 채팅 세션 목록 조회

        Args:
            user_id: 사용자 ID
            page_no: 페이지 번호
            page_size: 페이지 크기
            search_params: 검색 파라미터

        Returns:
            세션 목록과 페이지네이션 정보
        """
        try:
            # 기본 쿼리
            query = (
                select(ChatSession)
                .options(selectinload(ChatSession.user))
                .where(ChatSession.user_id == user_id)
            )

            # 검색 필터 적용
            if search_params:
                if search_params.search_text:
                    search_term = f"%{search_params.search_text}%"
                    query = query.where(
                        or_(
                            ChatSession.title.ilike(search_term),
                            ChatSession.description.ilike(search_term),
                        )
                    )

                if search_params.status:
                    query = query.where(ChatSession.status == search_params.status)

                if search_params.model:
                    query = query.where(ChatSession.model == search_params.model)

                if search_params.is_pinned is not None:
                    query = query.where(
                        ChatSession.is_pinned == search_params.is_pinned
                    )

                if search_params.is_favorite is not None:
                    query = query.where(
                        ChatSession.is_favorite == search_params.is_favorite
                    )

                if search_params.start_date:
                    query = query.where(
                        ChatSession.created_at >= search_params.start_date
                    )

                if search_params.end_date:
                    query = query.where(
                        ChatSession.created_at <= search_params.end_date
                    )

                # 태그 필터
                if search_params.tags:
                    for tag in search_params.tags:
                        query = query.where(ChatSession.tags.contains([tag]))

            # 전체 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(ChatSession.last_activity_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            sessions = result.scalars().all()

            return ChatSessionListResponse(
                sessions=[
                    ChatSessionResponse.model_validate(session) for session in sessions
                ],
                total_count=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
            )

        except Exception as e:
            logger.error("채팅 세션 목록 조회 실패: %s", e)
            raise

    async def update_session(
        self,
        session_id: str,
        session_data: ChatSessionUpdateRequest,
        user_id: str,
    ) -> ChatSessionResponse:
        """
        채팅 세션 정보 수정

        Args:
            session_id: 세션 ID
            session_data: 수정할 데이터
            user_id: 사용자 ID

        Returns:
            수정된 세션
        """
        try:
            result = await self.db.execute(
                select(ChatSession).where(ChatSession.id == session_id)
            )
            session = result.scalar_one_or_none()

            if not session:
                raise NotFoundError(f"채팅 세션을 찾을 수 없습니다: {session_id}")

            session_user_id = getattr(session, "user_id", None)
            if session_user_id is None:
                raise NotFoundError(f"채팅 세션에 소유자가 없습니다: {session_id}")

            # 소유권 확인
            if session_user_id != user_id:
                raise AuthorizationError("세션 소유자만 수정할 수 있습니다")

            # 필드 업데이트
            update_data = session_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if value is not None and hasattr(session, field):
                    setattr(session, field, value)

            # 메타데이터 업데이트
            setattr(session, "updated_by", user_id)
            setattr(session, "updated_at", datetime.utcnow())

            await self.db.commit()

            # 관계와 함께 업데이트된 세션 조회
            result = await self.db.execute(
                select(ChatSession)
                .options(selectinload(ChatSession.user))
                .where(ChatSession.id == session_id)
            )
            updated_session = result.scalar_one()

            logger.info("채팅 세션 수정됨: %s", session.title)
            return ChatSessionResponse.model_validate(updated_session)

        except Exception as e:
            await self.db.rollback()
            logger.error("채팅 세션 수정 실패 %s: %s", session_id, e)
            raise

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """
        채팅 세션 삭제

        Args:
            session_id: 세션 ID
            user_id: 사용자 ID

        Returns:
            삭제 성공 여부
        """
        try:
            result = await self.db.execute(
                select(ChatSession).where(ChatSession.id == session_id)
            )
            session = result.scalar_one_or_none()

            if not session:
                raise NotFoundError(f"채팅 세션을 찾을 수 없습니다: {session_id}")

            session_user_id = getattr(session, "user_id", None)
            if session_user_id is None:
                raise NotFoundError(f"채팅 세션에 소유자가 없습니다: {session_id}")

            # 소유권 확인
            if session_user_id != user_id:
                raise AuthorizationError("세션 소유자만 삭제할 수 있습니다")

            # 세션 삭제 (메시지는 cascade로 삭제됨)
            await self.db.delete(session)
            await self.db.commit()

            logger.info("채팅 세션 삭제됨: %s", session.title)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("채팅 세션 삭제 실패 %s: %s", session_id, e)
            raise

    # ========================================================================
    # 메시지 관리
    # ========================================================================

    async def create_message(
        self, user_id: str, message_data: ChatMessageCreateRequest
    ) -> ChatMessageResponse:
        """
        새 메시지 생성

        Args:
            user_id: 사용자 ID
            message_data: 메시지 데이터

        Returns:
            생성된 메시지
        """
        try:
            # 세션 존재 및 권한 확인
            session = await self.get_session_by_id(message_data.session_id, user_id)
            if not session:
                raise NotFoundError("채팅 세션을 찾을 수 없습니다")

            # 새 메시지 생성
            message = ChatMessage(
                content=message_data.content,
                role=message_data.role,
                session_id=message_data.session_id,
                user_id=user_id,
                input_mode=message_data.input_mode,
                attachments=message_data.attachments or [],
                parent_message_id=message_data.parent_message_id,
                status=MessageStatus.SENT,
                created_by=user_id,
                updated_by=user_id,
            )

            self.db.add(message)
            await self.db.flush()

            # 세션 통계 업데이트
            session_result = await self.db.execute(
                select(ChatSession).where(ChatSession.id == message_data.session_id)
            )
            session_obj = session_result.scalar_one()
            session_obj.message_count += 1
            session_obj.last_activity_at = datetime.utcnow()

            await self.db.commit()

            # 관계와 함께 생성된 메시지 조회
            result = await self.db.execute(
                select(ChatMessage)
                .options(
                    selectinload(ChatMessage.user),
                    selectinload(ChatMessage.session),
                )
                .where(ChatMessage.id == message.id)
            )
            created_message = result.scalar_one()

            logger.info(
                "새 메시지 생성됨: %s (세션: %s)", message.id, message_data.session_id
            )
            return ChatMessageResponse.model_validate(created_message)

        except (NotFoundError, AuthorizationError, BusinessException) as e:
            await self.db.rollback()
            logger.error("메시지 생성 실패: %s", e)
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error("메시지 생성 실패(알 수 없는 오류): %s", e)
            raise

    async def get_message_by_id(
        self, message_id: str, user_id: Optional[str] = None
    ) -> ChatMessageResponse:
        """
        메시지 ID로 조회

        Args:
            message_id: 메시지 ID
            user_id: 사용자 ID (권한 확인용)

        Returns:
            메시지 정보
        """
        try:
            # 관계와 함께 쿼리 구성
            query = (
                select(ChatMessage)
                .options(
                    selectinload(ChatMessage.user),
                    selectinload(ChatMessage.session),
                )
                .where(ChatMessage.id == message_id)
            )

            result = await self.db.execute(query)
            message = result.scalar_one_or_none()

            if not message:
                raise NotFoundError(f"메시지를 찾을 수 없습니다: {message_id}")

            # 권한 확인
            if user_id:
                message_user_id = getattr(message, "user_id", None)
                if message_user_id != user_id:
                    raise AuthorizationError("이 메시지에 대한 접근 권한이 없습니다")

            return ChatMessageResponse.model_validate(message)

        except Exception as e:
            logger.error("메시지 조회 실패 %s: %s", message_id, e)
            raise

    async def list_session_messages(
        self,
        session_id: str,
        user_id: str,
        page_no: int = 1,
        page_size: int = 50,
        search_params: Optional[ChatMessageSearchRequest] = None,
    ) -> ChatMessageListResponse:
        """
        세션의 메시지 목록 조회

        Args:
            session_id: 세션 ID
            user_id: 사용자 ID
            page_no: 페이지 번호
            page_size: 페이지 크기
            search_params: 검색 파라미터

        Returns:
            메시지 목록과 페이지네이션 정보
        """
        try:
            # 세션 접근 권한 확인
            await self.get_session_by_id(session_id, user_id)

            # 기본 쿼리
            query = (
                select(ChatMessage)
                .options(
                    selectinload(ChatMessage.user),
                    selectinload(ChatMessage.session),
                )
                .where(
                    and_(
                        ChatMessage.session_id == session_id,
                        ChatMessage.is_deleted.is_(False),
                    )
                )
            )

            # 검색 필터 적용
            if search_params:
                if search_params.search_text:
                    search_term = f"%{search_params.search_text}%"
                    query = query.where(ChatMessage.content.ilike(search_term))

                if search_params.role:
                    query = query.where(ChatMessage.role == search_params.role)

                if search_params.status:
                    query = query.where(ChatMessage.status == search_params.status)

                if search_params.input_mode:
                    query = query.where(
                        ChatMessage.input_mode == search_params.input_mode
                    )

                if search_params.start_date:
                    query = query.where(
                        ChatMessage.created_at >= search_params.start_date
                    )

                if search_params.end_date:
                    query = query.where(
                        ChatMessage.created_at <= search_params.end_date
                    )

            # 전체 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset).limit(page_size).order_by(ChatMessage.created_at)
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            messages = result.scalars().all()

            return ChatMessageListResponse(
                messages=[
                    ChatMessageResponse.model_validate(message) for message in messages
                ],
                total_count=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
            )

        except SQLAlchemyError as e:
            logger.error("메시지 목록 조회 실패: %s", e)
            raise

    # ========================================================================
    # OpenAI API 연동
    # ========================================================================

    async def send_message_to_openai(
        self, user_id: str, request: OpenAIMessageRequest
    ) -> OpenAIResponse:
        """
        OpenAI API에 메시지 전송 및 응답 처리

        Args:
            user_id: 사용자 ID
            request: OpenAI 요청 데이터

        Returns:
            AI 응답 정보
        """
        try:
            # 세션 조회 및 권한 확인
            session = await self.get_session_by_id(request.session_id, user_id)
            if not session:
                raise NotFoundError("채팅 세션을 찾을 수 없습니다")

            # 사용자 메시지 저장
            user_message = await self.create_message(
                user_id,
                ChatMessageCreateRequest(
                    session_id=request.session_id,
                    content=request.message,
                    role=MessageRole.USER,
                    parent_message_id=None,
                ),
            )

            # 대화 기록 준비
            conversation_history = await self._prepare_conversation_history(
                request.session_id
            )

            # OpenAI API 호출
            start_time = time.time()

            def to_openai_message(msg):
                if msg["role"] == MessageRole.USER:
                    return ChatCompletionUserMessageParam(
                        role="user", content=msg["content"]
                    )
                elif msg["role"] == MessageRole.ASSISTANT:
                    return ChatCompletionAssistantMessageParam(
                        role="assistant", content=msg["content"]
                    )
                elif msg["role"] == MessageRole.SYSTEM:
                    return ChatCompletionSystemMessageParam(
                        role="system", content=msg["content"]
                    )
                else:
                    raise ValueError(f"Unknown role: {msg['role']}")

            openai_messages = [to_openai_message(msg) for msg in conversation_history]

            openai_response = await self.openai_client.chat.completions.create(
                model=session.model,
                messages=openai_messages,
                temperature=float(getattr(session, "temperature", 0.7)),
                max_tokens=session.max_tokens,
                stream=request.stream,
            )

            response_time = int((time.time() - start_time) * 1000)

            # AI 응답 메시지 저장
            ai_message = await self.create_message(
                user_id,
                ChatMessageCreateRequest(
                    session_id=request.session_id,
                    content=openai_response.choices[0].message.content or "",
                    role=MessageRole.ASSISTANT,
                    parent_message_id=str(user_message.id),
                ),
            )

            # 토큰 사용량 및 비용 업데이트
            tokens_used = (
                openai_response.usage.total_tokens
                if openai_response.usage is not None
                else 0
            )
            cost = self._calculate_cost(session.model, tokens_used)

            # 메시지 업데이트
            message_result = await self.db.execute(
                select(ChatMessage).where(ChatMessage.id == ai_message.id)
            )
            ai_message_obj = message_result.scalar_one()
            ai_message_obj.model_used = session.model
            ai_message_obj.tokens_used = tokens_used
            ai_message_obj.cost = str(cost)
            ai_message_obj.response_time = response_time

            # 세션 통계 업데이트
            session_result = await self.db.execute(
                select(ChatSession).where(ChatSession.id == request.session_id)
            )
            session_obj = session_result.scalar_one()
            session_obj.total_tokens += tokens_used
            session_obj.total_cost = str(
                float(getattr(session_obj, "total_cost", "0") or 0) + cost
            )
            session_obj.last_activity_at = datetime.now(timezone.utc)

            await self.db.commit()

            # 사용량 통계 업데이트
            await self._update_usage_stats(user_id, session.model, tokens_used, cost)

            logger.info("OpenAI 응답 처리 완료: %s", ai_message.id)

            return OpenAIResponse(
                message_id=str(ai_message.id),
                content=str(ai_message_obj.content),
                model=session.model,
                tokens_used=tokens_used,
                cost=str(cost),
                response_time=response_time,
            )

        except Exception as e:
            await self.db.rollback()
            logger.error("OpenAI API 처리 실패: %s", e)
            raise BusinessException(f"AI 응답을 가져올 수 없습니다: {str(e)}") from e

    async def _prepare_conversation_history(
        self, session_id: str
    ) -> List[Dict[str, str]]:
        """
        OpenAI API용 대화 기록 준비

        Args:
            session_id: 채팅 세션 ID

        Returns:
            OpenAI 메시지 형식의 대화 기록
        """
        messages = []

        # 세션 정보 조회
        session_result = await self.db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        session = session_result.scalar_one()

        # 시스템 프롬프트 추가
        if session.system_prompt is not None:
            messages.append(
                {
                    "role": MessageRole.SYSTEM,
                    "content": session.system_prompt,
                }
            )

        # 최근 메시지들 조회 (최대 50개)
        query = (
            select(ChatMessage)
            .where(
                and_(
                    ChatMessage.session_id == session_id,
                    ChatMessage.is_deleted.is_(False),
                )
            )
            .order_by(desc(ChatMessage.created_at))
            .limit(50)
        )

        result = await self.db.execute(query)
        recent_messages = result.scalars().all()

        # 시간순으로 정렬 (오래된 것부터)
        for message in reversed(recent_messages):
            messages.append(
                {
                    "role": message.role,
                    "content": message.content,
                }
            )

        return messages

    def _calculate_cost(self, model: str, tokens: int) -> float:
        """
        모델별 토큰 사용량에 따른 비용 계산

        Args:
            model: OpenAI 모델
            tokens: 사용된 토큰 수

        Returns:
            비용 (USD)
        """
        # 2024년 기준 OpenAI 가격 (1000 토큰당)
        pricing = {
            OpenAIModel.GPT_3_5_TURBO: 0.002,
            OpenAIModel.GPT_4: 0.03,
            OpenAIModel.GPT_4_TURBO: 0.01,
            OpenAIModel.GPT_4_VISION: 0.01,
        }

        price_per_1k_tokens = pricing.get(OpenAIModel(model), 0.002)
        return (tokens / 1000) * price_per_1k_tokens

    async def _update_usage_stats(
        self, user_id: str, model: str, tokens: int, cost: float
    ):
        """
        사용량 통계 업데이트

        Args:
            user_id: 사용자 ID
            model: 사용된 모델
            tokens: 사용된 토큰 수
            cost: 비용
        """
        try:
            today = datetime.utcnow().date()

            # 오늘 통계 조회
            query = select(ChatUsageStats).where(
                and_(
                    ChatUsageStats.user_id == user_id,
                    func.date(ChatUsageStats.date) == today,
                    ChatUsageStats.period_type == "daily",
                )
            )
            result = await self.db.execute(query)
            stats = result.scalar_one_or_none()

            if stats:
                # 기존 통계 업데이트
                stats.messages_count += 1
                stats.tokens_used += tokens
                stats.total_cost = str(
                    float(getattr(stats, "total_cost", "0") or 0) + cost
                )

                # 모델별 사용량 업데이트 (수정된 부분)
                current_model_usage = stats.model_usage or {}

                # JSON 문자열인 경우 파싱
                if isinstance(current_model_usage, str):
                    try:
                        current_model_usage = json.loads(current_model_usage)
                    except json.JSONDecodeError:
                        current_model_usage = {}

                # 새로운 딕셔너리로 복사하고 수정
                if isinstance(current_model_usage, dict):
                    new_model_usage = dict(current_model_usage)
                else:
                    new_model_usage = {}

                if model in new_model_usage:
                    new_model_usage[model]["tokens"] += tokens
                    new_model_usage[model]["cost"] += cost
                else:
                    new_model_usage[model] = {"tokens": tokens, "cost": cost}

                # 전체 딕셔너리를 재할당
                stats.model_usage = new_model_usage

            else:
                # 새 통계 생성
                stats = ChatUsageStats(
                    user_id=user_id,
                    date=datetime.combine(today, datetime.min.time()),
                    period_type="daily",
                    messages_count=1,
                    tokens_used=tokens,
                    total_cost=str(cost),
                    model_usage={model: {"tokens": tokens, "cost": cost}},
                )
                self.db.add(stats)

            await self.db.commit()

        except SQLAlchemyError as e:
            # SQLAlchemy 관련 오류 (데이터베이스 연결, 쿼리 오류 등)
            await self.db.rollback()
            logger.error("데이터베이스 오류로 사용량 통계 업데이트 실패: %s", e)
        except json.JSONDecodeError as e:
            # JSON 파싱 오류
            logger.error("JSON 파싱 오류로 사용량 통계 업데이트 실패: %s", e)
        except (ValueError, TypeError) as e:
            # 값 변환 오류 (float 변환 등)
            logger.error("데이터 변환 오류로 사용량 통계 업데이트 실패: %s", e)
        # except Exception as e:
        #     # 예상하지 못한 기타 오류
        #     await self.db.rollback()
        #     logger.error("예상하지 못한 오류로 사용량 통계 업데이트 실패: %s", e)
        # 통계 업데이트 실패는 주요 기능에 영향주지 않도록 에러를 던지지 않음

    # ========================================================================
    # 템플릿 관리
    # ========================================================================

    async def create_template(
        self, user_id: str, template_data: ChatTemplateCreateRequest
    ) -> ChatTemplateResponse:
        """
        채팅 템플릿 생성

        Args:
            user_id: 사용자 ID
            template_data: 템플릿 데이터

        Returns:
            생성된 템플릿
        """
        try:
            # 사용자 존재 확인
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                raise NotFoundError(f"사용자를 찾을 수 없습니다: {user_id}")

            template = ChatTemplate(
                name=template_data.name,
                description=template_data.description,
                content=template_data.content,
                category=template_data.category,
                tags=template_data.tags or [],
                user_id=user_id,
                is_public=template_data.is_public,
                created_by=user_id,
                updated_by=user_id,
            )

            self.db.add(template)
            await self.db.flush()
            await self.db.commit()

            # 관계와 함께 생성된 템플릿 조회
            result = await self.db.execute(
                select(ChatTemplate)
                .options(selectinload(ChatTemplate.user))
                .where(ChatTemplate.id == template.id)
            )
            created_template = result.scalar_one()

            logger.info("채팅 템플릿 생성됨: %s", template.name)
            return ChatTemplateResponse.model_validate(created_template)

        except Exception as e:
            await self.db.rollback()
            logger.error("채팅 템플릿 생성 실패: %s", e)
            raise

    async def list_templates(
        self,
        user_id: str,
        page_no: int = 1,
        page_size: int = 20,
        search_params: Optional[ChatTemplateSearchRequest] = None,
    ) -> ChatTemplateListResponse:
        """
        채팅 템플릿 목록 조회

        Args:
            user_id: 사용자 ID
            page_no: 페이지 번호
            page_size: 페이지 크기
            search_params: 검색 파라미터

        Returns:
            템플릿 목록과 페이지네이션 정보
        """
        try:
            # 기본 쿼리 (본인 템플릿 + 공개 템플릿)
            query = (
                select(ChatTemplate)
                .options(selectinload(ChatTemplate.user))
                .where(
                    or_(
                        ChatTemplate.user_id == user_id,
                        ChatTemplate.is_public.is_(True),
                    )
                )
            )

            # 검색 필터 적용
            if search_params:
                if search_params.search_text:
                    search_term = f"%{search_params.search_text}%"
                    query = query.where(
                        or_(
                            ChatTemplate.name.ilike(search_term),
                            ChatTemplate.description.ilike(search_term),
                            ChatTemplate.content.ilike(search_term),
                        )
                    )

                if search_params.category:
                    query = query.where(ChatTemplate.category == search_params.category)

                if search_params.is_public is not None:
                    query = query.where(
                        ChatTemplate.is_public == search_params.is_public
                    )

                if search_params.is_featured is not None:
                    query = query.where(
                        ChatTemplate.is_featured == search_params.is_featured
                    )

                # 태그 필터
                if search_params.tags:
                    for tag in search_params.tags:
                        query = query.where(ChatTemplate.tags.contains([tag]))

            # 전체 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 및 정렬 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(ChatTemplate.usage_count), desc(ChatTemplate.created_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            templates = result.scalars().all()

            return ChatTemplateListResponse(
                templates=[
                    ChatTemplateResponse.model_validate(template)
                    for template in templates
                ],
                total_count=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
            )

        except Exception as e:
            logger.error("채팅 템플릿 목록 조회 실패: %s", e)
            raise

    # ========================================================================
    # 사용량 통계 API 메서드들
    # ========================================================================

    async def get_usage_stats(
        self, user_id: str, period_type: str, days: int
    ) -> List[ChatUsageStats]:
        """
        사용자의 채팅 사용량 통계 조회

        Args:
            user_id: 사용자 ID
            period_type: 통계 기간 (daily, weekly, monthly)
            days: 조회할 일수

        Returns:
            사용량 통계 목록
        """
        try:
            # 시작 날짜 계산
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days)

            # 기본 쿼리
            query = (
                select(ChatUsageStats)
                .where(
                    and_(
                        ChatUsageStats.user_id == user_id,
                        ChatUsageStats.period_type == period_type,
                        func.date(ChatUsageStats.date) >= start_date,
                        func.date(ChatUsageStats.date) <= end_date,
                    )
                )
                .order_by(ChatUsageStats.date.desc())
            )

            result = await self.db.execute(query)
            stats = result.scalars().all()

            logger.info(
                "사용량 통계 조회 완료: user_id=%s, period_type=%s, days=%s, 결과수=%s",
                user_id,
                period_type,
                days,
                len(stats),
            )

            return list(stats)

        except Exception as e:
            logger.error("사용량 통계 조회 실패: %s", e)
            raise BusinessException("사용량 통계를 조회할 수 없습니다") from e

    async def get_stats_summary(self, user_id: str) -> Dict[str, Any]:
        """
        사용자의 채팅 통계 요약 정보 조회

        Args:
            user_id: 사용자 ID

        Returns:
            통계 요약 정보
        """
        try:
            # 전체 세션 수
            session_count_query = select(count()).where(ChatSession.user_id == user_id)
            total_sessions = (await self.db.execute(session_count_query)).scalar() or 0

            # 전체 메시지 수
            message_count_query = select(count()).where(ChatMessage.user_id == user_id)
            total_messages = (await self.db.execute(message_count_query)).scalar() or 0

            # 전체 토큰 사용량 및 비용
            token_stats_query = select(
                func.sum(ChatUsageStats.tokens_used),
                func.sum(ChatUsageStats.total_cost),
            ).where(ChatUsageStats.user_id == user_id)

            token_result = await self.db.execute(token_stats_query)
            token_data = token_result.first()
            if token_data is not None:
                total_tokens = token_data[0] or 0
                total_cost = float(token_data[1] or 0)
            else:
                total_tokens = 0
                total_cost = 0.0

            # 가장 많이 사용한 모델
            most_used_model_query = (
                select(ChatSession.model, count())
                .where(ChatSession.user_id == user_id)
                .group_by(ChatSession.model)
                .order_by(count().desc())
                .limit(1)
            )

            model_result = await self.db.execute(most_used_model_query)
            model_data = model_result.first()
            most_used_model = model_data[0] if model_data else None

            # 평균 응답 시간
            avg_response_time_query = select(func.avg(ChatMessage.response_time)).where(
                and_(
                    ChatMessage.user_id == user_id,
                    ChatMessage.response_time.is_not(None),
                )
            )
            avg_response_time = (
                await self.db.execute(avg_response_time_query)
            ).scalar() or 0

            # 오늘 사용량
            today = datetime.utcnow().date()
            today_stats = await self._get_period_usage(user_id, today, today)

            # 이번 주 사용량
            week_start = today - timedelta(days=today.weekday())
            this_week_stats = await self._get_period_usage(user_id, week_start, today)

            # 이번 달 사용량
            month_start = today.replace(day=1)
            this_month_stats = await self._get_period_usage(user_id, month_start, today)

            return {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "total_tokens_used": total_tokens,
                "total_cost_estimate": total_cost,
                "most_used_model": most_used_model,
                "average_response_time": float(avg_response_time),
                "today_usage": today_stats,
                "this_week_usage": this_week_stats,
                "this_month_usage": this_month_stats,
            }

        except Exception as e:
            logger.error("통계 요약 조회 실패: %s", e)
            raise BusinessException("통계 요약 정보를 조회할 수 없습니다") from e

    async def get_model_usage_stats(
        self, user_id: str, days: int
    ) -> List[Dict[str, Any]]:
        """
        모델별 사용량 통계 조회

        Args:
            user_id: 사용자 ID
            days: 조회할 일수

        Returns:
            모델별 사용량 통계
        """
        try:
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days)

            # 모델별 세션 수 및 메시지 수 조회
            model_stats_query = (
                select(
                    ChatSession.model,
                    count(ChatSession.id).label("session_count"),
                    count(ChatMessage.id).label("message_count"),
                    func.sum(ChatMessage.tokens_used).label("total_tokens"),
                    func.avg(ChatMessage.response_time).label("avg_response_time"),
                )
                .select_from(
                    ChatSession.__table__.join(
                        ChatMessage.__table__,
                        ChatSession.id == ChatMessage.session_id,
                        isouter=True,
                    )
                )
                .where(
                    and_(
                        ChatSession.user_id == user_id,
                        func.date(ChatSession.created_at) >= start_date,
                        func.date(ChatSession.created_at) <= end_date,
                    )
                )
                .group_by(ChatSession.model)
            )

            result = await self.db.execute(model_stats_query)
            model_data = result.all()

            # 전체 사용량 계산
            total_sessions = sum(row.session_count for row in model_data)

            # 모델별 통계 생성
            model_stats = []
            for row in model_data:
                tokens_used = row.total_tokens or 0
                cost = self._calculate_cost(row.model, tokens_used)
                usage_rate = (
                    (row.session_count / total_sessions * 100)
                    if total_sessions > 0
                    else 0
                )

                model_stats.append(
                    {
                        "model": row.model,
                        "session_count": row.session_count,
                        "message_count": row.message_count,
                        "tokens_used": tokens_used,
                        "estimated_cost": cost,
                        "average_response_time": float(row.avg_response_time or 0),
                        "usage_rate": round(usage_rate, 2),
                    }
                )

            # 사용량 순으로 정렬
            model_stats.sort(key=lambda x: x["session_count"], reverse=True)

            return model_stats

        except SQLAlchemyError as e:
            logger.error("모델별 사용량 통계 조회 실패: %s", e)
            raise BusinessException("모델별 사용량 통계를 조회할 수 없습니다") from e
        except BusinessException as e:
            logger.error("비즈니스 로직 오류: %s", e)
            raise

    async def get_usage_trends(self, user_id: str, days: int) -> Dict[str, Any]:
        """
        사용량 트렌드 분석

        Args:
            user_id: 사용자 ID
            days: 조회할 일수

        Returns:
            사용량 트렌드 데이터
        """
        try:
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days)

            # 일별 사용량 조회
            daily_usage_query = (
                select(
                    func.date(ChatMessage.created_at).label("date"),
                    count(ChatMessage.id).label("message_count"),
                    func.sum(ChatMessage.tokens_used).label("tokens_used"),
                )
                .where(
                    and_(
                        ChatMessage.user_id == user_id,
                        func.date(ChatMessage.created_at) >= start_date,
                        func.date(ChatMessage.created_at) <= end_date,
                    )
                )
                .group_by(func.date(ChatMessage.created_at))
                .order_by(func.date(ChatMessage.created_at))
            )

            daily_result = await self.db.execute(daily_usage_query)
            daily_data = daily_result.all()

            # 시간대별 사용 패턴 조회
            hourly_pattern_query = (
                select(
                    extract("hour", ChatMessage.created_at).label("hour"),
                    count(ChatMessage.id).label("message_count"),
                )
                .where(
                    and_(
                        ChatMessage.user_id == user_id,
                        func.date(ChatMessage.created_at) >= start_date,
                        func.date(ChatMessage.created_at) <= end_date,
                    )
                )
                .group_by(extract("hour", ChatMessage.created_at))
                .order_by(extract("hour", ChatMessage.created_at))
            )

            hourly_result = await self.db.execute(hourly_pattern_query)
            hourly_data = hourly_result.all()

            # 증감률 계산
            growth_rate = 0.0
            if len(daily_data) >= 2:
                recent_avg = sum(row.message_count for row in daily_data[-7:]) / min(
                    7, len(daily_data[-7:])
                )
                previous_avg = sum(
                    row.message_count for row in daily_data[-14:-7]
                ) / min(7, len(daily_data[-14:-7]))
                if previous_avg > 0:
                    growth_rate = ((recent_avg - previous_avg) / previous_avg) * 100

            # 예측 사용량 (단순 평균 기반)
            predicted_usage = 0
            if daily_data:
                avg_daily_usage = sum(row.message_count for row in daily_data) / len(
                    daily_data
                )
                predicted_usage = int(avg_daily_usage)

            return {
                "daily_usage": [
                    {
                        "date": row.date.isoformat(),
                        "message_count": row.message_count,
                        "tokens_used": row.tokens_used or 0,
                    }
                    for row in daily_data
                ],
                "hourly_pattern": [
                    {
                        "hour": int(row.hour),
                        "message_count": row.message_count,
                    }
                    for row in hourly_data
                ],
                "growth_rate": round(growth_rate, 2),
                "predicted_usage": predicted_usage,
            }

        except Exception as e:
            logger.error("사용량 트렌드 조회 실패: %s", e)
            raise BusinessException("사용량 트렌드를 조회할 수 없습니다") from e

    async def _get_period_usage(
        self, user_id: str, start_date: date, end_date: date
    ) -> Dict[str, int]:
        """
        특정 기간의 사용량 조회

        Args:
            user_id: 사용자 ID
            start_date: 시작 날짜
            end_date: 종료 날짜

        Returns:
            기간별 사용량
        """
        try:
            # 세션 수
            session_count_query = select(count()).where(
                and_(
                    ChatSession.user_id == user_id,
                    func.date(ChatSession.created_at) >= start_date,
                    func.date(ChatSession.created_at) <= end_date,
                )
            )
            sessions = (await self.db.execute(session_count_query)).scalar() or 0

            # 메시지 수
            message_count_query = select(count()).where(
                and_(
                    ChatMessage.user_id == user_id,
                    func.date(ChatMessage.created_at) >= start_date,
                    func.date(ChatMessage.created_at) <= end_date,
                )
            )
            messages = (await self.db.execute(message_count_query)).scalar() or 0

            # 토큰 사용량
            token_count_query = select(func.sum(ChatMessage.tokens_used)).where(
                and_(
                    ChatMessage.user_id == user_id,
                    func.date(ChatMessage.created_at) >= start_date,
                    func.date(ChatMessage.created_at) <= end_date,
                )
            )
            tokens = (await self.db.execute(token_count_query)).scalar() or 0

            return {
                "sessions": sessions,
                "messages": messages,
                "tokens": tokens,
            }

        except SQLAlchemyError as e:
            # SQLAlchemy 관련 오류 (데이터베이스 연결, 쿼리 오류 등)
            logger.error("데이터베이스 오류로 기간별 사용량 조회 실패: %s", e)
            return {"sessions": 0, "messages": 0, "tokens": 0}
        except (ValueError, TypeError) as e:
            # 데이터 타입 변환 오류 (날짜 형식 등)
            logger.error("데이터 타입 오류로 기간별 사용량 조회 실패: %s", e)
            return {"sessions": 0, "messages": 0, "tokens": 0}
        # except Exception as e:
        #     # 예상하지 못한 기타 오류
        #     logger.error("예상하지 못한 오류로 기간별 사용량 조회 실패: %s", e)
        #     return {"sessions": 0, "messages": 0, "tokens": 0}


async def get_chat_service(
    db: Optional[AsyncSession] = None,
) -> ChatService:
    """채팅 서비스 인스턴스 획득"""
    if db is None:
        async for session in get_async_session():
            return ChatService(session)
    return ChatService(cast(AsyncSession, db))
