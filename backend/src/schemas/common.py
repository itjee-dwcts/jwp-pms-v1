"""
공통 스키마

애플리케이션 전체에서 사용되는 공유 Pydantic 모델들
"""

import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class UUIDEntity(BaseModel):
    """UUID를 사용하는 엔티티 기본 스키마"""

    id: str = Field(..., description="고유 식별자 (UUID)")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: Optional[datetime] = Field(None, description="수정 시간")
    created_by: Optional[str] = Field(None, description="생성자 ID")
    updated_by: Optional[str] = Field(None, description="수정자 ID")

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        """UUID 형식 검증"""
        try:
            uuid.UUID(v)
            return v
        except ValueError as e:
            raise ValueError("유효하지 않은 UUID 형식입니다") from e

    class Config:
        """Pydantic 설정"""

        from_attributes = True


class IntEntity(BaseModel):
    """정수 ID를 사용하는 엔티티 기본 스키마"""

    id: int = Field(..., description="고유 식별자")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: Optional[datetime] = Field(None, description="수정 시간")
    created_by: Optional[int] = Field(None, description="생성자 ID")
    updated_by: Optional[int] = Field(None, description="수정자 ID")

    class Config:
        """Pydantic 설정"""

        from_attributes = True


class PaginationParams(BaseModel):
    """페이지네이션 매개변수 스키마"""

    page_no: int = Field(default=1, ge=1, description="페이지 번호")
    page_size: int = Field(default=20, ge=1, le=100, description="페이지당 항목 수")
    sort_by: Optional[str] = Field(None, description="정렬 필드")
    sort_order: str = Field(default="asc", description="정렬 순서: asc 또는 desc")

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        """정렬 순서 검증"""
        if v not in ["asc", "desc"]:
            raise ValueError('정렬 순서는 "asc" 또는 "desc"여야 합니다')
        return v


class SortParams(BaseModel):
    """정렬 매개변수 스키마"""

    field: str = Field(..., description="정렬할 필드")
    order: str = Field(default="asc", description="정렬 순서: asc 또는 desc")

    @field_validator("order")
    @classmethod
    def validate_order(cls, v: str) -> str:
        """정렬 순서 검증"""
        if v not in ["asc", "desc"]:
            raise ValueError('정렬 순서는 "asc" 또는 "desc"여야 합니다')
        return v


class SearchParams(BaseModel):
    """검색 매개변수 스키마"""

    query: Optional[str] = Field(None, description="검색 쿼리")
    fields: Optional[List[str]] = Field(None, description="검색할 필드들")
    filters: Optional[Dict[str, Any]] = Field(None, description="추가 필터")


class FilterParams(BaseModel):
    """필터 매개변수 스키마"""

    field: str = Field(..., description="필터링할 필드")
    operator: str = Field(..., description="필터 연산자")
    value: Any = Field(..., description="필터 값")

    @field_validator("operator")
    @classmethod
    def validate_operator(cls, v: str) -> str:
        """필터 연산자 검증"""
        valid_operators = [
            "eq",  # 같음
            "ne",  # 같지 않음
            "gt",  # 큼
            "gte",  # 크거나 같음
            "lt",  # 작음
            "lte",  # 작거나 같음
            "in",  # 포함됨
            "not_in",  # 포함되지 않음
            "like",  # LIKE (대소문자 구분)
            "ilike",  # ILIKE (대소문자 구분 안함)
            "contains",  # 포함
            "startswith",  # 시작함
            "endswith",  # 끝남
        ]
        if v not in valid_operators:
            raise ValueError(
                f"연산자는 다음 중 하나여야 합니다: {', '.join(valid_operators)}"
            )
        return v


class PaginatedResponse(BaseModel, Generic[T]):
    """제네릭 페이지네이션 응답 스키마"""

    items: List[T]
    total_items: int = Field(..., description="전체 항목 수")
    page_no: int = Field(..., description="현재 페이지 번호")
    page_size: int = Field(..., description="페이지당 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")

    @classmethod
    def create(
        cls,
        items: List[T],
        total_items: int,
        page_no: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        """페이지네이션 응답 생성 헬퍼 메서드"""
        total_pages = (total_items + page_size - 1) // page_size
        has_next = page_no < total_pages
        has_prev = page_no > 1

        return cls(
            items=items,
            total_items=total_items,
            page_no=page_no,
            page_size=page_size,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev,
        )


class DateRangeFilter(BaseModel):
    """날짜 범위 필터 스키마"""

    start_date: Optional[datetime] = Field(None, description="시작 날짜")
    end_date: Optional[datetime] = Field(None, description="종료 날짜")

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v, info):
        """종료 날짜 검증"""
        if v and info.data.get("start_date") and v < info.data["start_date"]:
            raise ValueError("종료 날짜는 시작 날짜보다 늦어야 합니다")
        return v


