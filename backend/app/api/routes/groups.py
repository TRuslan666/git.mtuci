"""
Groups API routes
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.core.permissions import require_permission
from app.models.user import User, UserRole

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[str])
@require_permission("user_view")
async def get_groups(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[str]:
    """Get all unique group names from students."""
    result = await session.execute(
        select(func.distinct(User.group_name))
        .where(User.group_name.is_not(None))
        .where(User.role == UserRole.student)
    )
    groups = [row[0] for row in result.all() if row[0]]
    return sorted(groups)
