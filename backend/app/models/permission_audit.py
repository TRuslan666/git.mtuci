"""
Permission audit log model
"""
from __future__ import annotations

from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PermissionAudit(Base):
    """Audit log for permission changes."""
    __tablename__ = "permission_audit"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Who made the change
    actor_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="User who changed the permission"
    )
    actor_role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Role of actor at time of change"
    )
    
    # What changed
    target_role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Role whose permissions were changed"
    )
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Action: 'grant', 'revoke', 'reset', 'save_batch'"
    )
    permission_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Specific permission ID (null for batch operations)"
    )
    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="JSON with before/after state or additional info"
    )
    
    # When
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<PermissionAudit {self.actor_role} {self.action} {self.target_role}>"
