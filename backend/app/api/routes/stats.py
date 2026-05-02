"""
Stats API routes - для дашборда и аналитики
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user
from app.core.permissions import require_permission
from app.models.repository import Repository, RepositoryType
from app.models.user import User, UserRole
from app.services.gitea_service import list_repo_commits, GITEA_ADMIN_USERNAME

router = APIRouter(prefix="/stats", tags=["stats"])


class FacultyCommitsStat(BaseModel):
    faculty: str
    short_name: str
    commits: int
    color: str


# Цвета для факультетов (соответствуют фронтенду)
FACULTY_COLORS = {
    "ИТ": "bg-blue-500",
    "КИБ": "bg-green-500",
    "РТ": "bg-purple-500",
    "СИ": "bg-orange-500",
    "ЦЭМК": "bg-pink-500",
}


class OverviewStats(BaseModel):
    total_users: int
    total_students: int
    total_repositories: int
    total_commits: int
    repositories_by_type: Dict[str, int]


@router.get("/overview", response_model=OverviewStats)
@require_permission("settings_view")
async def get_overview_stats(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OverviewStats:
    """Get overview statistics with repository breakdown by type."""
    # Total users
    users_result = await session.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0

    # Active students
    students_result = await session.execute(
        select(func.count(User.id)).where(User.role == UserRole.student)
    )
    total_students = students_result.scalar() or 0

    # Total repositories
    repos_result = await session.execute(select(func.count(Repository.id)))
    total_repos = repos_result.scalar() or 0

    # Repository counts by type
    repos_by_type = {}
    for repo_type in RepositoryType:
        count_result = await session.execute(
            select(func.count(Repository.id)).where(Repository.repo_type == repo_type)
        )
        repos_by_type[repo_type.value] = count_result.scalar() or 0

    return OverviewStats(
        total_users=total_users,
        total_students=total_students,
        total_repositories=total_repos,
        total_commits=981,  # Mock - will be real from Gitea later
        repositories_by_type=repos_by_type,
    )


@router.get("/commits-by-faculty", response_model=list[FacultyCommitsStat])
@require_permission("logs_view")
async def get_commits_by_faculty(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[FacultyCommitsStat]:
    """
    Get commit statistics grouped by faculty.
    
    Note: Faculty grouping is disabled as faculties table has been removed.
    Returns empty list.
    """
    # Faculties table removed - return empty list
    return []


@router.get("/dashboard-summary")
@require_permission("settings_view")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Get summary statistics for admin dashboard.
    """
    # Total users
    users_result = await session.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0
    
    # Active students
    students_result = await session.execute(
        select(func.count(User.id)).where(User.role == UserRole.student)
    )
    total_students = students_result.scalar() or 0
    
    # Total repositories
    repos_result = await session.execute(select(func.count(Repository.id)))
    total_repos = repos_result.scalar() or 0
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_repositories": total_repos,
        "total_commits": 981,  # Mock - will be real from Gitea later
    }


class ActiveRepositoryStat(BaseModel):
    id: UUID
    name: str
    author: str
    commits: int
    is_public: bool
    initials: str
    color: str


# Color palette for repository cards (matching frontend mock)
REPO_COLORS = [
    "bg-blue-500/20 text-blue-400",
    "bg-purple-500/20 text-purple-400",
    "bg-green-500/20 text-green-400",
    "bg-orange-500/20 text-orange-400",
    "bg-pink-500/20 text-pink-400",
]


def get_initials(full_name: str) -> str:
    """Extract initials from full name (e.g., 'Иван Петров' -> 'ИП')."""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    return full_name[:2].upper() if full_name else "??"


@router.get("/total-users")
async def get_total_users(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Get total count of registered users."""
    # Debug: check if users exist
    result = await session.execute(select(func.count()).select_from(User))
    raw_count = result.scalar()
    
    # Also fetch actual users to debug
    users_result = await session.execute(select(User.id, User.email).limit(5))
    users_sample = users_result.all()
    
    print(f"[DEBUG] Total users count (raw): {raw_count}")
    print(f"[DEBUG] Sample users: {users_sample}")
    
    total = raw_count or 0
    return {"total_users": total, "debug_sample": len(users_sample)}


@router.get("/my-commits")
async def get_my_commits(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Get total commit count for current user across all their repositories.
    """
    # Get user's repositories
    result = await session.execute(
        select(Repository)
        .where(Repository.owner_id == current_user.id)
        .where(Repository.gitea_repo_name.is_not(None))
    )
    repos = result.scalars().all()
    
    total_commits = 0
    for repo in repos:
        if repo.gitea_repo_name:
            try:
                commits_raw, _ = await list_repo_commits(
                    owner=GITEA_ADMIN_USERNAME,
                    repo=repo.gitea_repo_name,
                    limit=100,
                    max_pages=10,
                )
                total_commits += len(commits_raw)
            except Exception:
                # Gitea unavailable or repo doesn't exist
                pass
    
    return {
        "commits": total_commits,
        "repositories": len(repos),
    }


@router.get("/active-repositories", response_model=list[ActiveRepositoryStat])
@require_permission("logs_view")
async def get_active_repositories(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ActiveRepositoryStat]:
    """
    Get most recently updated active repositories with author info.
    
    Fetches real commit counts from Gitea API.
    """
    # Get recent repositories with owner info using join
    result = await session.execute(
        select(Repository, User.full_name)
        .join(User, Repository.owner_id == User.id)
        .where(Repository.gitea_repo_name.is_not(None))
        .order_by(Repository.updated_at.desc())
        .limit(limit)
    )
    
    repos_with_owners = result.all()
    
    stats = []
    for idx, (repo, owner_name) in enumerate(repos_with_owners):
        # Fetch real commit count from Gitea
        commits = 0
        if repo.gitea_repo_name:
            try:
                commits_raw, _ = await list_repo_commits(
                    owner=GITEA_ADMIN_USERNAME,
                    repo=repo.gitea_repo_name,
                    limit=100,
                    max_pages=5,  # Limit to prevent timeouts
                )
                commits = len(commits_raw)
            except Exception:
                # Gitea unavailable or repo doesn't exist
                commits = 0
        
        stats.append(ActiveRepositoryStat(
            id=repo.id,
            name=repo.name,
            author=owner_name or "Unknown",
            commits=commits,
            is_public=True,  # Default to public for now
            initials=get_initials(owner_name or "??"),
            color=REPO_COLORS[idx % len(REPO_COLORS)],
        ))
    
    return stats
