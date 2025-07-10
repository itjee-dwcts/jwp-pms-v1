"""
사용자 서비스

사용자 관리 작업을 위한 비즈니스 로직
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, cast

from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import count

from constants.user import UserRole, UserStatus
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
    """사용자 관리 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(
        self, user_data: UserCreateRequest, created_by: Optional[int] = None
    ) -> User:
        """
        새 사용자 생성

        Args:
            user_data: 사용자 생성 데이터
            created_by: 이 사용자를 생성하는 사용자의 ID

        Returns:
            생성된 User 객체

        Raises:
            ValueError: 이메일 또는 사용자명이 이미 존재하는 경우
        """
        try:
            # 사용자명 또는 이메일이 이미 존재하는지 확인
            existing_user = await self.get_user_by_email_or_username(
                user_data.email, user_data.username
            )

            if existing_user:
                existing_user_email = getattr(existing_user, "email", None)
                if existing_user_email is not None:
                    if existing_user_email == user_data.email:
                        raise ConflictError("이메일이 이미 존재합니다")

                existing_user_name = getattr(existing_user, "name", None)
                if existing_user_name is not None:
                    if existing_user_name == user_data.username:
                        raise ConflictError("사용자명이 이미 존재합니다")

            # 비밀번호 해시화
            hashed_password = get_password_hash(user_data.password)

            # 사용자 생성
            user = User(
                username=user_data.username,
                email=user_data.email,
                full_name=user_data.full_name,
                password_hash=hashed_password,
                role=user_data.role or UserRole.DEVELOPER,
                status=user_data.status or UserStatus.ACTIVE,
                created_at=datetime.now(timezone.utc),
                created_by=created_by,
            )

            self.db.add(user)
            await self.db.flush()

            user_id = getattr(user, "id", None)
            if user_id is not None:
                # 활동 로그 생성
                await self._log_activity(
                    user_id=user_id,
                    action="user_created",
                    details={"username": user.username, "email": user.email},
                )

            await self.db.commit()
            await self.db.refresh(user)

            logger.info("사용자가 성공적으로 생성되었습니다: %s", user.name)
            return user

        except Exception as e:
            await self.db.rollback()
            logger.error("사용자 생성에 실패했습니다: %s", e)
            raise

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        ID로 사용자 조회

        Args:
            user_id: 사용자 ID

        Returns:
            사용자 객체 (찾은 경우), 없으면 None
        """
        try:
            query = select(User).where(User.id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("ID %d로 사용자 조회에 실패했습니다: %s", user_id, e)
            raise

    async def get_user_by_ids(self, user_ids: List[int]) -> List[User]:
        """
        여러 사용자 ID로 사용자들 조회

        Args:
            user_ids: 사용자 ID 목록

        Returns:
            User 객체 목록
        """
        try:
            if not user_ids:
                return []

            query = select(User).where(User.id.in_(user_ids))
            result = await self.db.execute(query)
            return list(result.scalars().all())

        except Exception as e:
            logger.error("여러 ID로 사용자 조회에 실패했습니다: %s", e)
            raise

    async def get_user_by_name(self, username: str) -> Optional[User]:
        """
        사용자명으로 사용자 조회

        Args:
            username: 사용자명

        Returns:
            사용자 객체 (찾은 경우), 없으면 None
        """
        try:
            query = select(User).where(User.username == username)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("사용자명 %s로 사용자 조회에 실패했습니다: %s", username, e)
            raise

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        이메일 주소로 사용자 조회

        Args:
            email: 사용자 이메일 주소

        Returns:
            사용자 객체 (찾은 경우), 없으면 None
        """
        try:
            query = select(User).where(User.email == email)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()

        except Exception as e:
            logger.error("이메일 %s로 사용자 조회에 실패했습니다: %s", email, e)
            raise

    async def get_user_by_email_or_username(
        self, email: str, username: str
    ) -> Optional[User]:
        """
        이메일 또는 사용자명으로 사용자 조회

        Args:
            email: 사용자 이메일 주소
            username: 사용자명

        Returns:
            사용자 객체 (찾은 경우), 없으면 None
        """
        query = select(User).where(or_(User.email == email, User.username == username))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_user(
        self, user_id: int, user_data: UserUpdateRequest, updated_by: int
    ) -> Optional[User]:
        """
        사용자 정보 업데이트

        Args:
            user_id: 업데이트할 사용자의 ID
            user_data: 업데이트 데이터
            updated_by: 업데이트를 수행하는 사용자의 ID

        Returns:
            업데이트된 User 객체 (찾은 경우), 없으면 None
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None

            # 필드 업데이트
            update_data = user_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(user, field, value)

            user.updated_by = updated_by
            user.updated_at = datetime.now(timezone.utc)

            # 활동 로그
            await self._log_activity(
                user_id=updated_by,
                action="user_updated",
                resource_type="user",
                resource_id=user_id,
                details={"updated_fields": list(update_data.keys())},
            )

            await self.db.commit()
            await self.db.refresh(user)

            logger.info("사용자가 성공적으로 업데이트되었습니다: %s", user.username)
            return user

        except Exception as e:
            await self.db.rollback()
            logger.error("사용자 %d 업데이트에 실패했습니다: %s", user_id, e)
            raise

    async def change_password(
        self, user_id: int, password_data: UserPasswordChangeRequest
    ) -> bool:
        """사용자 비밀번호 변경"""
        try:
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 현재 비밀번호 확인
            if not verify_password(password_data.current_password, user.password_hash):
                raise AuthenticationError("현재 비밀번호가 올바르지 않습니다")

            # 비밀번호 업데이트
            user.password = get_password_hash(password_data.new_password)
            user.password_changed_at = datetime.now(timezone.utc)
            user.updated_at = datetime.now(timezone.utc)
            user.updated_by = user_id

            # 활동 로그
            await self._log_activity(
                user_id=user_id,
                action="password_changed",
                details={"user_id": user_id},
            )

            await self.db.commit()

            logger.info("사용자 비밀번호가 변경되었습니다: %s", user.username)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("사용자 %d 비밀번호 변경에 실패했습니다: %s", user_id, e)
            raise

    async def update_user_password(
        self, user_id: int, new_password: str, updated_by: int
    ) -> bool:
        """
        사용자 비밀번호 업데이트

        Args:
            user_id: 업데이트할 사용자의 ID
            new_password: 새 평문 비밀번호
            updated_by: 업데이트를 수행하는 사용자의 ID

        Returns:
            성공 시 True, 사용자를 찾지 못한 경우 False
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        # 새 비밀번호 해시화
        user.password = get_password_hash(new_password)
        user.password_changed_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        user.updated_by = updated_by

        # 활동 로그 생성
        activity_log = UserActivityLog(
            user_id=user.id,
            action="update",
            resource_type="user",
            resource_id=str(user.id),
            description=f"{updated_by}에 의해 비밀번호가 업데이트되었습니다",
            created_at=datetime.utcnow(),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def deactivate_user(self, user_id: int, deactivated_by: int) -> bool:
        """
        사용자 비활성화 (소프트 삭제)

        Args:
            user_id: 비활성화할 사용자의 ID
            deactivated_by: 비활성화를 수행하는 사용자의 ID

        Returns:
            성공 시 True, 사용자를 찾지 못한 경우 False
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        user.status = UserStatus.INACTIVE
        user.updated_at = datetime.now(timezone.utc)
        user.updated_by = deactivated_by

        # 활동 로그 생성
        activity_log = UserActivityLog(
            user_id=user.id,
            action="deactivate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"{deactivated_by}에 의해 사용자가 비활성화되었습니다",
            created_at=datetime.now(timezone.utc),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def activate_user(self, user_id: int, activated_by: int) -> bool:
        """
        사용자 활성화

        Args:
            user_id: 활성화할 사용자의 ID
            activated_by: 활성화를 수행하는 사용자의 ID

        Returns:
            성공 시 True, 사용자를 찾지 못한 경우 False
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        user.is_active = True
        user.status = UserStatus.ACTIVE
        user.updated_at = datetime.now(timezone.utc)
        user.updated_by = activated_by

        # 활동 로그 생성
        activity_log = UserActivityLog(
            user_id=user.id,
            action="activate",
            resource_type="user",
            resource_id=str(user.id),
            description=f"{activated_by}에 의해 사용자가 활성화되었습니다",
            created_at=datetime.now(timezone.utc),
        )

        self.db.add(activity_log)
        await self.db.commit()

        return True

    async def delete_user(self, user_id: int, deleted_by: int) -> bool:
        """
        사용자 영구 삭제 (하드 삭제)

        Args:
            user_id: 삭제할 사용자의 ID
            deleted_by: 삭제를 수행하는 사용자의 ID

        Returns:
            성공 시 True, 사용자를 찾지 못한 경우 False

        Note:
            이것은 하드 삭제입니다. 소프트 삭제 기능을 위해서는
            deactivate_user 사용을 고려해보세요.
        """
        try:
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if not user:
                raise NotFoundError(f"ID {user_id}인 사용자를 찾을 수 없습니다")

            # 상태 변경으로 소프트 삭제
            user.is_active = False
            user.status = UserStatus.INACTIVE
            user.updated_by = deleted_by
            user.updated_at = datetime.now(timezone.utc)

            # 활동 로그
            await self._log_activity(
                user_id=deleted_by,
                action="user_deleted",
                resource_type="user",
                resource_id=user_id,
                details={"username": user.username},
            )

            await self.db.commit()

            logger.info("사용자가 소프트 삭제되었습니다: %s", user.username)
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error("사용자 %d 삭제에 실패했습니다: %s", user_id, e)
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
        필터링과 페이지네이션을 포함한 사용자 목록 조회

        Args:
            page_no: 건너뛸 레코드 수
            page_size: 반환할 레코드 수
            search_text: 이름, 이메일, 또는 전체 이름 검색어
            user_role: 사용자 역할로 필터링
            user_status: 사용자 상태로 필터링

        Returns:
            User 객체 목록
        """
        try:
            # 쿼리 구성
            query = select(User)

            # 필터 적용
            if search_text:
                query = query.where(
                    or_(
                        User.username.ilike(f"%{search_text}%"),
                        User.email.ilike(f"%{search_text}%"),
                        User.full_name.ilike(f"%{search_text}%"),
                    )
                )

            if user_role:
                query = query.where(User.role == user_role)

            if user_status:
                query = query.where(User.status == user_status)

            # 총 개수 조회
            count_query = select(count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total_items = total_result.scalar()

            # 페이지네이션 적용
            offset = (page_no - 1) * page_size
            query = (
                query.offset(offset).limit(page_size).order_by(desc(User.created_at))
            )

            # 쿼리 실행
            result = await self.db.execute(query)
            users = result.scalars().all()

            # 페이지네이션 정보 계산
            total_pages = (
                (total_items if total_items is not None else 0) + page_size - 1
            ) // page_size

            return UserListResponse(
                users=[UserResponse.model_validate(user) for user in users],
                page_no=page_no,
                page_size=page_size,
                total_pages=total_pages,
                total_items=total_items if total_items is not None else 0,
            )

        except Exception as e:
            logger.error("사용자 목록 조회에 실패했습니다: %s", e)
            raise

    async def count_users(
        self,
        search_text: Optional[str] = None,
        user_role: Optional[str] = None,
        user_status: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """
        필터링과 함께 사용자 수 카운트

        Args:
            search_text: 이름, 이메일, 또는 전체 이름 검색어
            user_role: 사용자 역할로 필터링
            user_status: 사용자 상태로 필터링
            is_active: 활성 상태로 필터링

        Returns:
            조건에 맞는 사용자의 총 개수
        """

        query = select(count(User.id))

        # list_users와 동일한 필터 적용
        if search_text:
            search_term = f"%{search_text}%"
            query = query.where(
                or_(
                    User.username.ilike(search_term),
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
        """사용자 통계 조회"""
        try:
            # 전체 사용자
            total_result = await self.db.execute(select(count(User.id)))
            total_users = total_result.scalar()

            # 활성 사용자
            active_result = await self.db.execute(
                select(count(User.id)).where(User.status == "active")
            )
            active_users = active_result.scalar()

            # 이번 달 신규 사용자
            month_ago = datetime.now(timezone.utc) - timedelta(days=30)
            new_users_result = await self.db.execute(
                select(count(User.id)).where(User.created_at >= month_ago)
            )
            new_users_this_month = new_users_result.scalar()

            # 역할별 사용자
            role_result = await self.db.execute(
                select(User.role, count(User.id)).group_by(User.role)
            )
            users_by_role: dict[str, int] = {
                row[0]: row[1] for row in role_result.fetchall()
            }

            # 상태별 사용자
            status_result = await self.db.execute(
                select(User.status, count(User.id)).group_by(User.status)
            )
            users_by_status: dict[str, int] = {
                str(row[0]): int(row[1]) for row in status_result.fetchall()
            }

            return UserStatsResponse(
                total_users=total_users if total_users is not None else 0,
                active_users=active_users if active_users is not None else 0,
                new_users_this_month=(
                    new_users_this_month if new_users_this_month is not None else 0
                ),
                users_by_role=users_by_role,
                users_by_status=users_by_status,
            )

        except Exception as e:
            logger.error("사용자 통계 조회에 실패했습니다: %s", e)
            raise

    async def update_last_login(self, user_id: int, ip_address: str) -> bool:
        """
        사용자의 마지막 로그인 타임스탬프 업데이트

        Args:
            user_id: 사용자 ID
            ip_address: 클라이언트 IP 주소
        """
        try:
            query = select(User).where(User.id == user_id)
            result = await self.db.execute(query)
            user = result.scalar_one_or_none()

            if user:
                user.last_login = datetime.now(timezone.utc)
                user.last_login_ip = ip_address

                # 활동 로그
                await self._log_activity(
                    user_id=user_id, action="user_login", ip_address=ip_address
                )

                await self.db.commit()
                return True

            return False

        except Exception as e:
            logger.error(
                "사용자 %d의 마지막 로그인 업데이트에 실패했습니다: %s", user_id, e
            )
            raise

    async def verify_user_credentials(
        self, username_or_email: str, password: str
    ) -> Optional[User]:
        """
        사용자 자격증명을 확인하고 유효한 경우 사용자 반환

        Args:
            username_or_email: 사용자명 또는 이메일 주소
            password: 평문 비밀번호

        Returns:
            자격증명이 유효한 경우 User 객체, 그렇지 않으면 None
        """
        try:
            # 사용자명 또는 이메일로 사용자 조회
            query = select(User).where(
                or_(
                    User.username == username_or_email,
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
            logger.error("자격증명 확인에 실패했습니다: %s", e)
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
        """사용자 활동 로그"""
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
            logger.error("활동 로그 기록에 실패했습니다: %s", e)

    async def get_user_activity_logs(
        self, user_id: int, page_no: int = 0, page_size: int = 50
    ) -> List[UserActivityLog]:
        """
        사용자 활동 로그 조회

        Args:
            user_id: 사용자 ID
            page_no: 건너뛸 레코드 수
            page_size: 반환할 레코드 수

        Returns:
            UserActivityLog 객체 목록
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
    """사용자 서비스 인스턴스 조회"""
    if db is None:
        async for session in get_async_session():
            return UserService(session)
    return UserService(cast(AsyncSession, db))
