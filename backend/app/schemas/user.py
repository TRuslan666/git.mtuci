from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: UserRole
    group_name: str | None = None
    student_id: str | None = None
    avatar_url: str | None = None
    avatar_display_mode: str = "cover"
    created_at: datetime


class StudentUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    created_at: datetime


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: UserRole
    group_name: str | None = None
    student_id: str | None = None
    is_blocked: bool
    created_at: datetime


class AdminUpdateUserRequest(BaseModel):
    role: UserRole
    is_blocked: bool
    group_name: str | None = None
    student_id: str | None = None


class AdminResetPasswordRequest(BaseModel):
    # Если не передан - сгенерируем на сервере.
    new_password: str | None = None


class AdminResetPasswordResponse(BaseModel):
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UpdateAvatarDisplayModeRequest(BaseModel):
    avatar_display_mode: str = Field(pattern="^(cover|contain|fill|scale-down)$")

