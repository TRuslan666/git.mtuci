"""
Add MTUCI LK integration fields to users table

Revision ID: 0015
Revises: 0014
Create Date: 2026-03-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade():
    # Add mtuci_login column
    op.add_column(
        "users",
        sa.Column("mtuci_login", sa.String(100), nullable=True, index=True)
    )
    # Add mtuci_password column (for encrypted storage of LK password)
    op.add_column(
        "users",
        sa.Column("mtuci_password", sa.String(255), nullable=True)
    )


def downgrade():
    op.drop_column("users", "mtuci_password")
    op.drop_column("users", "mtuci_login")
