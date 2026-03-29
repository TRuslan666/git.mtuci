"""
Add faculties and groups tables, add faculty_id and group_id to users

Revision ID: 0012
Revises: 0011
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade():
    # Create faculties table
    op.create_table(
        "faculties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("short_name", sa.String(10), nullable=False, unique=True),
    )

    # Create groups table
    op.create_table(
        "groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("faculty_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False, index=True),
    )

    # Add faculty_id and group_id to users
    op.add_column(
        "users",
        sa.Column("faculty_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("faculties.id", ondelete="SET NULL"), nullable=True, index=True)
    )
    op.add_column(
        "users",
        sa.Column("group_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("groups.id", ondelete="SET NULL"), nullable=True, index=True)
    )

    # Insert predefined faculties using raw SQL
    op.execute("""
        INSERT INTO faculties (id, name, short_name) VALUES
        (gen_random_uuid(), 'Радио и телевидение', 'РТ'),
        (gen_random_uuid(), 'Информационные технологии', 'ИТ'),
        (gen_random_uuid(), 'Кибернетика и информационная безопасность', 'КИБ'),
        (gen_random_uuid(), 'Системная инженерия', 'СИ'),
        (gen_random_uuid(), 'Цифровая экономика и массовые коммуникации', 'ЦЭМК')
    """)


def downgrade():
    op.drop_column("users", "group_id")
    op.drop_column("users", "faculty_id")
    op.drop_table("groups")
    op.drop_table("faculties")
