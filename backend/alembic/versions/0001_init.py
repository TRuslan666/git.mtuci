from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# Ревизии, используемые Alembic
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Делает миграцию устойчивой к повторным запускам в PostgreSQL:
    # перед созданием enum удаляем старый тип вместе с зависимостями.
    op.execute("DROP TYPE IF EXISTS user_role CASCADE")

    role_enum = postgresql.ENUM(
        "student",
        "teacher",
        "admin",
        name="user_role",
    )
    role_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM(
                "student",
                "teacher",
                "admin",
                name="user_role",
                create_type=False,  # Критично: тип уже создан выше
            ),
            nullable=False,
            server_default=sa.text("'student'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_table("users")

    # Удаляем enum тип напрямую, чтобы избежать проблем с create_type/checkfirst.
    op.execute("DROP TYPE IF EXISTS user_role")

