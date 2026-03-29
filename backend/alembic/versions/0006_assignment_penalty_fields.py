from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assignments",
        sa.Column(
            "start_date",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.add_column(
        "assignments",
        sa.Column(
            "late_penalty_periods",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )

    op.add_column("submissions", sa.Column("final_grade", sa.Float(), nullable=True))
    op.add_column(
        "submissions",
        sa.Column("penalty_points", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.add_column(
        "submissions",
        sa.Column("weeks_late", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("submissions", "weeks_late")
    op.drop_column("submissions", "penalty_points")
    op.drop_column("submissions", "final_grade")
    op.drop_column("assignments", "late_penalty_periods")
    op.drop_column("assignments", "start_date")
