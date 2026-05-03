import asyncio
from app.core.database import get_session
from app.models import ActivityLog
from sqlalchemy import select, func
from datetime import datetime, timezone

async def check():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Check repo_created entries
        result = await session.execute(
            select(ActivityLog.activity_type, ActivityLog.repo_name, ActivityLog.created_at)
            .where(ActivityLog.activity_type == 'repo_created')
            .order_by(ActivityLog.created_at.desc())
        )
        repos = result.all()
        
        print(f"Total repo_created entries: {len(repos)}")
        for r in repos[:5]:
            print(f"  - {r.repo_name} at {r.created_at}")
        
        # Check today's repos
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_result = await session.execute(
            select(func.count(ActivityLog.id))
            .where(
                ActivityLog.activity_type == 'repo_created',
                ActivityLog.created_at >= today_start
            )
        )
        today_count = today_result.scalar() or 0
        print(f"\nToday's new repositories: {today_count}")
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(check())
