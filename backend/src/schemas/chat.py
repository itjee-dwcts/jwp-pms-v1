# backend/src/schemas/chat.py
"""
채팅 관련 Pydantic 스키마 정의

OpenAI API 연동 및 채팅 기능을 위한 요청/응답 스키마들
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from constants.chat import InputMode, OpenAIModel
from pydantic import BaseModel, Field, field_validator
from schemas.common import UUIDEntity

# ============================================================================
# 기본 스키마들
# ============================================================================


class ChatSessionBase(BaseModel):
    """채팅 세션 기본 스키마"""

    title: str = Field(..., max_length=255, description="세션 제목")
    description: Optional[str] = Field(None, description="세션 설명")
    model: str = Field(
        default=OpenAIModel.GPT_3_5_TURBO, description="사용할 OpenAI 모델"
    )
    temperature: str = Field(default="0.7", description="응답 창의성 (0.0-2.0)")
    max_tokens: int = Field(default=1000, ge=1, le=4000, description="최대 토큰 수")
    system_prompt: Optional[str] = Field(None, description="시스템 프롬프트")
    tags: Optional[List[str]] = Field(default=[], description="태그 목록")

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v):
        """온도 값 유효성 검사"""
        try:
            temp = float(v)
            if not (0.0 <= temp <= 2.0):
                raise ValueError("Temperature must be between 0.0 and 2.0")
            return str(temp)
        except ValueError as e:
            raise ValueError("Temperature must be a valid number") from e


class ChatMessageBase(BaseModel):
    """채팅 메시지 기본 스키마"""

    content: str = Field(..., min_length=1, description="메시지 내용")
    role: str = Field(..., description="메시지 역할")
    input_mode: str = Field(default=InputMode.TEXT, description="입력 방식")
    attachments: Optional[List[Dict[str, Any]]] = Field(
        default=[], description="첨부파일 정보"
    )
    parent_message_id: Optional[str] = Field(None, description="부모 메시지 ID")


class ChatTemplateBase(BaseModel):
    """채팅 템플릿 기본 스키마"""

    name: str = Field(..., max_length=255, description="템플릿 이름")
    description: Optional[str] = Field(None, description="템플릿 설명")
    content: str = Field(..., min_length=1, description="템플릿 내용")
    category: Optional[str] = Field(None, max_length=100, description="카테고리")
    tags: Optional[List[str]] = Field(default=[], description="태그 목록")
    is_public: bool = Field(default=False, description="공개 여부")


# ============================================================================
# 요청 스키마들
# ============================================================================


class ChatSessionCreateRequest(ChatSessionBase):
    """채팅 세션 생성 요청"""

    class Config:
        """예시 데이터 설정"""

        example = {
            "title": "프로젝트 관리 도움",
            "description": "프로젝트 관리에 대한 질문과 답변",
            "model": "gpt-3.5-turbo",
            "temperature": "0.7",
            "max_tokens": 1000,
            "system_prompt": "당신은 프로젝트 관리 전문가입니다.",
            "tags": ["프로젝트", "관리", "도움"],
        }


class ChatSessionUpdateRequest(BaseModel):
    """채팅 세션 수정 요청"""

    title: Optional[str] = Field(None, max_length=255, description="세션 제목")
    description: Optional[str] = Field(None, description="세션 설명")
    model: Optional[str] = Field(None, description="사용할 OpenAI 모델")
    temperature: Optional[str] = Field(None, description="응답 창의성")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="최대 토큰 수")
    system_prompt: Optional[str] = Field(None, description="시스템 프롬프트")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    is_pinned: Optional[bool] = Field(None, description="고정 여부")
    is_favorite: Optional[bool] = Field(None, description="즐겨찾기 여부")

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v):
        """온도 값 유효성 검사"""
        if v is None:
            return v
        try:
            temp = float(v)
            if not (0.0 <= temp <= 2.0):
                raise ValueError("Temperature must be between 0.0 and 2.0")
            return str(temp)
        except ValueError as ex:
            raise ValueError("Temperature must be a valid number") from ex


class ChatMessageCreateRequest(ChatMessageBase):
    """채팅 메시지 생성 요청"""

    session_id: str = Field(..., description="세션 ID")

    class Config:
        """예시 데이터 설정"""

        example = {
            "session_id": "123e4567-e89b-12d3-a456-426614174000",
            "content": "프로젝트 관리에서 가장 중요한 것은 무엇인가요?",
            "role": "user",
            "input_mode": "text",
            "attachments": [],
        }


class ChatMessageUpdateRequest(BaseModel):
    """채팅 메시지 수정 요청"""

    content: Optional[str] = Field(None, min_length=1, description="메시지 내용")
    is_deleted: Optional[bool] = Field(None, description="삭제 여부")


class ChatTemplateCreateRequest(ChatTemplateBase):
    """채팅 템플릿 생성 요청"""

    class Config:
        """예시 데이터 설정"""

        example = {
            "name": "코드 리뷰 요청",
            "description": "코드 리뷰를 요청하는 템플릿",
            "content": "다음 코드를 리뷰해주세요:\n\n{code}\n\n개선점과 버그가 있다면 알려주세요.",
            "category": "개발",
            "tags": ["코드", "리뷰", "개발"],
            "is_public": False,
        }


class ChatTemplateUpdateRequest(BaseModel):
    """채팅 템플릿 수정 요청"""

    name: Optional[str] = Field(None, max_length=255, description="템플릿 이름")
    description: Optional[str] = Field(None, description="템플릿 설명")
    content: Optional[str] = Field(None, min_length=1, description="템플릿 내용")
    category: Optional[str] = Field(None, max_length=100, description="카테고리")
    tags: Optional[List[str]] = Field(None, description="태그 목록")
    is_public: Optional[bool] = Field(None, description="공개 여부")


class OpenAIMessageRequest(BaseModel):
    """OpenAI API 메시지 요청"""

    session_id: str = Field(..., description="세션 ID")
    message: str = Field(..., min_length=1, description="사용자 메시지")
    stream: bool = Field(default=False, description="스트림 응답 여부")

    class Config:
        """예시 데이터 설정"""

        example = {
            "session_id": "123e4567-e89b-12d3-a456-426614174000",
            "message": "FastAPI로 REST API를 만드는 방법을 알려주세요.",
            "stream": False,
        }


# ============================================================================
# 응답 스키마들
# ============================================================================


class ChatSessionResponse(UUIDEntity):
    """채팅 세션 응답"""

    title: str = Field(..., description="세션 제목")
    description: Optional[str] = Field(None, description="세션 설명")
    status: str = Field(..., description="세션 상태")
    model: str = Field(..., description="사용 중인 OpenAI 모델")
    temperature: str = Field(..., description="응답 창의성")
    max_tokens: int = Field(..., description="최대 토큰 수")
    system_prompt: Optional[str] = Field(None, description="시스템 프롬프트")
    tags: List[str] = Field(default=[], description="태그 목록")
    is_pinned: bool = Field(..., description="고정 여부")
    is_favorite: bool = Field(..., description="즐겨찾기 여부")
    user_id: str = Field(..., description="사용자 ID")
    message_count: int = Field(..., description="메시지 개수")
    total_tokens: int = Field(..., description="사용된 총 토큰")
    total_cost: str = Field(..., description="사용 비용")
    last_activity_at: datetime = Field(..., description="마지막 활동 시간")

    class Config:
        """
        예시 데이터 설정
        """

        from_attributes = True


class ChatMessageResponse(UUIDEntity):
    """채팅 메시지 응답"""

    content: str = Field(..., description="메시지 내용")
    role: str = Field(..., description="메시지 역할")
    status: str = Field(..., description="메시지 상태")
    session_id: str = Field(..., description="세션 ID")
    user_id: str = Field(..., description="작성자 ID")
    model_used: Optional[str] = Field(None, description="사용된 모델")
    tokens_used: Optional[int] = Field(None, description="사용된 토큰 수")
    cost: Optional[str] = Field(None, description="비용")
    response_time: Optional[int] = Field(None, description="응답 시간(ms)")
    input_mode: str = Field(..., description="입력 방식")
    attachments: List[Dict[str, Any]] = Field(default=[], description="첨부파일 정보")
    is_edited: bool = Field(..., description="편집 여부")
    is_deleted: bool = Field(..., description="삭제 여부")
    parent_message_id: Optional[str] = Field(None, description="부모 메시지 ID")

    class Config:
        """예시 데이터 설정"""

        from_attributes = True


class ChatTemplateResponse(UUIDEntity):
    """채팅 템플릿 응답"""

    name: str = Field(..., description="템플릿 이름")
    description: Optional[str] = Field(None, description="템플릿 설명")
    content: str = Field(..., description="템플릿 내용")
    category: Optional[str] = Field(None, description="카테고리")
    tags: List[str] = Field(default=[], description="태그 목록")
    user_id: str = Field(..., description="작성자 ID")
    is_public: bool = Field(..., description="공개 여부")
    is_featured: bool = Field(..., description="추천 여부")
    usage_count: int = Field(..., description="사용 횟수")
    likes_count: int = Field(..., description="좋아요 수")

    class Config:
        """예시 데이터 설정"""

        from_attributes = True


class OpenAIResponse(BaseModel):
    """OpenAI API 응답"""

    message_id: str = Field(..., description="생성된 메시지 ID")
    content: str = Field(..., description="AI 응답 내용")
    model: str = Field(..., description="사용된 모델")
    tokens_used: int = Field(..., description="사용된 토큰 수")
    cost: str = Field(..., description="비용")
    response_time: int = Field(..., description="응답 시간(ms)")

    class Config:
        """예시 데이터 설정"""

        example = {
            "message_id": "123e4567-e89b-12d3-a456-426614174001",
            "content": "FastAPI로 REST API를 만드는 방법은...",
            "model": "gpt-3.5-turbo",
            "tokens_used": 150,
            "cost": "0.0003",
            "response_time": 1200,
        }


class ChatUsageStatsResponse(BaseModel):
    """채팅 사용 통계 응답"""

    date: datetime = Field(..., description="통계 날짜")
    period_type: str = Field(..., description="기간 타입")
    sessions_count: int = Field(..., description="세션 수")
    messages_count: int = Field(..., description="메시지 수")
    tokens_used: int = Field(..., description="사용된 토큰")
    total_cost: str = Field(..., description="총 비용")
    model_usage: Dict[str, Any] = Field(..., description="모델별 사용량")

    class Config:
        """예시 데이터 설정"""

        from_attributes = True


# ============================================================================
# 목록 응답 스키마들
# ============================================================================


class ChatSessionListResponse(BaseModel):
    """채팅 세션 목록 응답"""

    sessions: List[ChatSessionResponse] = Field(..., description="세션 목록")
    total_count: int = Field(..., description="전체 세션 수")
    page_no: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지 크기")


class ChatMessageListResponse(BaseModel):
    """채팅 메시지 목록 응답"""

    messages: List[ChatMessageResponse] = Field(..., description="메시지 목록")
    total_count: int = Field(..., description="전체 메시지 수")
    page_no: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지 크기")


class ChatTemplateListResponse(BaseModel):
    """채팅 템플릿 목록 응답"""

    templates: List[ChatTemplateResponse] = Field(..., description="템플릿 목록")
    total_count: int = Field(..., description="전체 템플릿 수")
    page_no: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지 크기")


# ============================================================================
# 검색 및 필터 스키마들
# ============================================================================


class ChatSessionSearchRequest(BaseModel):
    """채팅 세션 검색 요청"""

    search_text: Optional[str] = Field(None, description="검색어")
    status: Optional[str] = Field(None, description="세션 상태")
    model: Optional[str] = Field(None, description="사용 모델")
    tags: Optional[List[str]] = Field(None, description="태그 필터")
    is_pinned: Optional[bool] = Field(None, description="고정 여부")
    is_favorite: Optional[bool] = Field(None, description="즐겨찾기 여부")
    start_date: Optional[datetime] = Field(None, description="시작 날짜")
    end_date: Optional[datetime] = Field(None, description="종료 날짜")
    page_no: int = Field(default=0, ge=0, description="페이지 번호")
    page_size: int = Field(default=20, ge=1, le=100, description="페이지 크기")


class ChatMessageSearchRequest(BaseModel):
    """채팅 메시지 검색 요청"""

    session_id: Optional[str] = Field(None, description="세션 ID")
    search_text: Optional[str] = Field(None, description="검색어")
    role: Optional[str] = Field(None, description="메시지 역할")
    status: Optional[str] = Field(None, description="메시지 상태")
    input_mode: Optional[str] = Field(None, description="입력 방식")
    start_date: Optional[datetime] = Field(None, description="시작 날짜")
    end_date: Optional[datetime] = Field(None, description="종료 날짜")
    page_no: int = Field(default=0, ge=0, description="페이지 번호")
    page_size: int = Field(default=50, ge=1, le=100, description="페이지 크기")


class ChatTemplateSearchRequest(BaseModel):
    """채팅 템플릿 검색 요청"""

    search_text: Optional[str] = Field(None, description="검색어")
    category: Optional[str] = Field(None, description="카테고리")
    tags: Optional[List[str]] = Field(None, description="태그 필터")
    is_public: Optional[bool] = Field(None, description="공개 여부")
    is_featured: Optional[bool] = Field(None, description="추천 여부")
    page_no: int = Field(default=0, ge=0, description="페이지 번호")
    page_size: int = Field(default=20, ge=1, le=100, description="페이지 크기")
