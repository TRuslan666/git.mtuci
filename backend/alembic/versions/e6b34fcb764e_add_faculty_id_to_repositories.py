"""add faculty_id to repositories

Revision ID: e6b34fcb764e
Revises: 0021
Create Date: 2026-04-28 20:01:55.737648
"""

from alembic import op
import sqlalchemy as sa




revision = 'e6b34fcb764e'
down_revision = '0021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migration cancelled - faculties table doesn't exist
    pass


def downgrade() -> None:
    pass

