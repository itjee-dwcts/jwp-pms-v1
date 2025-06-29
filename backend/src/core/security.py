"""
Security and Authentication Utilities

JWT token handling, password hashing, and authentication management.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

import jwt
from fastapi import HTTPException, status
from jwt import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

from core.config import settings

logger = logging.getLogger(__name__)

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    """Token data model"""

    sub: Optional[str] = None
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None
    type: Optional[str] = None


class AuthManager:
    """Authentication manager for token handling"""

    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.access_token_expire_minutes
            )

        to_encode.update(
            {
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "access",
            }
        )

        encoded_jwt = jwt.encode(
            to_encode,
            self.secret_key,
            algorithm=self.algorithm,
        )
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            days=self.refresh_token_expire_days
        )

        to_encode.update(
            {
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "refresh",
            }
        )

        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def decode_token(self, token: str) -> TokenData:
        """Decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return TokenData(**payload)
        except JWTError as e:
            logger.warning("Token decode error: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e


# Global auth manager instance
auth_manager = AuthManager()


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create access token"""
    return auth_manager.create_access_token(data, expires_delta)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create refresh token"""
    return auth_manager.create_refresh_token(data)


def decode_access_token(token: str) -> TokenData:
    """Decode access token"""
    token_data = auth_manager.decode_token(token)

    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def decode_refresh_token(token: str) -> TokenData:
    """Decode refresh token"""
    token_data = auth_manager.decode_token(token)

    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


def generate_password_reset_token(email: str) -> str:
    """Generate password reset token"""
    delta = timedelta(hours=1)  # Reset token expires in 1 hour
    now = datetime.now(timezone.utc)
    expires = now + delta

    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email"""
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if decoded_token.get("type") != "password_reset":
            return None

        return decoded_token.get("sub")
    except InvalidTokenError:
        return None


def generate_email_verification_token(email: str) -> str:
    """Generate email verification token"""
    delta = timedelta(days=7)  # Verification token expires in 7 days
    now = datetime.now(timezone.utc)
    expires = now + delta

    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email, "type": "email_verification"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_email_verification_token(token: str) -> Optional[str]:
    """Verify email verification token and return email"""
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        if decoded_token.get("type") != "email_verification":
            return None

        return decoded_token.get("sub")
    except InvalidTokenError:
        return None


class SecurityHeaders:
    """Security headers for API responses"""

    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Get security headers dictionary"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'",
        }


def check_password_strength(
    password: str,
) -> Dict[str, Union[bool, str, list[str]]]:
    """Check password strength and return validation result"""
    result: Dict[str, Union[bool, str, list[str]]] = {
        "is_valid": True,
        "message": "Password is strong",
        "requirements": [],
    }

    requirements: list[str] = []

    if len(password) < 8:
        requirements.append("At least 8 characters")

    if not any(c.isupper() for c in password):
        requirements.append("At least one uppercase letter")

    if not any(c.islower() for c in password):
        requirements.append("At least one lowercase letter")

    if not any(c.isdigit() for c in password):
        requirements.append("At least one number")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        requirements.append("At least one special character")

    if requirements:
        result["is_valid"] = False
        result["message"] = "Password does not meet requirements"
        result["requirements"] = requirements

    return result
