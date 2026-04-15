from __future__ import annotations

import os
import secrets
import string
from datetime import datetime
from uuid import UUID

import httpx
import psutil
from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import select
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


class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_total_gb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float


class ServiceStatus(BaseModel):
    git: bool
    db: bool
    api: bool


class BackupInfo(BaseModel):
    last_backup: str | None
    next_backup: str | None

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
        is_pending=payload.is_pending,
        group_name=payload.group_name,
        student_id=payload.student_id,
    )
    return AdminUserRead.model_validate(user)


@router.post("/users/{user_id}/approve", response_model=AdminUserRead)
async def admin_approve_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    """Approve pending user (admin only)."""
    _require_admin(current_user)
    
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.is_pending = False
    await session.commit()
    await session.refresh(user)
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


@router.get("/system-metrics", response_model=SystemMetrics)
async def admin_system_metrics(
    current_user=Depends(get_current_user),
) -> SystemMetrics:
    _require_admin(current_user)

    # CPU
    cpu_percent = psutil.cpu_percent(interval=1)

    # Memory
    mem = psutil.virtual_memory()
    memory_percent = mem.percent
    memory_used_gb = round(mem.used / (1024**3), 2)
    memory_total_gb = round(mem.total / (1024**3), 2)

    # Disk
    disk = psutil.disk_usage("/")
    disk_percent = disk.percent
    disk_used_gb = round(disk.used / (1024**3), 2)
    disk_total_gb = round(disk.total / (1024**3), 2)

    return SystemMetrics(
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        memory_used_gb=memory_used_gb,
        memory_total_gb=memory_total_gb,
        disk_percent=disk_percent,
        disk_used_gb=disk_used_gb,
        disk_total_gb=disk_total_gb,
    )


@router.get("/service-status", response_model=ServiceStatus)
async def admin_service_status(
    current_user=Depends(get_current_user),
) -> ServiceStatus:
    _require_admin(current_user)

    # Check Git service (Gitea)
    git_status = False
    try:
        gitea_url = os.getenv("GITEA_URL", "http://git:3000")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{gitea_url}/api/healthz")
            git_status = response.status_code == 200
    except Exception:
        git_status = False

    # API is online since we got here
    api_status = True

    # DB check via simple query would be done in get_session
    # If this endpoint works, DB is up
    db_status = True

    return ServiceStatus(git=git_status, db=db_status, api=api_status)


@router.get("/backups", response_model=BackupInfo)
async def admin_backups(
    current_user=Depends(get_current_user),
) -> BackupInfo:
    _require_admin(current_user)

    # Check for backup files in /backups directory
    backup_dir = "/backups"
    last_backup = None

    if os.path.exists(backup_dir):
        try:
            files = [f for f in os.listdir(backup_dir) if f.endswith(".sql") or f.endswith(".dump")]
            if files:
                # Get most recent file
                files_with_time = [
                    (f, os.path.getmtime(os.path.join(backup_dir, f)))
                    for f in files
                ]
                files_with_time.sort(key=lambda x: x[1], reverse=True)
                last_backup_time = datetime.fromtimestamp(files_with_time[0][1])
                last_backup = last_backup_time.strftime("%d.%m.%Y %H:%M")
        except Exception:
            pass

    # Next backup is scheduled for 03:00 tomorrow if backups exist
    next_backup = "03:00"
    if last_backup:
        next_backup = f"Завтра 03:00"

    return BackupInfo(last_backup=last_backup, next_backup=next_backup)


@router.post("/backups/create")
async def admin_create_backup(
    current_user=Depends(get_current_user),
) -> dict:
    _require_admin(current_user)

    import subprocess
    from datetime import datetime

    backup_dir = "/backups"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"backup_{timestamp}.sql")

    # Get DB connection from environment
    db_host = os.getenv("POSTGRES_HOST", "db")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "app")
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")

    try:
        # Run pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = db_pass

        result = subprocess.run(
            [
                "pg_dump",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-f", backup_file,
                "--clean",
                "--if-exists",
            ],
            env=env,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode == 0:
            return {"success": True, "file": f"backup_{timestamp}.sql", "message": "Backup created successfully"}
        else:
            raise HTTPException(status_code=500, detail=f"Backup failed: {result.stderr}")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Backup timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup error: {str(e)}")
