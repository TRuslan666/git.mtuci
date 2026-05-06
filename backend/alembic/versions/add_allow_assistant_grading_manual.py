"""add_allow_assistant_grading_to_user

Revision ID: add_allow_assistant_grading
Revises: 0025
Create Date: 2026-05-06 07:59:10.793206
"""

from alembic import op
import sqlalchemy as sa


revision = 'add_allow_assistant_grading'
down_revision = '0025'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('allow_assistant_grading', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'allow_assistant_grading')
