"""
파일 모델

파일 업로드 및 관리를 위한 데이터베이스 모델
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class File(Base):
    """
    파일 기본 모델

    모든 업로드된 파일의 메타데이터를 저장하는 기본 테이블
    """

    __tablename__ = "files"

    id = Column(UUID, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 수정한 사용자",
    )

    file_name = Column(String(255), nullable=False, comment="원본 파일명")
    file_path = Column(Text, nullable=False, unique=True, comment="서버상의 파일 경로")
    file_size = Column(BigInteger, nullable=False, comment="파일 크기 (bytes)")
    mime_type = Column(String(100), nullable=True, comment="MIME 타입")

    # 업로드 정보
    uploaded_by = Column(
        UUID, ForeignKey("users.id"), nullable=False, comment="업로드한 사용자 ID"
    )
    uploaded_at = Column(
        DateTime, default=datetime.utcnow, nullable=False, comment="업로드 시간"
    )

    # 파일 상태
    is_active = Column(Boolean, default=True, nullable=False, comment="파일 활성 상태")
    is_deleted = Column(Boolean, default=False, nullable=False, comment="삭제 여부")
    deleted_at = Column(DateTime, nullable=True, comment="삭제 시간")

    # 메타데이터
    description = Column(Text, nullable=True, comment="파일 설명")
    tags = Column(Text, nullable=True, comment="파일 태그 (JSON)")

    # 접근 제어
    is_public = Column(Boolean, default=False, nullable=False, comment="공개 파일 여부")
    access_level = Column(
        String(20), default="private", nullable=False, comment="접근 수준"
    )

    # 추가 정보
    checksum = Column(String(64), nullable=True, comment="파일 체크섬 (SHA-256)")
    version = Column(Integer, default=1, nullable=False, comment="파일 버전")
    parent_file_id = Column(
        Integer,
        ForeignKey("files.id"),
        nullable=True,
        comment="부모 파일 ID (버전 관리)",
    )

    # 관계 설정
    uploader = relationship("User", back_populates="uploaded_files")
    parent_file = relationship("File", remote_side=[id], back_populates="child_files")
    child_files = relationship("File", back_populates="parent_file")

    # 첨부 파일 관계
    project_attachments = relationship("ProjectAttachment", back_populates="file")
    task_attachments = relationship("TaskAttachment", back_populates="file")

    def __repr__(self):
        return f"<File(id={self.id}, name='{self.file_name}', size={self.file_size})>"

    @property
    def size_mb(self) -> Optional[float]:
        """파일 크기를 MB로 반환"""

        try:
            if self.file_size is not None and isinstance(self.file_size, (int, float)):
                return round(float(self.file_size) / (1024 * 1024), 2)
        except (TypeError, ValueError):
            pass
        return None

    @property
    def extension(self) -> Optional[str]:
        """파일 확장자 반환"""
        if "." in self.file_name:
            return self.file_name.split(".")[-1].lower()
        return None

    @property
    def is_image(self) -> bool:
        """이미지 파일 여부"""
        if self.mime_type is not None:
            return bool(self.mime_type.startswith("image/"))
        return False

    @property
    def is_document(self) -> bool:
        """문서 파일 여부"""
        if self.mime_type is not None:
            document_types = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain",
                "text/csv",
            ]
            return self.mime_type in document_types
        return False


class FileVersion(Base):
    """
    파일 버전 히스토리

    파일의 버전 변경 기록을 저장
    """

    __tablename__ = "file_versions"

    id = Column(UUID, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 수정한 사용자",
    )

    file_id = Column(
        Integer, ForeignKey("files.id"), nullable=False, comment="원본 파일 ID"
    )
    version_number = Column(Integer, nullable=False, comment="버전 번호")
    file_path = Column(Text, nullable=False, comment="버전 파일 경로")
    file_size = Column(BigInteger, nullable=False, comment="파일 크기")
    checksum = Column(String(64), nullable=True, comment="파일 체크섬")

    # 버전 메타데이터
    change_description = Column(Text, nullable=True, comment="변경 내용 설명")

    # 관계 설정
    file = relationship("File", back_populates="versions")
    creator = relationship("User")

    def __repr__(self):
        return f"<FileVersion(file_id={self.file_id}, version={self.version_number})>"


class FileDownloadLog(Base):
    """
    파일 다운로드 로그

    파일 다운로드 기록을 추적
    """

    __tablename__ = "file_download_logs"

    id = Column(UUID, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 수정한 사용자",
    )

    file_id = Column(Integer, ForeignKey("files.id"), nullable=False, comment="파일 ID")
    user_id = Column(
        UUID, ForeignKey("users.id"), nullable=False, comment="다운로드한 사용자 ID"
    )

    # 다운로드 정보
    downloaded_at = Column(
        DateTime, default=datetime.utcnow, nullable=False, comment="다운로드 시간"
    )
    ip_address = Column(String(45), nullable=True, comment="IP 주소")
    user_agent = Column(Text, nullable=True, comment="사용자 에이전트")

    # 성공 여부
    success = Column(
        Boolean, default=True, nullable=False, comment="다운로드 성공 여부"
    )
    error_message = Column(Text, nullable=True, comment="오류 메시지")

    # 관계 설정
    file = relationship("File")
    user = relationship("User")

    def __repr__(self):
        return f"<FileDownloadLog(file_id={self.file_id}, user_id={self.user_id}, success={self.success})>"


class FileShare(Base):
    """
    파일 공유

    파일 공유 링크 및 권한 관리
    """

    __tablename__ = "file_shares"

    id = Column(UUID, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        doc="생성 시간",
    )
    created_by = Column(
        UUID, ForeignKey("users.id"), nullable=True, doc="생성한 사용자"
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=datetime.now(timezone.utc),
        nullable=True,
        doc="마지막 수정 시간",
    )
    updated_by = Column(
        UUID,
        ForeignKey("users.id"),
        nullable=True,
        doc="마지막으로 수정한 사용자",
    )

    file_id = Column(
        UUID, ForeignKey("files.id"), nullable=False, comment="공유할 파일 ID"
    )
    share_token = Column(String(64), unique=True, nullable=False, comment="공유 토큰")

    # 공유 설정
    expires_at = Column(DateTime, nullable=True, comment="만료 시간")
    max_downloads = Column(Integer, nullable=True, comment="최대 다운로드 횟수")
    download_count = Column(
        Integer, default=0, nullable=False, comment="현재 다운로드 횟수"
    )

    # 접근 제어
    password = Column(String(255), nullable=True, comment="공유 비밀번호 (해시)")
    allowed_ips = Column(Text, nullable=True, comment="허용된 IP 주소 목록 (JSON)")

    # 상태
    is_active = Column(Boolean, default=True, nullable=False, comment="공유 활성 상태")

    # 시간 추적
    last_accessed_at = Column(DateTime, nullable=True, comment="마지막 접근 시간")

    # 관계 설정
    file = relationship("File")
    creator = relationship("User")

    def __repr__(self):
        return f"<FileShare(file_id={self.file_id}, token='{self.share_token[:8]}...', active={self.is_active})>"

    @property
    def is_expired(self) -> bool:
        """공유 링크 만료 여부"""
        if self.expires_at is not None:
            return bool(datetime.now(timezone.utc) > self.expires_at)
        return False

    @property
    def is_download_limit_reached(self) -> bool:
        """다운로드 한도 도달 여부"""
        if self.max_downloads is not None:
            # For instance-level access, cast to bool; for query context, return SQL expression
            if isinstance(self.download_count, int) and isinstance(
                self.max_downloads, int
            ):
                return bool(self.download_count >= self.max_downloads)
            return bool(self.download_count >= self.max_downloads)
        return False

    @property
    def can_download(self) -> bool:
        """다운로드 가능 여부"""
        return (
            bool(self.is_active)
            and not self.is_expired
            and not self.is_download_limit_reached
        )


# File 모델에 versions 관계 추가
File.versions = relationship(
    "FileVersion", back_populates="file", order_by="FileVersion.version_number.desc()"
)
