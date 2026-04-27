"""
Role permissions and trusted assistants models
"""
from __future__ import annotations

from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.user import UserRole


class RolePermission(Base):
    """Custom permissions for roles (overrides defaults)."""
    __tablename__ = "role_permissions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    role: Mapped[UserRole] = mapped_column(
        String(50),
        nullable=False,
        comment="Role identifier (admin, teacher, laborant, student)"
    )
    permission_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Permission identifier (e.g., 'repo_create', 'user_edit')"
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this permission is enabled for the role"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("role", "permission_id", name="uq_role_permission"),
    )


class TrustedAssistant(Base):
    """Trusted assistants for teachers - can grade courses on behalf of teacher."""
    __tablename__ = "trusted_assistants"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    teacher_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="Teacher who trusts this assistant"
    )
    assistant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="Laborant who is trusted by teacher"
    )
    can_grade: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Can this assistant grade assignments"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("teacher_id", "assistant_id", name="uq_teacher_assistant"),
    )
