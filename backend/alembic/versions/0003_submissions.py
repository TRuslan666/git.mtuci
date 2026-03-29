from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "assignment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("assignments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("grade", sa.Integer(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("grade IS NULL OR (grade >= 0 AND grade <= 100)", name="ck_submissions_grade_0_100"),
        sa.UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_submissions_assignment_id_student_id",
        ),
    )
    op.create_index("ix_submissions_assignment_id", "submissions", ["assignment_id"], unique=False)
    op.create_index("ix_submissions_student_id", "submissions", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_submissions_student_id", table_name="submissions")
    op.drop_index("ix_submissions_assignment_id", table_name="submissions")
    op.drop_table("submissions")
