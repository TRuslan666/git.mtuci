"""add user_login to activity_log

Revision ID: 0023
Revises: 0022
Create Date: 2026-05-05 09:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0023'
down_revision = '0022'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('activity_log', sa.Column('user_login', sa.String(length=255), nullable=True))


def downgrade():
    op.drop_column('activity_log', 'user_login')
