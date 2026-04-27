from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.core.permissions import require_permission
from app.models.repository import Repository
from app.models.user import User
from app.schemas.repository import (
    RepositoryCreateRequest,
    RepositoryRead,
    RepositoryUpdateRequest,
)

router = APIRouter(tags=["repositories"])

GITEA_URL = os.getenv("GITEA_URL", "http://gitea:3000")
GITEA_TOKEN = os.getenv("GITEA_TOKEN", "")
GITEA_ADMIN = os.getenv("GITEA_ADMIN_USERNAME", "gitea_admin")


async def create_gitea_repository(name: str, description: str | None, owner_username: str) -> dict:
    """Create a repository in Gitea via API."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"GITEA_TOKEN present: {bool(GITEA_TOKEN)}")
    logger.info(f"GITEA_URL: {GITEA_URL}")
    
    if not GITEA_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gitea integration not configured",
        )

    async with httpx.AsyncClient() as client:
        # First check if we can access Gitea at all
        try:
            health_check = await client.get(f"{GITEA_URL}/api/v1/version", timeout=5.0)
            logger.info(f"Gitea health check: {health_check.status_code}")
        except Exception as e:
            logger.error(f"Gitea health check failed: {e}")
        
        # Check if user exists in Gitea
        user_check = await client.get(
            f"{GITEA_URL}/api/v1/users/{owner_username}",
            headers={"Authorization": f"token {GITEA_TOKEN}"},
            timeout=5.0,
        )
        logger.info(f"User check for {owner_username}: {user_check.status_code}")
        
        if user_check.status_code == 404:
            # Create user in Gitea via admin API
            logger.info(f"Creating user {owner_username} in Gitea")
            create_user_resp = await client.post(
                f"{GITEA_URL}/api/v1/admin/users",
                headers={
                    "Authorization": f"token {GITEA_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "username": owner_username,
                    "email": f"{owner_username}@gitmtuci.lab",
                    "password": "changeme123",
                    "must_change_password": False,
                },
                timeout=10.0,
            )
            logger.info(f"Create user response: {create_user_resp.status_code} - {create_user_resp.text[:200]}")
            if create_user_resp.status_code not in (201, 200):
                logger.error(f"Failed to create user: {create_user_resp.text}")
        
        # Create repository for the user using admin API
        logger.info(f"Creating repo {name} for user {owner_username}")
        response = await client.post(
            f"{GITEA_URL}/api/v1/admin/users/{owner_username}/repos",
            headers={
                "Authorization": f"token {GITEA_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "name": name,
                "description": description or "",
                "private": False,
                "auto_init": True,
                "default_branch": "main",
            },
            timeout=10.0,
        )
        
        logger.info(f"Create repo response: {response.status_code} - {response.text[:500]}")

        if response.status_code != 201:
            try:
                error_detail = response.json()
            except:
                error_detail = response.text
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create repository in Gitea: {error_detail}",
            )

        return response.json()


async def delete_gitea_repository(owner: str, repo_name: str) -> None:
    """Delete a repository in Gitea via API."""
    if not GITEA_TOKEN:
        return

    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{GITEA_URL}/api/v1/repos/{owner}/{repo_name}",
            headers={"Authorization": f"token {GITEA_TOKEN}"},
        )
        # Ignore 404 errors (repo might not exist)
        if response.status_code not in (204, 404):
            print(f"Warning: Failed to delete Gitea repo: {response.status_code}")


@router.get("/my", response_model=list[RepositoryRead])
async def list_my_repositories(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all repositories owned by the current user."""
    result = await session.execute(
        select(Repository).where(Repository.owner_id == current_user.id).order_by(Repository.created_at.desc())
    )
    repositories = result.scalars().all()
    return [RepositoryRead.model_validate(repo) for repo in repositories]


@router.post("/", response_model=RepositoryRead, status_code=status.HTTP_201_CREATED)
@require_permission("repo_create")
async def create_repository(
    payload: RepositoryCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new repository."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Creating repository for user {current_user.id}, email: {current_user.email}")
        
        # Check if repository with same name exists for this user
        result = await session.execute(
            select(Repository).where(
                Repository.owner_id == current_user.id,
                Repository.name == payload.name,
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repository with this name already exists",
            )

        # Create repository in Gitea (optional)
        clone_url = None
        gitea_repo_name = None
        try:
            # Log all user attributes for debugging
            logger.info(f"User object: id={current_user.id}, email={current_user.email}, full_name={current_user.full_name}")
            
            # Use email prefix or user id as username
            if current_user.email and "@" in current_user.email:
                owner_username = current_user.email.split("@")[0]
            else:
                # Fallback: use user id first 8 chars
                owner_username = str(current_user.id)[:8]
            
            logger.info(f"Owner username extracted: {owner_username}")
            gitea_repo = await create_gitea_repository(
                name=payload.name,
                description=payload.description,
                owner_username=owner_username,
            )
            # Build clone URL
            clone_url = gitea_repo.get("clone_url") or f"{GITEA_URL}/{owner_username}/{payload.name}.git"
            gitea_repo_name = gitea_repo.get("name") or payload.name
            logger.info(f"Gitea repo created successfully: {clone_url}")
        except Exception as e:
            # Log but don't fail - create repo in DB only
            logger.warning(f"Gitea repo creation failed (will create in DB only): {e}")

        repository = Repository(
            name=payload.name,
            description=payload.description,
            gitea_repo_name=gitea_repo_name,
            clone_url=clone_url,
            owner_id=current_user.id,
        )
        session.add(repository)
        await session.commit()
        await session.refresh(repository)
        return RepositoryRead.model_validate(repository)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating repository: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create repository: {str(e)}",
        )


@router.get("/{repository_id}", response_model=RepositoryRead)
async def get_repository(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific repository by ID."""
    result = await session.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.owner_id == current_user.id,
        )
    )
    repository = result.scalar_one_or_none()
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )
    return RepositoryRead.model_validate(repository)


@router.patch("/{repository_id}", response_model=RepositoryRead)
@require_permission("repo_create")
async def update_repository(
    repository_id: UUID,
    payload: RepositoryUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update a repository."""
    result = await session.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.owner_id == current_user.id,
        )
    )
    repository = result.scalar_one_or_none()
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    # Check name uniqueness if name is being updated
    if payload.name and payload.name != repository.name:
        existing = await session.execute(
            select(Repository).where(
                Repository.owner_id == current_user.id,
                Repository.name == payload.name,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repository with this name already exists",
            )
        repository.name = payload.name

    if payload.description is not None:
        repository.description = payload.description

    repository.updated_at = datetime.now(timezone.utc)
    session.add(repository)
    await session.commit()
    await session.refresh(repository)
    return RepositoryRead.model_validate(repository)


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission("repo_delete")
async def delete_repository(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a repository."""
    result = await session.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.owner_id == current_user.id,
        )
    )
    repository = result.scalar_one_or_none()
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    # Delete from Gitea first
    owner_username = current_user.email.split("@")[0]
    await delete_gitea_repository(owner_username, repository.gitea_repo_name or repository.name)

    await session.delete(repository)
    await session.commit()
    return None
