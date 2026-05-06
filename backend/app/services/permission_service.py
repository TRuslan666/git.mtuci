"""
Permission service with audit logging and caching
"""
from __future__ import annotations

import json
import time
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.role_permissions import RolePermission
from app.models.permission_audit import PermissionAudit
from app.core.permissions import DEFAULT_PERMISSIONS


# Simple in-memory cache: {user_id: (permissions_set, timestamp)}
_perms_cache: dict[UUID, tuple[set[str], float]] = {}
CACHE_TTL_SECONDS = 60  # Cache permissions for 1 minute


async def get_user_permissions_cached(
    user: User,
    session: AsyncSession,
) -> set[str]:
    """Get user permissions with caching."""
    now = time.time()
    
    # Check cache
    if user.id in _perms_cache:
        perms, timestamp = _perms_cache[user.id]
        if now - timestamp < CACHE_TTL_SECONDS:
            return perms
    
    # Fetch from DB
    result = await session.execute(
        select(RolePermission)
        .where(RolePermission.role == user.role)
    )
    custom_perms = result.scalars().all()
    
    if custom_perms:
        perms = {p.permission_id for p in custom_perms if p.enabled}
    else:
        perms = DEFAULT_PERMISSIONS.get(user.role, set()).copy()
    
    # Update cache
    _perms_cache[user.id] = (perms, now)
    return perms


def invalidate_user_cache(user_id: UUID) -> None:
    """Invalidate cache for specific user."""
    _perms_cache.pop(user_id, None)


def invalidate_role_cache(role: UserRole) -> None:
    """Invalidate cache for all users with this role."""
    # We can't know which users have this role without DB query,
    # so we clear entire cache to be safe
    _perms_cache.clear()


async def log_permission_change(
    session: AsyncSession,
    actor: User,
    target_role: UserRole,
    action: str,  # 'grant', 'revoke', 'reset', 'save_batch'
    permission_id: Optional[str] = None,
    details: Optional[dict] = None,
) -> None:
    """Log a permission change to audit table."""
    audit = PermissionAudit(
        actor_id=actor.id,
        actor_role=actor.role.value,
        target_role=target_role.value,
        action=action,
        permission_id=permission_id,
        details=json.dumps(details) if details else None,
        created_at=datetime.now(timezone.utc),
    )
    session.add(audit)


async def get_audit_logs(
    session: AsyncSession,
    target_role: Optional[UserRole] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[PermissionAudit]:
    """Get permission audit logs."""
    query = select(PermissionAudit).order_by(PermissionAudit.created_at.desc())
    
    if target_role:
        query = query.where(PermissionAudit.target_role == target_role.value)
    
    query = query.limit(limit).offset(offset)
    result = await session.execute(query)
    return list(result.scalars().all())
