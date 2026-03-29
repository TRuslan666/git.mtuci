from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RepositoryCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class RepositoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class RepositoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str]
    gitea_repo_name: Optional[str]
    clone_url: Optional[str]
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
