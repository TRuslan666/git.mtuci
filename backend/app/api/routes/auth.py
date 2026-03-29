from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import create_access_token, get_current_user, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import (
    AuthLoginRequest,
    AuthRegisterRequest,
    StudentRegisterRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.password_reset_service import request_password_reset, reset_password_by_token
from app.services.mtuci_service import fetch_student_info, MTUCIAuthError, MTUCIServiceError
from app.services.user_service import get_next_student_id

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: AuthRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    # Проверяем уникальность email.
    existing = await session.execute(select(User).where(User.email == str(payload.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Хешируем пароль через bcrypt (пароль не храним в открытом виде).
    password_hash = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Генерируем student_id автоматически
    student_id = await get_next_student_id(session)

    user = User(
        email=str(payload.email),
        password_hash=password_hash,
        full_name=payload.full_name,
        role=UserRole.student,
        student_id=student_id,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserRead.model_validate(user)


@router.post(
    "/register-student-mtuci",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_student_mtuci(
    payload: StudentRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Student registration with optional MTUCI LK auto-fill.
    If mtuci_login and mtuci_password provided, will auto-fetch name and group.
    """
    # Check email uniqueness
    existing = await session.execute(select(User).where(User.email == str(payload.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Try to fetch from MTUCI LK if credentials provided
    mtuci_info = None
    if payload.mtuci_login and payload.mtuci_password:
        try:
            mtuci_info = await fetch_student_info(payload.mtuci_login, payload.mtuci_password)
        except MTUCIAuthError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MTUCI LK credentials",
            )
        except MTUCIServiceError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"MTUCI LK service error: {e}",
            )

    # Use MTUCI data or fallback to payload
    full_name = mtuci_info["name"] if mtuci_info else payload.full_name
    group_name = mtuci_info["group"] if mtuci_info else None

    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required when not using MTUCI LK auto-fill",
        )

    password_hash = bcrypt.hashpw(
        payload.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    # Генерируем student_id автоматически
    student_id = await get_next_student_id(session)

    user = User(
        email=str(payload.email),
        password_hash=password_hash,
        full_name=full_name,
        role=UserRole.student,
        group_name=group_name,
        student_id=student_id,
        mtuci_login=payload.mtuci_login if mtuci_info else None,
        mtuci_password=payload.mtuci_password if mtuci_info else None,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserRead.model_validate(user)


@router.post(
    "/register-teacher",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_teacher(
    payload: AuthRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    # Только для разработки и тестирования: без проверки прав.
    existing = await session.execute(select(User).where(User.email == str(payload.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    password_hash = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        email=str(payload.email),
        password_hash=password_hash,
        full_name=payload.full_name,
        role=UserRole.teacher,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: AuthLoginRequest,
    session: AsyncSession = Depends(get_session),
):
    user = await session.execute(select(User).where(User.email == str(payload.email)))
    user_obj = user.scalar_one_or_none()
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    is_password_valid = verify_password(payload.password, user_obj.password_hash)
    if not is_password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if getattr(user_obj, "is_blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is blocked",
        )

    # JWT будет содержать `sub` = id пользователя (это используется в `/auth/me`)
    access_token = create_access_token(str(user_obj.id))
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserRead)
async def me(current_user=Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    await request_password_reset(session, email=str(payload.email))
    return ForgotPasswordResponse(message="If the email exists, reset instructions were sent.")


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    payload: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    ok = await reset_password_by_token(
        session,
        token=payload.token,
        new_password=payload.new_password,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )

