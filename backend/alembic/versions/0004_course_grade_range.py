from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("grade_min", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "courses",
        sa.Column("grade_max", sa.Integer(), nullable=False, server_default="100"),
    )


def downgrade() -> None:
    op.drop_column("courses", "grade_max")
    op.drop_column("courses", "grade_min")
