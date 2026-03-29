"""
Remove faculties and groups tables, remove faculty_id and group_id from users

Revision ID: 0014
Revises: 0013
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade():
    # Drop columns first (constraints will be auto-dropped by PostgreSQL)
    # Use batch mode with if_exists to handle cases where columns don't exist
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS group_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS faculty_id")
    
    # Drop groups table (has foreign key to faculties)
    op.execute("DROP TABLE IF EXISTS groups")
    
    # Drop faculties table
    op.execute("DROP TABLE IF EXISTS faculties")


def downgrade():
    # Recreate faculties table
    op.create_table(
        "faculties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("short_name", sa.String(10), nullable=False, unique=True),
    )

    # Recreate groups table
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
