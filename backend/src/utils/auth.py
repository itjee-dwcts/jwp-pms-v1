"""
Authentication and Authorization Utilities

JWT token handling, password hashing, and permission checking utilities.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from core.config import settings
from core.constants import TokenType, UserRole
from models.user import User
from schemas.auth import TokenData

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

# Role-based permissions mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    UserRole.ADMIN: [
        "users:read",
        "users:write",
        "users:delete",
        "projects:read",
        "projects:write",
        "projects:delete",
        "tasks:read",
        "tasks:write",
        "tasks:delete",
        "calendar:read",
        "calendar:write",
        "calendar:delete",
        "system:read",
        "system:write",
    ],
    UserRole.MANAGER: [
        "users:read",
        "projects:read",
        "projects:write",
        "tasks:read",
        "tasks:write",
        "tasks:delete",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.DEVELOPER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.TESTER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
    ],
    UserRole.CONTRIBUTOR: [
        "users:read",
        "projects:read",
        "tasks:read",
        "tasks:write",
        "calendar:read",
        "calendar:write",
    ],
    UserRole.VIEWER: [
        "users:read",
        "projects:read",
        "tasks:read",
        "calendar:read",
    ],
    UserRole.GUEST: [
        "projects:read",
        "tasks:read",
    ],
}


class AuthenticationError(Exception):
    """Authentication related errors"""


class AuthorizationError(Exception):
    """Authorization related errors"""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (ValueError, TypeError) as e:
        logger.error("Password verification failed: %s", e)
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    try:
        return pwd_context.hash(password)
    except (ValueError, TypeError) as e:
        logger.error("Password hashing failed: %s", e)
        raise


def create_token(
    data: Dict[str, Any],
    token_type: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create JWT token with specified type and expiration"""
    try:
        to_encode = data.copy()
        now = datetime.now(timezone.utc)

        if expires_delta:
            expire = now + expires_delta
        else:
            # Default expiration based on token type
            if token_type == TokenType.ACCESS:
                expire = now + timedelta(
                    minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
                )
            elif token_type == TokenType.REFRESH:
                expire = now + timedelta(
                    days=settings.REFRESH_TOKEN_EXPIRE_DAYS
                )
            elif token_type == TokenType.PASSWORD_RESET:
                expire = now + timedelta(hours=1)
            elif token_type == TokenType.EMAIL_VERIFICATION:
                expire = now + timedelta(days=7)
            else:
                expire = now + timedelta(minutes=30)  # Default

        to_encode.update({"exp": expire, "iat": now, "type": token_type})

        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )

        return encoded_jwt

    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("Failed to create %s token: %s", token_type, e)
        raise


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token"""
    return create_token(data, TokenType.ACCESS, expires_delta)


def create_refresh_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT refresh token"""
    return create_token(data, TokenType.REFRESH, expires_delta)


def verify_token(
    token: str, token_type: str = TokenType.ACCESS
) -> Optional[TokenData]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        # Check token type
        if payload.get("type") != token_type:
            logger.warning(
                "Token type mismatch. Expected: %s, Got: %s",
                token_type,
                payload.get("type"),
            )
            return None

        # Extract standard JWT claims
        sub = payload.get("sub")
        exp = payload.get("exp")
        iat = payload.get("iat")
        token_type_claim = payload.get("type")

        # Extract user information
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        email: str = payload.get("email")
        role: str = payload.get("role")
        scopes: List[str] = payload.get("scopes", [])

        if user_id is None:
            logger.warning("Token missing user_id")
            return None

        # Convert timestamps to datetime if present
        exp_datetime = None
        iat_datetime = None

        if exp:
            exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
        if iat:
            iat_datetime = datetime.fromtimestamp(iat, tz=timezone.utc)

        return TokenData(
            sub=sub or str(user_id),
            exp=exp_datetime,
            iat=iat_datetime,
            type=token_type_claim,
            user_id=user_id,
            username=username,
            email=email,
            role=role,
            scopes=scopes,
        )

    except jwt.ExpiredSignatureError:
        logger.warning("%s token has expired", token_type)
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid %s token: %s", token_type, e)
        return None
    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s token verification failed: %s", token_type, e)
        return None


def get_user_scopes(role: str) -> List[str]:
    """Get user scopes based on role"""
    if not UserRole.is_valid(role):
        logger.warning("Unknown role: %s", role)
        return ["projects:read", "tasks:read"]

    return ROLE_PERMISSIONS.get(role, ["projects:read", "tasks:read"])


def create_tokens_for_user(user: User) -> Dict[str, Union[str, int]]:
    """Create access and refresh tokens for user"""
    try:
        if not hasattr(user, "role") or user.role is None:
            raise ValueError("User role is missing or invalid.")

        # Ensure role is valid
        role_value = str(user.role)
        if not UserRole.is_valid(role_value):
            logger.warning(
                "Invalid user role: %s, defaulting to %s",
                role_value,
                UserRole.DEVELOPER,
            )
            role_value = UserRole.DEVELOPER

        # Token payload
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role_value,
            "scopes": get_user_scopes(role_value),
        }

        # Create tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(
            {"user_id": user.id, "role": role_value}
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    except Exception as e:
        logger.error("Failed to create tokens for user %s: %s", user.id, e)
        raise


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[TokenData]:
    """Get current user from token (optional - no error if no token)"""
    if not credentials:
        return None

    token_data = verify_token(credentials.credentials, TokenType.ACCESS)
    return token_data


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Get current user from token (required)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = verify_token(credentials.credentials, TokenType.ACCESS)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """Get current active user (additional validation can be added here)"""
    # Additional user validation could be performed here
    # For example, checking if user is still active in database
    return current_user


