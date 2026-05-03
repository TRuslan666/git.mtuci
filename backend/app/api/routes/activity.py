"""
Activity log endpoints for recent activity feed
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from datetime import datetime, timedelta, timezone

from app.core.database import get_session
from app.models import ActivityLog, User, ActivityType
from app.core.security import get_current_user

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/recent")
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    activity_type: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get recent activity log entries with pagination.
    Optional filter by activity type.
    """
    # Build base query for counting
    count_query = select(func.count(ActivityLog.id))
    
    if activity_type:
        try:
            act_type = ActivityType(activity_type)
            count_query = count_query.where(ActivityLog.activity_type == act_type)
        except ValueError:
            pass
    
    # Get total count
    total_result = await session.execute(count_query)
    total_count = total_result.scalar() or 0
    
    # Build data query
    query = (
        select(ActivityLog, User.full_name, User.email)
        .join(User, ActivityLog.user_id == User.id, isouter=True)
        .order_by(desc(ActivityLog.created_at))
        .offset(offset)
        .limit(limit)
    )
    
    if activity_type:
        try:
            act_type = ActivityType(activity_type)
            query = query.where(ActivityLog.activity_type == act_type)
        except ValueError:
            pass  # Invalid type, ignore filter
    
    result = await session.execute(query)
    rows = result.all()
    
    activities = []
    for row in rows:
        activity, full_name, email = row
        user_name = full_name or email or "Unknown"
        
        # Generate initials from user name
        initials = "".join([n[0].upper() for n in user_name.split() if n])[:2]
        if not initials:
            initials = "??"
        
        # Map activity type to tag
        type_tags = {
            ActivityType.commit: "Коммит",
            ActivityType.push: "Push",
            ActivityType.pull_request: "Pull Request",
            ActivityType.pr_merge: "Merge",
            ActivityType.fork: "Форк",
            ActivityType.repo_created: "Создание",
            ActivityType.repo_deleted: "Удаление",
            ActivityType.login: "Вход",
            ActivityType.logout: "Выход",
        }
        
        # Color based on activity type
        type_colors = {
            ActivityType.commit: "#60a5fa",
            ActivityType.push: "#fbbf24",
            ActivityType.pull_request: "#4caf50",
            ActivityType.pr_merge: "#a78bfa",
            ActivityType.fork: "#e24b4a",
            ActivityType.repo_created: "#4caf50",
            ActivityType.repo_deleted: "#e24b4a",
            ActivityType.login: "#60a5fa",
            ActivityType.logout: "#9ca3af",
        }
        
        activities.append({
            "id": str(activity.id),
            "type": activity.activity_type.value,
            "user": user_name,
            "initials": initials,
            "color": type_colors.get(activity.activity_type, "#60a5fa"),
            "repo": activity.repo_name or "",
            "message": activity.message or "",
            "time": activity.created_at.strftime("%H:%M") if activity.created_at else "",
            "tag": type_tags.get(activity.activity_type, activity.activity_type.value),
            "timestamp": activity.created_at.isoformat() if activity.created_at else None,
        })
    
    return {"activities": activities, "count": len(activities), "total": total_count}
