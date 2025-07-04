"""
User Service

Business logic for user management operations.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, cast

from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count

from core.constants import UserRole, UserStatus
from core.database import get_async_session
from models.user import User, UserActivityLog
from schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserPasswordChangeRequest,
    UserResponse,
    UserStatsResponse,
    UserUpdateRequest,
)
from utils.auth import get_password_hash, verify_password
from utils.exceptions import AuthenticationError, ConflictError, NotFoundError

logger = logging.getLogger(__name__)


class UserService:
    """User management service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(
        self, user_data: UserCreateRequest, created_by: Optional[int] = None
    ) -> User:
        """
        Create a new user

        Args:
            user_data: User creation data
            created_by: ID of user creating this user

        Returns:
            Created User object

        Raises:
            ValueError: If user with email or username already exists
        """
        try:
            # Check if username or email already exists
            existing_user = await self.get_user_by_email_or_username(
                user_data.email, user_data.username
            )

            if existing_user:
                existing_user_email = getattr(existing_user, "email", None)
                if existing_user_email is not None:
                    if existing_user_email == user_data.email:
                        raise ConflictError("Email already exists")

                existing_user_name = getattr(existing_user, "name", None)
                if existing_user_name is not None:
                    if existing_user_name == user_data.username:
                        raise ConflictError("Username already exists")

            # Hash password
            hashed_password = get_password_hash(user_data.password)

            # Create user
            user = User(
                username=user_data.username,
                email=user_data.email,
                full_name=user_data.full_name,
                password_hash=hashed_password,
                role=user_data.role or UserRole.DEVELOPER,
                status=user_data.status or UserStatus.ACTIVE,
                created_at=datetime.utcnow(),
                created_by=created_by,
            )

            self.db.add(user)
            await self.db.flush()

            user_id = getattr(user, "id", None)
            if user_id is not None:
                # Log activity
                await self._log_activity(
                    user_id=user_id,
                    action="user_created",
                    details={"username": user.username, "email": user.email},
                )

            await self.db.commit()
            await self.db.refresh(user)

            logger.info("User created successfully: %s", user.name)
            return user

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to create user: %s", e)
            raise

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID

        Args:
            user_id: User ID

        Returns:
            User object if found, None otherwise
        """
        try:
            query = select(User).where(User.id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("Failed to get user by ID %d: %s", user_id, e)
            raise

    async def get_user_by_ids(self, user_ids: List[int]) -> List[User]:
        """
        Get multiple users by their IDs

        Args:
            user_ids: List of user IDs

        Returns:
            List of User objects
        """
        try:
            if not user_ids:
                return []

            query = select(User).where(User.id.in_(user_ids))
            result = await self.db.execute(query)
            return list(result.scalars().all())

        except Exception as e:
            logger.error("Failed to get user by IDs: %s", e)
            raise

    async def get_user_by_name(self, name: str) -> Optional[User]:
        """
        Get user by username

        Args:
            username: Username

        Returns:
            User object if found, None otherwise
        """
        try:
            query = select(User).where(User.name == name)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("Failed to get user by username %s: %s", name, e)
            raise

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address

        Args:
            email: User email address

        Returns:
            User object if found, None otherwise
        """
        try:
            query = select(User).where(User.email == email)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("Failed to get user by email %s: %s", email, e)
            raise

    async def get_user_by_email_or_username(
        self, email: str, username: str
    ) -> Optional[User]:
        """
        Get user by email or username

        Args:
            email: User email address
            username: Username

        Returns:
            User object if found, None otherwise
        """
        query = select(User).where(
            or_(User.email == email, User.name == username)
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_user(
        self, user_id: int, user_data: UserUpdateRequest, updated_by: int
    ) -> Optional[User]:
        """
        Update user information

        Args:
            user_id: ID of user to update
            user_data: Update data
            updated_by: ID of user performing the update

        Returns:
            Updated User object if found, None otherwise
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None

            # Update fields
            update_data = user_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(user, field, value)

            setattr(user, "updated_by", updated_by)
            setattr(user, "updated_at", datetime.utcnow())
            # user.updated_by = updated_by
            # user.updated_at = datetime.utcnow()

            # Log activity
            await self._log_activity(
                user_id=updated_by,
                action="user_updated",
                resource_type="user",
                resource_id=user_id,
                details={"updated_fields": list(update_data.keys())},
            )

            await self.db.commit()
            await self.db.refresh(user)

            logger.info("User updated successfully: %s", user.name)
            return user

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to update user %d: %s", user_id, e)
            raise

    async def change_password(
        self, user_id: int, password_data: UserPasswordChangeRequest
    ) -> bool:
        """Change user password"""
        try:
            result = await self.db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                raise NotFoundError(f"User with ID {user_id} not found")

            # Verify current password
            if not verify_password(
                password_data.current_password, user.password_hash
            ):
                raise AuthenticationError("Current password is incorrect")

            # Update password
            setattr(
                user, "password", get_password_hash(password_data.new_password)
            )
            setattr(user, "password_changed_at", datetime.utcnow())
            setattr(user, "updated_at", datetime.utcnow())

            setattr(user, "updated_by", user_id)

            # Log activity
            await self._log_activity(
                user_id=user_id,
                action="password_changed",
                details={"user_id": user_id},
            )

            await self.db.commit()

            logger.info("Password changed for user: %s", user.username)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to change password for user %d: %s", user_id, e
            )
            raise

    async def update_user_password(
        self, user_id: int, new_password: str, updated_by: int
    ) -> bool:
        """
        Update user password

        Args:
            user_id: ID of user to update
            new_password: New plain text password
            updated_by: ID of user performing the update

        Returns:
            True if successful, False if user not found
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        # Hash new password
        setattr(user, "password", get_password_hash(new_password))
        setattr(user, "password_changed_at", datetime.utcnow())
        setattr(user, "updated_at", datetime.utcnow())
        setattr(user, "updated_by", updated_by)

        # Create activity log
        activity_log = UserActivityLog(
            user_id=user.id,
            action="update",
            resource_type="user",
            resource_id=str(user.id),
            description=f"Password updated by {updated_by}",
            created_at=datetime.utcnow(),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def deactivate_user(self, user_id: int, deactivated_by: int) -> bool:
        """
        Deactivate user (soft delete)

        Args:
            user_id: ID of user to deactivate
            deactivated_by: ID of user performing the deactivation

        Returns:
            True if successful, False if user not found
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        setattr(user, "is_active", False)
        setattr(user, "status", UserStatus.INACTIVE)
        setattr(user, "updated_at", datetime.utcnow())
        setattr(user, "updated_by", deactivated_by)

        # Create activity log
        activity_log = UserActivityLog(
            user_id=user.id,
            action="deactivate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"User deactivated by {deactivated_by}",
            created_at=datetime.utcnow(),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def activate_user(self, user_id: int, activated_by: int) -> bool:
        """
        Activate user

        Args:
            user_id: ID of user to activate
            activated_by: ID of user performing the activation

        Returns:
            True if successful, False if user not found
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        setattr(user, "is_active", True)
        setattr(user, "status", UserStatus.ACTIVE)
        setattr(user, "updated_at", datetime.utcnow())
        setattr(user, "updated_by", activated_by)

        # Create activity log
        activity_log = UserActivityLog(
            user_id=user.id,
            action="activate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"User activated by {activated_by}",
            created_at=datetime.utcnow(),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def delete_user(self, user_id: int, deleted_by: int) -> bool:
        """
        Permanently delete user (hard delete)

        Args:
            user_id: ID of user to delete

        Returns:
            True if successful, False if user not found

        Note:
            This is a hard delete. Consider using deactivate_user instead
            for soft delete functionality.
        """
        try:
            result = await self.db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                raise NotFoundError(f"User with ID {user_id} not found")

            # Soft delete by changing status
            setattr(user, "is_active", False)
            setattr(user, "status", UserStatus.INACTIVE)
            setattr(user, "updated_by", deleted_by)
            setattr(user, "updated_at", datetime.utcnow())

            # Log activity
            await self._log_activity(
                user_id=deleted_by,
                action="user_deleted",
                resource_type="user",
                resource_id=user_id,
                details={"username": user.username},
            )

            await self.db.commit()

            logger.info("User soft deleted: %s", user.username)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("Failed to delete user %d: %s", user_id, e)
            raise

    async def list_users(
        self,
        page_no: int = 1,
        page_size: int = 20,
        search_text: Optional[str] = None,
        user_role: Optional[str] = None,
        user_status: Optional[str] = None,
    ) -> UserListResponse:
        """
        List users with filtering and pagination

        Args:
            page_no: Number of records to skip
            page_size: Number of records to return
            search: Search term for name, email, or full_name
            role: Filter by user role
            status: Filter by user status
            is_active: Filter by active status

        Returns:
            List of User objects
        """
        try:
            # Build query
            query = select(User)

            # Apply filters
            if search_text:
                query = query.where(
                    or_(
                        User.name.ilike(f"%{search_text}%"),
                        User.email.ilike(f"%{search_text}%"),
                        User.full_name.ilike(f"%{search_text}%"),
                    )
                )

            if user_role:
                query = query.where(User.role == user_role)

            if user_status:
                query = query.where(User.status == user_status)

            # Get total count
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # Apply pagination
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset)
                .limit(page_size)
                .order_by(desc(User.created_at))
            )

            # Execute query
            result = await self.db.execute(query)
            users = result.scalars().all()

            # Calculate pagination info
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return UserListResponse(
                users=[UserResponse.model_validate(user) for user in users],
                total_items=total_items if total_items is not None else 0,
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
            )

        except Exception as e:
            logger.error("Failed to list users: %s", e)
            raise

    async def count_users(
        self,
        search_text: Optional[str] = None,
        user_role: Optional[str] = None,
        user_status: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """
        Count users with filtering

        Args:
            search: Search term for name, email, or full_name
            role: Filter by user role
            status: Filter by user status
            is_active: Filter by active status

        Returns:
            Total count of users matching criteria
        """

        query = select(count(User.id))

        # Apply same filters as list_users
        if search_text:
            search_term = f"%{search_text}%"
            query = query.where(
                or_(
                    User.name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                )
            )

        if user_role and UserRole.is_valid(user_role):
            query = query.where(User.role == user_role)

        if user_status and UserStatus.is_valid(user_status):
            query = query.where(User.status == user_status)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        result = await self.db.execute(query)
        _count = result.scalar_one_or_none()
        if _count is None:
            return 0

        return _count

    async def get_user_stats(self) -> UserStatsResponse:
        """Get user statistics"""
        try:
            # Total users
            total_result = await self.db.execute(select(count(User.id)))
            total_users = total_result.scalar()

            # Active users
            active_result = await self.db.execute(
                select(count(User.id)).where(User.status == "active")
            )
            active_users = active_result.scalar()

            # New users this month
            month_ago = datetime.utcnow() - timedelta(days=30)
            new_users_result = await self.db.execute(
                select(count(User.id)).where(User.created_at >= month_ago)
            )
            new_users_this_month = new_users_result.scalar()

            # Users by role
            role_result = await self.db.execute(
                select(User.role, count(User.id)).group_by(User.role)
            )
            users_by_role: dict[str, int] = {
                role: count for role, count in role_result.fetchall()
            }

            # Users by status
            status_result = await self.db.execute(
                select(User.status, count(User.id)).group_by(User.status)
            )
            users_by_status: dict[str, int] = {
                status: count for status, count in status_result.fetchall()
            }

            return UserStatsResponse(
                total_users=total_users if total_users is not None else 0,
                active_users=active_users if active_users is not None else 0,
                new_users_this_month=(
                    new_users_this_month
                    if new_users_this_month is not None
                    else 0
                ),
                users_by_role=users_by_role,
                users_by_status=users_by_status,
            )

        except Exception as e:
            logger.error("Failed to get user stats: %s", e)
            raise

    async def update_last_login(self, user_id: int, ip_address: str) -> bool:
        """
        Update user's last login timestamp

        Args:
            user_id: User ID
            ip_address: Client IP address
        """
        try:
            query = select(User).where(User.id == user_id)
            result = await self.db.execute(query)
            user = result.scalar_one_or_none()

            if user:
                setattr(user, "last_login", datetime.utcnow())
                setattr(user, "last_login_ip", ip_address)
                # user.last_login = datetime.utcnow()
                # user.last_login_ip = ip_address

                # Log activity
                await self._log_activity(
                    user_id=user_id, action="user_login", ip_address=ip_address
                )

                await self.db.commit()
                return True

            return False

        except Exception as e:
            logger.error(
                "Failed to update last login for user %d: %s", user_id, e
            )
            raise

    async def verify_user_credentials(
        self, username_or_email: str, password: str
    ) -> Optional[User]:
        """
        Verify user credentials and return user if valid

        Args:
            username_or_email: Username or email address
            password: Plain text password

        Returns:
            User object if credentials are valid, None otherwise
        """
        try:
            # Query user by username or email
            query = select(User).where(
                or_(
                    User.name == username_or_email,
                    User.email == username_or_email,
                )
            )

            result = await self.db.execute(query)
            user = result.scalar_one_or_none()

            if not user:
                return None

            user_is_active = getattr(user, "is_active", False)
            user_status = getattr(user, "status", "inactive")

            if not user_is_active:
                return None

            if user_status != "active":
                return None

            if not verify_password(password, user.password_hash):
                return None

            return user

        except Exception as e:
            logger.error("Failed to verify credentials: %s", e)
            raise

    async def _log_activity(
        self,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
    ):
        """Log user activity"""
        try:
            activity_log = UserActivityLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details,
                ip_address=ip_address,
                timestamp=datetime.utcnow(),
            )

            self.db.add(activity_log)
            await self.db.flush()

        except (ValueError, TypeError) as e:
            logger.error("Failed to log activity: %s", e)

    async def get_user_activity_logs(
        self, user_id: int, page_no: int = 0, page_size: int = 50
    ) -> List[UserActivityLog]:
        """
        Get user activity logs

        Args:
            user_id: User ID
            page_no: Number of records to skip
            page_size: Number of records to return

        Returns:
            List of UserActivityLog objects
        """
        query = (
            select(UserActivityLog)
            .where(UserActivityLog.user_id == user_id)
            .order_by(UserActivityLog.created_at.desc())
            .offset(page_no)
            .limit(page_size)
        )

        result = await self.db.execute(query)
        return list(result.scalars().all())


async def get_user_service(db: Optional[AsyncSession] = None) -> UserService:
    """Get user service instance"""
    if db is None:
        async for session in get_async_session():
            return UserService(session)
    return UserService(cast(AsyncSession, db))
