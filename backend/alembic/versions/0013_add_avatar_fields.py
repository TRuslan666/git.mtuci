"""add avatar fields to users

Revision ID: 0013
Revises: 0012
Create Date: 2025-03-29

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type first
    avatar_display_mode = sa.Enum("cover", "contain", "fill", "scale-down", name="avatar_display_mode")
    avatar_display_mode.create(op.get_bind())
    
    # Add avatar_url column
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(length=500), nullable=True)
    )
    
    # Add avatar_display_mode column with default
    op.add_column(
        "users",
        sa.Column(
            "avatar_display_mode",
            sa.Enum("cover", "contain", "fill", "scale-down", name="avatar_display_mode"),
            nullable=False,
            server_default="cover"
        )
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_display_mode")
    op.drop_column("users", "avatar_url")
    # Drop the enum type if needed (optional cleanup)
    # op.execute("DROP TYPE IF EXISTS avatar_display_mode")
