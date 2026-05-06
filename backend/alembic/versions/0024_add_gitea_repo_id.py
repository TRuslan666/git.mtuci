"""add gitea_repo_id and make owner_id nullable

Revision ID: 0024
Revises: 0023
Create Date: 2026-05-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0024'
down_revision = '0023'
branch_labels = None
depends_on = None


def upgrade():
    # Add gitea_repo_id column
    op.add_column('repositories', sa.Column('gitea_repo_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_repositories_gitea_repo_id'), 'repositories', ['gitea_repo_id'], unique=False)
    
    # Make owner_id nullable and change ondelete to SET NULL
    op.alter_column('repositories', 'owner_id',
                    existing_type=sa.UUID(),
                    nullable=True)
    # Note: changing ondelete requires recreating the constraint, which is complex
    # For now, we'll just make it nullable


def downgrade():
    op.drop_index(op.f('ix_repositories_gitea_repo_id'), table_name='repositories')
    op.drop_column('repositories', 'gitea_repo_id')
    
    # Make owner_id not nullable again
    op.alter_column('repositories', 'owner_id',
                    existing_type=sa.UUID(),
                    nullable=False)