def require_permissions(required_permissions: List[str]):
    """Decorator to require specific permissions"""

    def permission_checker(
        current_user: TokenData = Depends(get_current_user),
    ) -> TokenData:
        if not current_user.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permissions assigned",
            )

        for perm in required_permissions:
            if perm not in current_user.scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Missing required permission: %s" % perm,
                )

        return current_user

    return permission_checker


def require_roles(required_roles: List[str]):
    """Decorator to require specific roles"""

    def role_checker(
        current_user: TokenData = Depends(get_current_user),
    ) -> TokenData:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role permissions",
            )

        return current_user

    return role_checker


def check_permission(user_role: str, resource: str, action: str) -> bool:
    """Check if user role has permission for resource and action"""
    user_scopes = get_user_scopes(user_role)
    required_scope = "%s:%s" % (resource, action)
    return required_scope in user_scopes


def generate_special_token(
    user_id: int,
    token_type: str,
    additional_data: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate special purpose tokens (reset, verification, etc.)"""
    try:
        data = {
            "user_id": user_id,
            "type": token_type,
        }

        if additional_data:
            data.update(additional_data)

        return create_token(data, token_type)

    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("Failed to generate %s token: %s", token_type, e)
        raise


def verify_special_token(
    token: str, token_type: str
) -> Optional[Dict[str, Any]]:
    """Verify special purpose tokens and return payload"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if payload.get("type") != token_type:
            return None

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("%s token has expired", token_type)
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid %s token: %s", token_type, e)
        return None
    except (jwt.PyJWTError, ValueError, TypeError) as e:
        logger.error("%s token verification failed: %s", token_type, e)
        return None


class AuthManager:
    """Enhanced Authentication manager class"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return get_password_hash(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return verify_password(password, hashed)

    @staticmethod
    def create_tokens(user: User) -> Dict[str, Union[str, int]]:
        """Create authentication tokens for user"""
        return create_tokens_for_user(user)

    @staticmethod
    def refresh_tokens(refresh_token: str) -> Dict[str, Union[str, int]]:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            token_data = AuthManager.verify_refresh_token(refresh_token)

            if not token_data:
                raise AuthenticationError("Invalid refresh token")

            # Create new tokens with same user data
            user_data = {
                "user_id": token_data.user_id,
                "username": token_data.username,
                "email": token_data.email,
                "role": token_data.role,
                "scopes": token_data.scopes or [],
            }

            # Generate new tokens
            access_token = create_access_token(user_data)
            new_refresh_token = create_refresh_token(
                {"user_id": token_data.user_id, "role": token_data.role}
            )

            return {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            }

        except (jwt.PyJWTError, ValueError, TypeError) as e:
            logger.error("Token refresh failed: %s", e)
            raise AuthenticationError("Token refresh failed") from e

    @staticmethod
    def verify_access_token(token: str) -> Optional[TokenData]:
        """Verify access token"""
        return verify_token(token, TokenType.ACCESS)

    @staticmethod
    def verify_refresh_token(token: str) -> Optional[TokenData]:
        """Verify refresh token"""
        return verify_token(token, TokenType.REFRESH)

    @staticmethod
    def generate_password_reset_token(user_id: int) -> str:
        """Generate password reset token"""
        return generate_special_token(user_id, TokenType.PASSWORD_RESET)

    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[int]:
        """Verify password reset token and return user ID"""
        payload = verify_special_token(token, TokenType.PASSWORD_RESET)
        return payload.get("user_id") if payload else None

    @staticmethod
    def generate_email_verification_token(user_id: int, email: str) -> str:
        """Generate email verification token"""
        return generate_special_token(
            user_id, TokenType.EMAIL_VERIFICATION, {"email": email}
        )

    @staticmethod
    def verify_email_verification_token(
        token: str,
    ) -> Optional[Dict[str, Any]]:
        """Verify email verification token"""
        payload = verify_special_token(token, TokenType.EMAIL_VERIFICATION)
        if payload:
            return {
                "user_id": payload.get("user_id"),
                "email": payload.get("email"),
            }
        return None


# Convenience functions for backward compatibility
def require_scopes(required_scopes: List[str]):
    """Backward compatibility - use require_permissions instead"""
    return require_permissions(required_scopes)


def generate_reset_token(user_id: int) -> str:
    """Backward compatibility"""
    return AuthManager.generate_password_reset_token(user_id)


def verify_reset_token(token: str) -> Optional[int]:
    """Backward compatibility"""
    return AuthManager.verify_password_reset_token(token)


def generate_email_verification_token(user_id: int, email: str) -> str:
    """Backward compatibility"""
    return AuthManager.generate_email_verification_token(user_id, email)


def verify_email_verification_token(token: str) -> Optional[Dict[str, Any]]:
    """Backward compatibility"""
    return AuthManager.verify_email_verification_token(token)
