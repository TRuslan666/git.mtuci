"""
Webhook endpoints for receiving events from external services (Gitea, etc.)
"""
import os
import hmac
import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.user import User
from app.services.activity_service import log_commit, log_push, log_repo_created, log_repo_deleted
from app.core.security import get_current_user

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Secret for webhook verification (should be set in environment)
WEBHOOK_SECRET = os.getenv("GITEA_WEBHOOK_SECRET", "")


class GiteaCommit(BaseModel):
    """Gitea commit data."""
    id: str
    message: str
    timestamp: str
    url: str
    author: dict


class GiteaPushPayload(BaseModel):
    """Gitea push event payload."""
    ref: str
    before: str
    after: str
    compare_url: str
    commits: list[GiteaCommit]
    repository: dict
    pusher: dict
    sender: dict


class GiteaRepositoryPayload(BaseModel):
    """Gitea repository event payload."""
    action: str  # created, deleted
    repository: dict
    sender: dict


def verify_webhook_signature(payload: bytes, signature: Optional[str]) -> bool:
    """Verify Gitea webhook signature using HMAC-SHA256."""
    if not WEBHOOK_SECRET or not signature:
        return True  # Skip verification if secret not configured
    
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/gitea/push")
async def gitea_push_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Receive push events from Gitea.
    Logs commits and push activity.
    """
    # Get signature from headers
    signature = request.headers.get("X-Gitea-Signature")
    
    # Read raw body for signature verification
    body = await request.body()
    
    if not verify_webhook_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    # Parse payload
    try:
        payload = GiteaPushPayload.model_validate_json(body)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payload: {str(e)}"
        )
    
    # Extract info
    repo_name = payload.repository.get("full_name", "unknown")
    pusher_email = payload.pusher.get("email", "")
    commit_count = len(payload.commits)
    
    # TODO: Find user by email and log activity
    # For now, log without user association (user_id=None)
    
    if commit_count > 0:
        # Log push with commit count
        await log_push(
            session=session,
            user_id=None,  # Will be resolved by email later
            repo_name=repo_name,
            commit_count=commit_count,
            ip_address=None,
        )
        
        # Log individual commits
        for commit in payload.commits:
            await log_commit(
                session=session,
                user_id=None,  # Will be resolved by email later
                repo_name=repo_name,
                commit_message=commit.message[:500],  # Truncate long messages
                ip_address=None,
            )
    
    return {"status": "ok", "commits_logged": commit_count}


@router.post("/gitea/repository")
async def gitea_repository_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Receive repository events from Gitea (created, deleted).
    """
    signature = request.headers.get("X-Gitea-Signature")
    body = await request.body()
    
    if not verify_webhook_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    try:
        payload = GiteaRepositoryPayload.model_validate_json(body)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payload: {str(e)}"
        )
    
    repo_name = payload.repository.get("full_name", "unknown")
    action = payload.action
    
    if action == "created":
        await log_repo_created(
            session=session,
            user_id=None,
            repo_name=repo_name,
            ip_address=None,
        )
    elif action == "deleted":
        await log_repo_deleted(
            session=session,
            user_id=None,
            repo_name=repo_name,
            ip_address=None,
        )
    
    return {"status": "ok", "action": action}


@router.get("/health")
async def webhook_health():
    """Health check for webhook endpoints."""
    return {
        "status": "ok",
        "webhook_secret_configured": bool(WEBHOOK_SECRET)
    }