class SuccessResponse(BaseModel):
    """성공 응답 스키마"""

    success: bool = True
    message: str = Field(..., description="성공 메시지")
    data: Optional[Any] = Field(None, description="응답 데이터")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorResponse(BaseModel):
    """오류 응답 스키마"""

    success: bool = False
    error: str = Field(..., description="오류 메시지")
    error_code: Optional[str] = Field(None, description="오류 코드")
    details: Optional[Dict[str, Any]] = Field(None, description="오류 세부사항")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ValidationErrorResponse(BaseModel):
    """유효성 검사 오류 응답 스키마"""

    success: bool = False
    error: str = "유효성 검사 오류"
    details: List[Dict[str, Any]] = Field(..., description="유효성 검사 오류 세부사항")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FileUploadResponse(BaseModel):
    """파일 업로드 응답 스키마"""

    file_name: str = Field(..., description="원본 파일명")
    file_path: str = Field(..., description="파일 저장 경로")
    file_size: int = Field(..., description="파일 크기 (바이트)")
    mime_type: Optional[str] = Field(None, description="MIME 타입")
    url: str = Field(..., description="파일 접근 URL")
    upload_id: Optional[str] = Field(None, description="업로드 ID")
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BulkOperationRequest(BaseModel):
    """대량 작업 요청 스키마"""

    ids: Annotated[
        List[str],
        Field(
            min_length=1,
            max_length=100,
            description="작업할 ID 목록",
        ),
    ]
    operation: str = Field(..., description="수행할 작업")
    parameters: Optional[Dict[str, Any]] = Field(None, description="작업 매개변수")

    @field_validator("operation")
    @classmethod
    def validate_operation(cls, v: str) -> str:
        """작업 유형 검증"""
        valid_operations = [
            "delete",
            "archive",
            "restore",
            "update",
            "export",
            "move",
            "copy",
            "activate",
            "deactivate",
        ]
        if v not in valid_operations:
            raise ValueError(
                f"작업은 다음 중 하나여야 합니다: {', '.join(valid_operations)}"
            )
        return v


class BulkOperationResponse(BaseModel):
    """대량 작업 응답 스키마"""

    total_count: int = Field(..., description="처리된 총 항목 수")
    success_count: int = Field(..., description="성공한 항목 수")
    failure_count: int = Field(..., description="실패한 항목 수")
    errors: List[Dict[str, Any]] = Field(default=[], description="오류 세부사항")
    operation: str = Field(..., description="수행된 작업")
    duration_ms: Optional[int] = Field(None, description="작업 소요 시간(밀리초)")
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HealthCheckResponse(BaseModel):
    """상태 확인 응답 스키마"""

    status: str = Field(..., description="상태")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str = Field(..., description="애플리케이션 버전")
    environment: str = Field(..., description="환경명")
    services: Dict[str, str] = Field(default={}, description="서비스 상태")
    details: Optional[Dict[str, Any]] = Field(None, description="추가 상태 세부사항")
    uptime_seconds: Optional[int] = Field(None, description="가동 시간(초)")


class SystemInfoResponse(BaseModel):
    """시스템 정보 응답 스키마"""

    application: Dict[str, Any] = Field(..., description="애플리케이션 정보")
    system: Dict[str, Any] = Field(..., description="시스템 정보")
    configuration: Dict[str, Any] = Field(..., description="설정 상태")
    features: Dict[str, bool] = Field(..., description="기능 사용 가능 여부")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatsResponse(BaseModel):
    """통계 응답 스키마"""

    total_count: int = Field(..., description="전체 항목 수")
    counts_by_status: Dict[str, int] = Field(default={}, description="상태별 개수")
    counts_by_type: Dict[str, int] = Field(default={}, description="유형별 개수")
    recent_activity: List[Dict[str, Any]] = Field(default=[], description="최근 활동")
    trends: Dict[str, Any] = Field(default={}, description="트렌드 데이터")
    period: Optional[str] = Field(None, description="통계 기간")
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExportRequest(BaseModel):
    """내보내기 요청 스키마"""

    format: str = Field(..., description="내보내기 형식: csv, xlsx, json, pdf")
    filters: Optional[Dict[str, Any]] = Field(None, description="내보내기 필터")
    fields: Optional[List[str]] = Field(None, description="포함할 필드")
    options: Optional[Dict[str, Any]] = Field(None, description="내보내기 옵션")

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str):
        """내보내기 형식 검증"""
        valid_formats = ["csv", "xlsx", "json", "pdf"]
        if v not in valid_formats:
            raise ValueError(
                f"형식은 다음 중 하나여야 합니다: {', '.join(valid_formats)}"
            )
        return v


