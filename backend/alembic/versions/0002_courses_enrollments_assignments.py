from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# Идентификатор ревизии Alembic
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "teacher_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_courses_teacher_id", "courses", ["teacher_id"], unique=False)

    op.create_table(
        "course_enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "course_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "enrolled_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint(
            "course_id",
            "student_id",
            name="uq_course_enrollments_course_id_student_id",
        ),
    )
    op.create_index(
        "ix_course_enrollments_course_id",
        "course_enrollments",
        ["course_id"],
        unique=False,
    )
    op.create_index(
        "ix_course_enrollments_student_id",
        "course_enrollments",
        ["student_id"],
        unique=False,
    )

    op.create_table(
        "assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "course_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("gitea_repo_name", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_assignments_course_id", "assignments", ["course_id"], unique=False)
    op.create_index("ix_assignments_deadline", "assignments", ["deadline"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_assignments_deadline", table_name="assignments")
    op.drop_index("ix_assignments_course_id", table_name="assignments")
    op.drop_table("assignments")

    op.drop_index("ix_course_enrollments_student_id", table_name="course_enrollments")
    op.drop_index("ix_course_enrollments_course_id", table_name="course_enrollments")
    op.drop_table("course_enrollments")

    op.drop_index("ix_courses_teacher_id", table_name="courses")
    op.drop_table("courses")

