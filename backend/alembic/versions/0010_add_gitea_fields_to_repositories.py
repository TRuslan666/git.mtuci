from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add gitea_repo_name column
    op.add_column(
        "repositories",
        sa.Column("gitea_repo_name", sa.String(length=255), nullable=True)
    )
    # Add clone_url column
    op.add_column(
        "repositories",
        sa.Column("clone_url", sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("repositories", "clone_url")
    op.drop_column("repositories", "gitea_repo_name")
