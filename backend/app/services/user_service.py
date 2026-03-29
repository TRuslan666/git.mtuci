from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_users_by_role(session: AsyncSession, role: UserRole) -> list[User]:
    result = await session.execute(select(User).where(User.role == role).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def register_user(session: AsyncSession, *, email: str, password: str, full_name: str) -> User:
    existing = await get_user_by_email(session, email)
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.student,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_all_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def update_user_role_and_block(
    session: AsyncSession,
    *,
    user_id,
    role: UserRole,
    is_blocked: bool,
    group_name: str | None = None,
    student_id: str | None = None,
) -> User:
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError("User not found")

    user.role = role
    user.is_blocked = is_blocked
    if group_name is not None:
        user.group_name = group_name
    if student_id is not None:
        user.student_id = student_id
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def delete_user_by_id(session: AsyncSession, user_id) -> None:
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError("User not found")

    await session.delete(user)
    await session.commit()


async def reset_user_password(session: AsyncSession, *, user_id, new_password: str) -> None:
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError("User not found")

    user.password_hash = hash_password(new_password)
    session.add(user)
    await session.commit()

