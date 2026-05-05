import os
import secrets
import string
from datetime import datetime
from typing import List, Optional
from uuid import UUID

import httpx
import psutil
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.core.permissions import require_permission
from app.models.repository import Repository, RepositoryType
from app.models.user import User, UserRole
from app.schemas.repository import RepositoryRead
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


def _check_not_self(current_user: User, target_user_id: UUID) -> None:
    """Prevent admin from modifying themselves."""
    if current_user.id == target_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot perform this action on yourself")


def _check_target_not_admin(target_user: User) -> None:
    """Prevent actions on other admin users."""
    if target_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot perform this action on admin users")


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/users", response_model=list[AdminUserRead])
@require_permission("user_view")
async def admin_get_users(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[AdminUserRead]:
    users = await get_all_users(session)
    return [AdminUserRead.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=AdminUserRead)
@require_permission("user_edit")
async def admin_patch_user(
    user_id: UUID,
    payload: AdminUpdateUserRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    _check_not_self(current_user, user_id)

    # Fetch target user and check if admin
    result = await session.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    _check_target_not_admin(target_user)

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
@require_permission("user_edit")
async def admin_approve_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    """Approve pending user."""
    _check_not_self(current_user, user_id)

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    _check_target_not_admin(user)

    user.is_pending = False
    await session.commit()
    await session.refresh(user)
    return AdminUserRead.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission("user_delete")
async def admin_delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _check_not_self(current_user, user_id)

    # Fetch target user and check if admin
    result = await session.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    _check_target_not_admin(target_user)

    await delete_user_by_id(session, user_id)

    # Важно: явно возвращаем Response, чтобы FastAPI не пытался сериализовать body.
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
@require_permission("user_edit")
async def admin_reset_password(
    user_id: UUID,
    payload: Optional[AdminResetPasswordRequest] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AdminResetPasswordResponse:
    _check_not_self(current_user, user_id)

    # Fetch target user and check if admin
    result = await session.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    _check_target_not_admin(target_user)

    if payload and payload.new_password:
        new_password = payload.new_password
    else:
        new_password = _generate_password()

    await reset_user_password(session, user_id=user_id, new_password=new_password)
    return AdminResetPasswordResponse(new_password=new_password)


@router.get("/system-metrics", response_model=SystemMetrics)
@require_permission("settings_view")
async def admin_system_metrics(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SystemMetrics:

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
@require_permission("settings_view")
async def admin_service_status(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ServiceStatus:

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
@require_permission("logs_view")
async def admin_backups(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BackupInfo:

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
@require_permission("settings_edit")
async def admin_create_backup(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:

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


@router.get("/repositories", response_model=List[RepositoryRead])
@require_permission("repo_view")
async def admin_list_repositories(
    repo_type: Optional[RepositoryType] = None,
    language: Optional[str] = None,
    is_blocked: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[RepositoryRead]:
    """Get all repositories with optional filters and pagination (admin only)."""
    query = select(Repository, User.full_name.label("owner_name")).join(
        User, Repository.owner_id == User.id
    )

    if repo_type:
        query = query.where(Repository.repo_type == repo_type)
    if language:
        query = query.where(Repository.language == language)
    if is_blocked is not None:
        query = query.where(Repository.is_blocked == is_blocked)

    query = query.order_by(Repository.created_at.desc()).offset(skip).limit(limit)

    result = await session.execute(query)
    repos_with_owners = result.all()

    repositories = []
    for repo, owner_name in repos_with_owners:
        repo_dict = {
            "id": repo.id,
            "name": repo.name,
            "description": repo.description,
            "gitea_repo_name": repo.gitea_repo_name,
            "clone_url": repo.clone_url,
            "owner_id": repo.owner_id,
            "owner_full_name": owner_name,
            "commits_count": 0,
            "is_public": repo.repo_type == RepositoryType.public,
            "repo_type": repo.repo_type,
            "language": repo.language,
            "is_blocked": repo.is_blocked,
            "created_at": repo.created_at,
            "updated_at": repo.updated_at,
        }
        repositories.append(RepositoryRead.model_validate(repo_dict))

    return repositories


@router.post("/repositories/{repository_id}/toggle-block", response_model=RepositoryRead)
@require_permission("repo_edit")
async def admin_toggle_repository_block(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RepositoryRead:
    """Toggle repository blocked status (admin only)."""
    result = await session.execute(
        select(Repository).where(Repository.id == repository_id)
    )
    repository = result.scalar_one_or_none()
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    repository.is_blocked = not repository.is_blocked
    await session.commit()
    await session.refresh(repository)
    return RepositoryRead.model_validate(repository)


# System-wide Gitea webhook setup
GITEA_URL = os.getenv("GITEA_URL", "http://gitea:3000")
GITEA_TOKEN = os.getenv("GITEA_TOKEN", "")
WEBHOOK_BASE_URL = os.getenv("WEBHOOK_BASE_URL", "http://api:8000/webhooks")
WEBHOOK_SECRET = os.getenv("GITEA_WEBHOOK_SECRET", "")


@router.post("/setup-gitea-webhook")
async def setup_gitea_system_webhook(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Create system-wide webhook in Gitea to capture all events from all repositories.
    This needs to be called once after Gitea is set up.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"GITEA_TOKEN configured: {bool(GITEA_TOKEN)}, length: {len(GITEA_TOKEN) if GITEA_TOKEN else 0}")
    logger.info(f"GITEA_URL: {GITEA_URL}")
    
    if not GITEA_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GITEA_TOKEN not configured",
        )
    
    async with httpx.AsyncClient() as client:
        # Check if system webhook already exists
        hooks_response = await client.get(
            f"{GITEA_URL}/api/v1/admin/hooks",
            headers={"Authorization": f"token {GITEA_TOKEN}"},
            timeout=10.0,
        )
        
        if hooks_response.status_code == 200:
            hooks = hooks_response.json()
            for hook in hooks:
                config = hook.get("config", {})
                if config.get("url") == f"{WEBHOOK_BASE_URL}/gitea":
                    return {
                        "status": "already_exists",
                        "message": "System webhook already configured",
                        "hook_id": hook.get("id"),
                    }
        
        # Create system webhook for all events
        logger.info(f"Creating system webhook -> {WEBHOOK_BASE_URL}/gitea")
        
        # Gitea system webhook API
        response = await client.post(
            f"{GITEA_URL}/api/v1/admin/hooks",
            headers={
                "Authorization": f"token {GITEA_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "type": "gitea",
                "config": {
                    "url": f"{WEBHOOK_BASE_URL}/gitea",
                    "content_type": "json",
                    "secret": WEBHOOK_SECRET,
                },
                "events": [
                    "push",
                    "create",
                    "delete",
                    "fork",
                    "repository",
                    "release",
                ],
                "active": True,
            },
            timeout=10.0,
        )
        
        if response.status_code in (201, 200):
            hook_data = response.json()
            logger.info(f"System webhook created successfully: {hook_data.get('id')}")
            return {
                "status": "created",
                "message": "System webhook created successfully",
                "hook_id": hook_data.get("id"),
                "events": ["push", "create", "delete", "fork", "repository", "release"],
            }
        else:
            error_text = response.text[:500]
            logger.error(f"Failed to create system webhook: {response.status_code} - {error_text}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create system webhook: {response.status_code} - {error_text}",
            )
