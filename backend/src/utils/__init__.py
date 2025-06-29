"""
Utilities Package

Common utilities and helper functions for the PMS application.
"""

from .auth import (
    AuthManager,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    require_roles,
    require_scopes,
    verify_password,
    verify_token,
)
from .exceptions import (
    AuthenticationError,
    AuthorizationError,
    BaseAPIException,
    BusinessLogicError,
    ConflictError,
    DatabaseError,
    NotFoundError,
    ValidationError,
)
from .field_updater import SafeFieldUpdater
from .helper import generate_random_string
from .logger import AuditLogger, SecurityLogger, get_logger, setup_logging

__all__ = [
    # Auth utilities
    "AuthManager",
    "create_access_token",
    "create_refresh_token",
    "get_current_user",
    "get_password_hash",
    "require_roles",
    "require_scopes",
    "verify_password",
    "verify_token",
    # Exception classes
    "AuthenticationError",
    "AuthorizationError",
    "BaseAPIException",
    "BusinessLogicError",
    "ConflictError",
    "DatabaseError",
    "NotFoundError",
    "ValidationError",
    # Logger utilities
    "get_logger",
    "setup_logging",
    "AuditLogger",
    "SecurityLogger",
    # Helper functions
    "generate_random_string",
    # Safe field updater
    "SafeFieldUpdater",
]
