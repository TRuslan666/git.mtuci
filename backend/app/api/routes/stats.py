"""
Stats API routes - для дашборда и аналитики
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.faculty import Faculty
from app.models.repository import Repository
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


@router.get("/commits-by-faculty", response_model=list[FacultyCommitsStat])
async def get_commits_by_faculty(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[FacultyCommitsStat]:
    """
    Get commit statistics grouped by faculty.
    
    Fetches real commit counts from Gitea API for all repositories.
    Falls back to repository count-based estimation if Gitea is unavailable.
    """
    # Get all faculties from DB
    result = await session.execute(select(Faculty).order_by(Faculty.short_name))
    faculties = result.scalars().all()
    
    # Get all repositories with their faculties
    repos_result = await session.execute(
        select(Repository, Faculty.short_name, Faculty.name)
        .join(Faculty, Repository.faculty_id == Faculty.id)
        .where(Repository.gitea_repo_name.is_not(None))
    )
    repos_with_faculty = repos_result.all()
    
    # Group repositories by faculty
    faculty_repos: dict[str, list[tuple[Repository, str, str]]] = {}
    for repo, fac_short, fac_name in repos_with_faculty:
        if fac_short not in faculty_repos:
            faculty_repos[fac_short] = []
        faculty_repos[fac_short].append((repo, fac_short, fac_name))
    
    # Calculate real commit counts from Gitea
    stats = []
    for faculty in faculties:
        fac_short = faculty.short_name
        repos = faculty_repos.get(fac_short, [])
        
        total_commits = 0
        gitea_available = True
        
        for repo, _, _ in repos:
            if not repo.gitea_repo_name:
                continue
                
            try:
                # Fetch real commits from Gitea
                commits_raw, _ = await list_repo_commits(
                    owner=GITEA_ADMIN_USERNAME,
                    repo=repo.gitea_repo_name,
                    limit=100,
                    max_pages=10,  # Limit to prevent timeouts
                )
                total_commits += len(commits_raw)
            except Exception:
                # Gitea unavailable or repo doesn't exist
                gitea_available = False
                # Fall back to estimation: ~25 commits per repo
                total_commits += 25
        
        # If no repos or Gitea failed, use fallback estimation
        if not repos:
            # Check repositories without faculty assigned
            unassigned_result = await session.execute(
                select(func.count(Repository.id)).where(
                    (Repository.faculty_id.is_(None)) | 
                    (Repository.faculty_id == faculty.id)
                )
            )
            repo_count = unassigned_result.scalar() or 0
            total_commits = repo_count * 25
        
        stats.append(FacultyCommitsStat(
            faculty=faculty.name,
            short_name=fac_short,
            commits=total_commits,
            color=FACULTY_COLORS.get(fac_short, "bg-gray-500"),
        ))
    
    # Sort by commits descending
    stats.sort(key=lambda x: x.commits, reverse=True)
    
    return stats


@router.get("/dashboard-summary")
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


@router.get("/active-repositories", response_model=list[ActiveRepositoryStat])
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
