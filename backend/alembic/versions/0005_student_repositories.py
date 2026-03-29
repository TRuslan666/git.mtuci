from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "student_repositories",
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
        sa.Column("repo_name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_student_repositories_assignment_id_student_id",
        ),
        sa.UniqueConstraint("repo_name", name="uq_student_repositories_repo_name"),
    )
    op.create_index(
        "ix_student_repositories_assignment_id",
        "student_repositories",
        ["assignment_id"],
        unique=False,
    )
    op.create_index(
        "ix_student_repositories_student_id",
        "student_repositories",
        ["student_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_student_repositories_student_id", table_name="student_repositories")
    op.drop_index("ix_student_repositories_assignment_id", table_name="student_repositories")
    op.drop_table("student_repositories")
