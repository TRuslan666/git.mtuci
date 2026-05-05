from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Enum as SAEnum

from app.models.base import Base


class LogLevel(str, Enum):
    """Log levels for system events."""
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"
    DEBUG = "DEBUG"


class LogSource(str, Enum):
    """Sources of log events."""
    auth = "auth"
    repositories = "repositories"
    webhooks = "webhooks"
    admin = "admin"
    gitea = "gitea"
    permissions = "permissions"
    courses = "courses"


class SystemLog(Base):
    """
    System log for backend events, errors, and audit trails.
    Used for monitoring, debugging, and security auditing.
    """
    __tablename__ = "system_logs"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    level: Mapped[LogLevel] = mapped_column(
        SAEnum(LogLevel, native_enum=False), 
        nullable=False,
        index=True
    )
    source: Mapped[LogSource] = mapped_column(
        SAEnum(LogSource, native_enum=False), 
        nullable=False,
        index=True
    )
    
    # User information (nullable for system events without user context)
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Log message and details
    message: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)  # Stack trace, additional context
    
    # Request information
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # For request tracing

    # Composite index for common query patterns
    __table_args__ = (
        Index("ix_system_logs_created_at_level_source", "created_at", "level", "source"),
    )

    def __repr__(self) -> str:
        return f"<SystemLog id={self.id} level={self.level} source={self.source} message={self.message[:50]}>"
