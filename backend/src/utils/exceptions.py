# backend/src/utils/exceptions.py
"""
Custom Exception Classes

Application-specific exceptions for better error handling and API responses.
"""

from typing import Any, Dict, Optional


class BaseAPIException(Exception):
    """Base exception class for API errors"""

    def __init__(
        self,
        message: str = "An error occurred",
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
    """Raised when input validation fails"""

    def __init__(
        self,
        message: str = "Validation error",
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
    """Raised when authentication fails"""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details,
        )


class AuthorizationError(BaseAPIException):
    """Raised when authorization fails"""

    def __init__(
        self,
        message: str = "Access denied",
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
    """Raised when a requested resource is not found"""

    def __init__(
        self,
        message: str = "Resource not found",
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
    """Raised when a resource conflict occurs"""

    def __init__(
        self,
        message: str = "Resource conflict",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT_ERROR",
            details=details,
        )


class DatabaseError(BaseAPIException):
    """Raised when database operations fail"""

    def __init__(
        self,
        message: str = "Database error",
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


class BusinessLogicError(BaseAPIException):
    """Raised when business logic rules are violated"""

    def __init__(
        self, message: str = "Business logic error", rule: Optional[str] = None
    ):
        details: Optional[Dict[str, Any]] = {}
        if rule:
            details["rule"] = rule

        super().__init__(
            message=message,
            status_code=422,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details,
        )


class ExternalServiceError(BaseAPIException):
    """Raised when external service calls fail"""

    def __init__(
        self,
        message: str = "External service error",
        service_name: Optional[str] = None,
        service_error: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
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
    """Raised when file operations fail"""

    def __init__(
        self,
        message: str = "File operation failed",
        filename: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if filename:
            details["filename"] = filename
        super().__init__(
            message=message,
            status_code=4132,
            error_code="FILE_ERROR",
            details=details,
        )


class FileSizeError(FileError):
    """Raised when file size exceeds limits"""

    def __init__(
        self,
        message: str = "File size exceeds limit",
        max_size: Optional[int] = None,
        actual_size: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if max_size:
            details["max_size"] = max_size
        if actual_size:
            details["actual_size"] = actual_size
        super().__init__(message, details=details)


class FileTypeError(FileError):
    """Raised when file type is not supported"""

    def __init__(
        self,
        message: str = "File type not supported",
        file_type: Optional[str] = None,
        allowed_types: Optional[list[str]] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if file_type:
            details["file_type"] = file_type
        if allowed_types:
            details["allowed_types"] = allowed_types
        super().__init__(message, details=details)


class FileUploadError(BaseAPIException):
    """Raised when file upload operations fail"""

    def __init__(
        self,
        message: str = "File upload error",
        filename: Optional[str] = None,
        file_size: Optional[int] = None,
        max_size: Optional[int] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        if filename:
            details["filename"] = filename
        if file_size:
            details["file_size"] = file_size
        if max_size:
            details["max_size"] = max_size

        super().__init__(
            message=message,
            status_code=413,
            error_code="FILE_UPLOAD_ERROR",
            details=details,
        )


class EmailError(BaseAPIException):
    """Raised when email operations fail"""

    def __init__(
        self,
        message: str = "Email operation failed",
        email_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if email_address:
            details["email_address"] = email_address
        super().__init__(message, error_code="EMAIL_ERROR", details=details)


class RateLimitError(BaseAPIException):
    """Raised when rate limits are exceeded"""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        limit: Optional[int] = None,
        reset_time: Optional[int] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
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
    """Raised when configuration is invalid or missing"""

    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        if config_key:
            details["config_key"] = config_key

        super().__init__(
            message=message,
            status_code=500,
            error_code="CONFIGURATION_ERROR",
            details=details,
        )


class PermissionDeniedError(AuthorizationError):
    """Raised when specific permissions are denied"""

    def __init__(
        self,
        message: str = "Permission denied",
        resource: Optional[str] = None,
        action: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        if resource:
            details["resource"] = resource
        if action:
            details["action"] = action

        super().__init__(
            message=message,
            details=details,
        )


# User-specific exceptions
class UserNotFoundError(NotFoundError):
    """Raised when user is not found"""

    def __init__(self, user_id: Optional[str] = None, email: Optional[str] = None):
        identifier = user_id or email or "unknown"
        message = f"User not found: {identifier}"
        super().__init__(message, "user", identifier)


class UserAlreadyExistsError(ConflictError):
    """Raised when trying to create a user that already exists"""

    def __init__(self, email: str):
        message = f"User already exists with email: {email}"
        super().__init__(message, {"email": email})


class InvalidPasswordError(ValidationError):
    """Raised when password is invalid"""

    def __init__(self, requirements: Optional[list[str]] = None):
        message = "Password does not meet requirements"
        details = {"requirements": requirements or []}
        super().__init__(message, "password", details)


class UserNotActiveError(AuthenticationError):
    """Raised when user account is not active"""

    def __init__(
        self,
        message: str = "User account is not active",
        user_status: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        details["auth_type"] = "USER_NOT_ACTIVE"
        if user_status:
            details["user_status"] = user_status

        super().__init__(message=message, details=details)


class TokenExpiredError(AuthenticationError):
    """Raised when authentication token has expired"""

    def __init__(
        self,
        message: str = "Token has expired",
        token_type: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        details["auth_type"] = "TOKEN_EXPIRED"
        if token_type:
            details["token_type"] = token_type

        super().__init__(message=message, details=details)


class InvalidTokenError(AuthenticationError):
    """Raised when authentication token is invalid"""

    def __init__(
        self, message: str = "Invalid token", token_type: Optional[str] = None
    ):
        details: Optional[Dict[str, Any]] = {}
        details["auth_type"] = "INVALID_TOKEN"
        if token_type:
            details["token_type"] = token_type

        super().__init__(message=message, details=details)


class EmailSendError(ExternalServiceError):
    """Raised when email sending fails"""

    def __init__(
        self,
        message: str = "Failed to send email",
        recipient: Optional[str] = None,
        email_type: Optional[str] = None,
    ):
        details = {}
        if recipient:
            details["recipient"] = recipient
        if email_type:
            details["email_type"] = email_type

        super().__init__(message=message, service_name="email_service")


class DuplicateResourceError(ConflictError):
    """Raised when trying to create a duplicate resource"""

    def __init__(
        self,
        message: str = "Resource already exists",
        resource_type: Optional[str] = None,
        identifier: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        details["conflicting_field"] = "IDENTIFIER"
        if resource_type:
            details["resource_type"] = resource_type
        if identifier:
            details["identifier"] = identifier

        super().__init__(message=message, details=details)


class InvalidOperationError(BusinessLogicError):
    """Raised when an invalid operation is attempted"""

    def __init__(
        self,
        message: str = "Invalid operation",
        operation: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        if operation:
            details["operation"] = operation
        if reason:
            details["reason"] = reason

        super().__init__(
            message=message,
            rule=(
                f"invalid_operation_{operation}" if operation else "invalid_operation"
            ),
        )


class ResourceLimitExceededError(BusinessLogicError):
    """Raised when resource limits are exceeded"""

    def __init__(
        self,
        message: str = "Resource limit exceeded",
        resource_type: Optional[str] = None,
        current_count: Optional[int] = None,
        max_limit: Optional[int] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        if resource_type:
            details["resource_type"] = resource_type
        if current_count:
            details["current_count"] = current_count
        if max_limit:
            details["max_limit"] = max_limit

        super().__init__(
            message=message,
            rule=(
                f"resource_limit_{resource_type}" if resource_type else "resource_limit"
            ),
        )


# Project-specific exceptions
class ProjectNotFoundError(NotFoundError):
    """Raised when project is not found"""

    def __init__(self, project_id: str):
        message = f"Project not found: {project_id}"
        super().__init__(message, "project", project_id)


class ProjectAccessDeniedError(AuthorizationError):
    """Raised when project access is denied"""

    def __init__(
        self,
        message: str = "Project access denied",
        project_id: Optional[int] = None,
        required_role: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        details["auth_type"] = "PROJECT_ACCESS_DENIED"
        if project_id:
            details["project_id"] = project_id
        if required_role:
            details["required_role"] = required_role

        super().__init__(message=message, details=details)


# Task-specific exceptions
class TaskNotFoundError(NotFoundError):
    """Raised when task is not found"""

    def __init__(self, task_id: str):
        message = f"Task not found: {task_id}"
        super().__init__(message, "task", task_id)


class TaskAssignmentError(ValidationError):
    """Raised when task assignment fails"""

    def __init__(self, message: str, task_id: Optional[str] = None):
        details: Optional[Dict[str, Any]] = {}
        if task_id:
            details["task_id"] = task_id
        super().__init__(message, "assignment", details)


class TaskAccessDeniedError(AuthorizationError):
    """Raised when task access is denied"""

    def __init__(
        self,
        message: str = "Task access denied",
        task_id: Optional[int] = None,
        required_permission: Optional[str] = None,
    ):
        details: Optional[Dict[str, Any]] = {}
        details["auth_type"] = "TASK_ACCESS_DENIED"
        if task_id:
            details["task_id"] = task_id
        if required_permission:
            details["required_permission"] = required_permission

        super().__init__(message=message, details=details)


# Calendar-specific exceptions
class EventNotFoundError(NotFoundError):
    """Raised when event is not found"""

    def __init__(self, event_id: str):
        message = f"Event not found: {event_id}"
        super().__init__(message, "event", event_id)


class EventConflictError(ConflictError):
    """Raised when there's a scheduling conflict"""

    def __init__(self, message: str, conflicting_events: Optional[list[str]] = None):
        details: Optional[Dict[str, Any]] = {}
        if conflicting_events:
            details["conflicting_events"] = conflicting_events
        super().__init__(message, details)


# Utility functions for exception handling
def create_error_response(exception: BaseAPIException) -> Dict[str, Any]:
    """Create standardized error response from exception"""
    return {
        "error": {
            "message": exception.message,
            "code": exception.error_code,
            "details": exception.details,
        }
    }


def is_client_error(exception: Exception) -> bool:
    """Check if exception is a client error (4xx)"""
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
    """Check if exception is a server error (5xx)"""
    server_errors = (
        DatabaseError,
        FileError,
        EmailError,
        ExternalServiceError,
        ConfigurationError,
    )
    return isinstance(exception, server_errors)


def get_http_status_code(exception: Exception) -> int:
    """Get appropriate HTTP status code for exception"""
    status_mapping: Dict[Any, int] = {
        ValidationError: 400,
        AuthenticationError: 401,
        AuthorizationError: 403,
        NotFoundError: 404,
        ConflictError: 409,
        RateLimitError: 429,
        DatabaseError: 500,
        FileError: 500,
        EmailError: 500,
        ExternalServiceError: 502,
        ConfigurationError: 500,
    }

    for exception_type, status_code in status_mapping.items():
        if isinstance(exception, exception_type):
            return status_code

    return 500  # Default to internal server error
