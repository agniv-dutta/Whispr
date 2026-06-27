"""add disappearing_message_timer to conversations

Revision ID: d1e2f3a4b5c6
Revises: 48782a63ae0c
Create Date: 2026-06-27 22:15:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = '48782a63ae0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'conversations',
        sa.Column('disappearing_message_timer', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('conversations', 'disappearing_message_timer')
