from __future__ import annotations

import secrets
import string
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import (
    AdminResetPasswordRequest,
    AdminResetPasswordResponse,
    AdminUpdateUserRequest,
    AdminUserRead,
)
from app.services.user_service import (
    delete_user_by_id,
    get_all_users,
    reset_user_password,
    update_user_role_and_block,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(current_user: User) -> None:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/users", response_model=list[AdminUserRead])
async def admin_get_users(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AdminUserRead]:
    _require_admin(current_user)
    users = await get_all_users(session)
    return [AdminUserRead.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=AdminUserRead)
async def admin_patch_user(
    user_id: UUID,
    payload: AdminUpdateUserRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    _require_admin(current_user)
    user = await update_user_role_and_block(
        session,
        user_id=user_id,
        role=payload.role,
        is_blocked=payload.is_blocked,
        group_name=payload.group_name,
        student_id=payload.student_id,
    )
    return AdminUserRead.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_admin(current_user)
    try:
        await delete_user_by_id(session, user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Важно: явно возвращаем Response, чтобы FastAPI не пытался сериализовать body.
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def admin_reset_password(
    user_id: UUID,
    payload: AdminResetPasswordRequest | None = Body(None),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminResetPasswordResponse:
    _require_admin(current_user)

    if payload and payload.new_password:
        new_password = payload.new_password
    else:
        new_password = _generate_password()

    await reset_user_password(session, user_id=user_id, new_password=new_password)
    return AdminResetPasswordResponse(new_password=new_password)

