"""
Faculty model
"""
from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    short_name: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)  # e.g., "ИТ", "КИБ"


# Predefined faculties
PREDEFINED_FACULTIES = [
    {"name": "Радио и телевидение", "short_name": "РТ"},
    {"name": "Информационные технологии", "short_name": "ИТ"},
    {"name": "Кибернетика и информационная безопасность", "short_name": "КИБ"},
    {"name": "Системная инженерия", "short_name": "СИ"},
    {"name": "Цифровая экономика и массовые коммуникации", "short_name": "ЦЭМК"},
]