class ExportResponse(BaseModel):
    """내보내기 응답 스키마"""

    export_id: str = Field(..., description="내보내기 작업 ID")
    status: str = Field(..., description="내보내기 상태")
    format: str = Field(..., description="내보내기 형식")
    download_url: Optional[str] = Field(None, description="준비된 경우 다운로드 URL")
    expires_at: Optional[datetime] = Field(None, description="다운로드 만료 시간")
    file_size: Optional[int] = Field(None, description="파일 크기 (바이트)")
    record_count: Optional[int] = Field(None, description="내보낸 레코드 수")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(None, description="완료 시간")


class ImportRequest(BaseModel):
    """가져오기 요청 스키마"""

    file_path: str = Field(..., description="업로드된 파일 경로")
    format: str = Field(..., description="가져오기 형식: csv, xlsx, json")
    mapping: Optional[Dict[str, str]] = Field(None, description="필드 매핑")
    options: Optional[Dict[str, Any]] = Field(None, description="가져오기 옵션")
    validate_only: bool = Field(default=False, description="검증만 수행")

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str):
        """가져오기 형식 검증"""
        valid_formats = ["csv", "xlsx", "json"]
        if v not in valid_formats:
            raise ValueError(
                f"형식은 다음 중 하나여야 합니다: {', '.join(valid_formats)}"
            )
        return v


class ImportResponse(BaseModel):
    """가져오기 응답 스키마"""

    import_id: str = Field(..., description="가져오기 작업 ID")
    status: str = Field(..., description="가져오기 상태")
    format: str = Field(..., description="가져오기 형식")
    total_records: Optional[int] = Field(None, description="가져올 총 레코드 수")
    processed_records: int = Field(default=0, description="처리된 레코드 수")
    successful_records: int = Field(
        default=0, description="성공적으로 가져온 레코드 수"
    )
    failed_records: int = Field(default=0, description="실패한 레코드 수")
    errors: List[Dict[str, Any]] = Field(default=[], description="가져오기 오류")
    warnings: List[Dict[str, Any]] = Field(default=[], description="가져오기 경고")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = Field(None, description="완료 시간")


class NotificationPreferences(BaseModel):
    """알림 설정 스키마"""

    email_notifications: bool = Field(default=True, description="이메일 알림 활성화")
    push_notifications: bool = Field(default=True, description="푸시 알림 활성화")
    task_assigned: bool = Field(default=True, description="작업 할당 시 알림")
    task_completed: bool = Field(default=True, description="작업 완료 시 알림")
    project_updates: bool = Field(default=True, description="프로젝트 업데이트 알림")
    deadline_reminders: bool = Field(default=True, description="마감일 알림 전송")
    event_reminders: bool = Field(default=True, description="이벤트 알림 전송")
    chat_mentions: bool = Field(default=True, description="채팅 멘션 알림")
    daily_summary: bool = Field(default=False, description="일일 요약 알림")


class ActivityLogEntry(BaseModel):
    """활동 로그 항목 스키마"""

    id: int
    user_id: Optional[str] = None
    action: str = Field(..., description="수행된 작업")
    resource_type: Optional[str] = Field(None, description="리소스 유형")
    resource_id: Optional[str] = Field(None, description="리소스 ID")
    details: Optional[Dict[str, Any]] = Field(None, description="작업 세부사항")
    ip_address: Optional[str] = Field(None, description="IP 주소")
    user_agent: Optional[str] = Field(None, description="사용자 에이전트")
    session_id: Optional[str] = Field(None, description="세션 ID")
    timestamp: datetime = Field(..., description="작업 시간")

    class Config:
        """Pydantic 설정"""

        from_attributes = True


class ActivityLogResponse(BaseModel):
    """활동 로그 응답 스키마"""

    logs: List[ActivityLogEntry]
    total_items: int
    page_no: int
    page_size: int
    total_pages: int


