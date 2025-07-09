"""
사용자 정의 예외 클래스

API 에러 처리 및 응답을 위한 애플리케이션별 예외들
"""

from typing import Any, Dict, Optional


class BaseAPIException(Exception):
    """API 오류를 위한 기본 예외 클래스"""

    def __init__(
        self,
        message: str = "오류가 발생했습니다",
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(BaseAPIException):
    """입력 유효성 검증 실패 시 발생"""

    def __init__(
        self,
        message: str = "유효성 검증 오류",
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        if field:
            if details is None:
                details = {}
            details["field"] = field
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class AuthenticationError(BaseAPIException):
    """인증 실패 시 발생"""

    def __init__(
        self,
        message: str = "인증에 실패했습니다",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details,
        )


class AuthorizationError(BaseAPIException):
    """권한 부족 시 발생"""

    def __init__(
        self,
        message: str = "접근이 거부되었습니다",
        resource: Optional[str] = None,
        action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if resource:
            details["resource"] = resource
        if action:
            details["action"] = action

        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details,
        )


class NotFoundError(BaseAPIException):
    """요청한 리소스를 찾을 수 없을 때 발생"""

    def __init__(
        self,
        message: str = "리소스를 찾을 수 없습니다",
        resource_type: Optional[str] = None,
        resource_id: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id

        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details,
        )


class ConflictError(BaseAPIException):
    """리소스 충돌이 발생했을 때 발생"""

    def __init__(
        self,
        message: str = "리소스 충돌이 발생했습니다",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT_ERROR",
            details=details,
        )


class DatabaseError(BaseAPIException):
    """데이터베이스 작업 실패 시 발생"""

    def __init__(
        self,
        message: str = "데이터베이스 오류가 발생했습니다",
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if operation:
            details["operation"] = operation

        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details,
        )


class BusinessException(BaseAPIException):
    """비즈니스 로직 규칙 위반 시 발생"""

    def __init__(
        self,
        message: str = "비즈니스 로직 오류가 발생했습니다",
        rule: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if rule:
            details["rule"] = rule

        super().__init__(
            message=message,
            status_code=422,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details,
        )


class ExternalServiceError(BaseAPIException):
    """외부 서비스 호출 실패 시 발생"""

    def __init__(
        self,
        message: str = "외부 서비스 오류가 발생했습니다",
        service_name: Optional[str] = None,
        service_error: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if service_name:
            details["service_name"] = service_name
        if service_error:
            details["service_error"] = service_error

        super().__init__(
            message=message,
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details,
        )


class FileError(BaseAPIException):
    """파일 작업 실패 시 발생"""

    def __init__(
        self,
        message: str = "파일 작업에 실패했습니다",
        filename: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if filename:
            details["filename"] = filename
        super().__init__(
            message=message,
            status_code=413,
            error_code="FILE_ERROR",
            details=details,
        )


class RateLimitError(BaseAPIException):
    """요청 속도 제한을 초과했을 때 발생"""

    def __init__(
        self,
        message: str = "요청 속도 제한을 초과했습니다",
        limit: Optional[int] = None,
        reset_time: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if limit:
            details["limit"] = limit
        if reset_time:
            details["reset_time"] = reset_time

        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_ERROR",
            details=details,
        )


class ConfigurationError(BaseAPIException):
    """설정이 잘못되었거나 누락되었을 때 발생"""

    def __init__(
        self,
        message: str = "설정 오류가 발생했습니다",
        config_key: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if config_key:
            details["config_key"] = config_key

        super().__init__(
            message=message,
            status_code=500,
            error_code="CONFIGURATION_ERROR",
            details=details,
        )


# 사용자 관련 예외들
class UserNotFoundError(NotFoundError):
    """사용자를 찾을 수 없을 때 발생"""

    def __init__(self, user_id: Optional[str] = None, email: Optional[str] = None):
        identifier = user_id or email or "알 수 없음"
        message = "사용자를 찾을 수 없습니다: %s" % identifier
        super().__init__(message, "user", identifier)


class UserAlreadyExistsError(ConflictError):
    """이미 존재하는 사용자를 생성하려고 할 때 발생"""

    def __init__(self, email: str):
        message = "이미 존재하는 이메일입니다: %s" % email
        super().__init__(message, {"email": email})


class InvalidPasswordError(ValidationError):
    """비밀번호가 유효하지 않을 때 발생"""

    def __init__(self, requirements: Optional[list[str]] = None):
        message = "비밀번호가 요구사항을 충족하지 않습니다"
        details = {"requirements": requirements or []}
        super().__init__(message, "password", details)


class UserNotActiveError(AuthenticationError):
    """사용자 계정이 비활성 상태일 때 발생"""

    def __init__(
        self,
        message: str = "사용자 계정이 활성화되지 않았습니다",
        user_status: Optional[str] = None,
    ):
        details = {"auth_type": "USER_NOT_ACTIVE"}
        if user_status:
            details["user_status"] = user_status

        super().__init__(message=message, details=details)


class TokenExpiredError(AuthenticationError):
    """인증 토큰이 만료되었을 때 발생"""

    def __init__(
        self,
        message: str = "토큰이 만료되었습니다",
        token_type: Optional[str] = None,
    ):
        details = {"auth_type": "TOKEN_EXPIRED"}
        if token_type:
            details["token_type"] = token_type

        super().__init__(message=message, details=details)


class InvalidTokenError(AuthenticationError):
    """유효하지 않은 토큰일 때 발생"""

    def __init__(
        self,
        message: str = "유효하지 않은 토큰입니다",
        token_type: Optional[str] = None,
    ):
        details = {"auth_type": "INVALID_TOKEN"}
        if token_type:
            details["token_type"] = token_type

        super().__init__(message=message, details=details)


# 프로젝트 관련 예외들
class ProjectNotFoundError(NotFoundError):
    """프로젝트를 찾을 수 없을 때 발생"""

    def __init__(self, project_id: str):
        message = "프로젝트를 찾을 수 없습니다: %s" % project_id
        super().__init__(message, "project", project_id)


class TaskNotFoundError(NotFoundError):
    """작업을 찾을 수 없을 때 발생"""

    def __init__(self, task_id: str):
        message = "작업을 찾을 수 없습니다: %s" % task_id
        super().__init__(message, "task", task_id)


class EventNotFoundError(NotFoundError):
    """이벤트를 찾을 수 없을 때 발생"""

    def __init__(self, event_id: str):
        message = "이벤트를 찾을 수 없습니다: %s" % event_id
        super().__init__(message, "event", event_id)


# 유틸리티 함수들
def create_error_response(exception: BaseAPIException) -> Dict[str, Any]:
    """예외로부터 표준화된 오류 응답 생성"""
    return {
        "error": {
            "message": exception.message,
            "code": exception.error_code,
            "details": exception.details,
        }
    }


def is_client_error(exception: Exception) -> bool:
    """클라이언트 오류(4xx)인지 확인"""
    client_errors = (
        ValidationError,
        AuthenticationError,
        AuthorizationError,
        NotFoundError,
        ConflictError,
        RateLimitError,
    )
    return isinstance(exception, client_errors)


def is_server_error(exception: Exception) -> bool:
    """서버 오류(5xx)인지 확인"""
    server_errors = (
        DatabaseError,
        FileError,
        ExternalServiceError,
        ConfigurationError,
    )
    return isinstance(exception, server_errors)


def get_http_status_code(exception: Exception) -> int:
    """예외에 적절한 HTTP 상태 코드 반환"""
    if isinstance(exception, BaseAPIException):
        return exception.status_code

    status_mapping = {
        ValidationError: 400,
        AuthenticationError: 401,
        AuthorizationError: 403,
        NotFoundError: 404,
        ConflictError: 409,
        RateLimitError: 429,
        DatabaseError: 500,
        FileError: 413,
        ExternalServiceError: 502,
        ConfigurationError: 500,
    }

    for exception_type, status_code in status_mapping.items():
        if isinstance(exception, exception_type):
            return status_code

    return 500  # 기본값: 내부 서버 오류
