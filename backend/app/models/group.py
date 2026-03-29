"""
Group model - belongs to Faculty
"""
from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "ИУС-101", "БВТ2403"
    faculty_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("faculties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
