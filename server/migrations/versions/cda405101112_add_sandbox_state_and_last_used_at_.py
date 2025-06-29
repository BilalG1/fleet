"""add sandbox state and last used at fields

Revision ID: cda405101112
Revises: 73cd148a93db
Create Date: 2025-06-15 22:16:46.652172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel             # NEW


# revision identifiers, used by Alembic.
revision: str = 'cda405101112'
down_revision: Union[str, None] = '73cd148a93db'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('task', sa.Column('sandbox_state', sa.String(), nullable=True))
    op.add_column('task', sa.Column('last_used_at', sa.DateTime(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('task', 'last_used_at')
    op.drop_column('task', 'sandbox_state')
    # ### end Alembic commands ###
