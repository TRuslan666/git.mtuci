from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add group_name and student_id to users table
    op.add_column(
        "users",
        sa.Column("group_name", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("student_id", sa.String(length=50), nullable=True)
    )
    op.create_index("ix_users_group_name", "users", ["group_name"])
    op.create_index("ix_users_student_id", "users", ["student_id"], unique=True)
    
    # Add target_groups to courses table
    op.add_column(
        "courses",
        sa.Column(
            "target_groups",
            postgresql.ARRAY(sa.String(length=50)),
            nullable=True,
            server_default="{}"
        )
    )


def downgrade() -> None:
    op.drop_column("courses", "target_groups")
    op.drop_index("ix_users_student_id", table_name="users")
    op.drop_index("ix_users_group_name", table_name="users")
    op.drop_column("users", "student_id")
    op.drop_column("users", "group_name")