class TimeRange(BaseModel):
    """시간 범위 스키마"""

    start: datetime = Field(..., description="시작 시간")
    end: datetime = Field(..., description="종료 시간")

    @field_validator("end")
    @classmethod
    def validate_end(cls, v, info):
        """종료 시간 검증"""
        if info.data.get("start") and v <= info.data["start"]:
            raise ValueError("종료 시간은 시작 시간보다 늦어야 합니다")
        return v


class Coordinates(BaseModel):
    """지리 좌표 스키마"""

    latitude: float = Field(..., ge=-90, le=90, description="위도")
    longitude: float = Field(..., ge=-180, le=180, description="경도")


class Address(BaseModel):
    """주소 스키마"""

    street: Optional[str] = Field(None, max_length=200, description="도로명 주소")
    city: Optional[str] = Field(None, max_length=100, description="도시")
    state: Optional[str] = Field(None, max_length=100, description="주/도")
    postal_code: Optional[str] = Field(None, max_length=20, description="우편번호")
    country: Optional[str] = Field(None, max_length=100, description="국가")
    coordinates: Optional[Coordinates] = Field(None, description="지리 좌표")


class ContactInfo(BaseModel):
    """연락처 정보 스키마"""

    email: Optional[str] = Field(None, description="이메일 주소")
    phone: Optional[str] = Field(None, max_length=20, description="전화번호")
    website: Optional[str] = Field(None, max_length=200, description="웹사이트 URL")
    address: Optional[Address] = Field(None, description="실제 주소")


class Metadata(BaseModel):
    """제네릭 메타데이터 스키마"""

    created_at: datetime = Field(..., description="생성 시간")
    created_by: Optional[str] = Field(None, description="생성자 사용자 ID")
    updated_at: Optional[datetime] = Field(..., description="마지막 업데이트 시간")
    updated_by: Optional[str] = Field(None, description="마지막 업데이터 사용자 ID")
    version: int = Field(default=1, description="버전 번호")
    tags: List[str] = Field(default=[], description="연관된 태그")
    custom_fields: Optional[Dict[str, Any]] = Field(
        None, description="사용자 정의 필드"
    )

    class Config:
        """Pydantic 설정"""

        from_attributes = True


class APIKeyInfo(BaseModel):
    """API 키 정보 스키마"""

    key_id: str = Field(..., description="API 키 ID")
    name: str = Field(..., description="API 키 이름")
    prefix: str = Field(..., description="API 키 접두사")
    permissions: List[str] = Field(..., description="권한 목록")
    last_used: Optional[datetime] = Field(None, description="마지막 사용 시간")
    expires_at: Optional[datetime] = Field(None, description="만료 시간")
    is_active: bool = Field(..., description="활성 상태")
    created_at: datetime = Field(..., description="생성 시간")

    class Config:
        from_attributes = True


class WebhookInfo(BaseModel):
    """웹훅 정보 스키마"""

    webhook_id: str = Field(..., description="웹훅 ID")
    name: str = Field(..., description="웹훅 이름")
    url: str = Field(..., description="웹훅 URL")
    events: List[str] = Field(..., description="구독 이벤트 목록")
    secret: Optional[str] = Field(None, description="서명 검증용 시크릿")
    is_active: bool = Field(..., description="활성 상태")
    last_triggered: Optional[datetime] = Field(None, description="마지막 트리거 시간")
    success_count: int = Field(default=0, description="성공 횟수")
    failure_count: int = Field(default=0, description="실패 횟수")
    created_at: datetime = Field(..., description="생성 시간")

    class Config:
        from_attributes = True


# 업데이트된 __all__ 리스트
__all__ = [
    # 기본 엔티티
    "UUIDEntity",
    "IntEntity",
    # 페이지네이션 및 정렬
    "PaginationParams",
    "SortParams",
    "PaginatedResponse",
    # 검색 및 필터
    "SearchParams",
    "FilterParams",
    "DateRangeFilter",
    # 응답 타입
    "SuccessResponse",
    "ErrorResponse",
    "ValidationErrorResponse",
    # 파일 관련
    "FileUploadResponse",
    # 대량 작업
    "BulkOperationRequest",
    "BulkOperationResponse",
    # 시스템 관련
    "HealthCheckResponse",
    "SystemInfoResponse",
    "StatsResponse",
    # 가져오기/내보내기
    "ExportRequest",
    "ExportResponse",
    "ImportRequest",
    "ImportResponse",
    # 기타
    "NotificationPreferences",
    "ActivityLogEntry",
    "ActivityLogResponse",
    "TimeRange",
    "Coordinates",
    "Address",
    "ContactInfo",
    "Metadata",
    "APIKeyInfo",
    "WebhookInfo",
]
