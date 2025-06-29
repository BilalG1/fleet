"""start

Revision ID: 4dd8a6c2db98
Revises: 
Create Date: 2025-06-09 11:38:32.668110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel             # NEW


# revision identifiers, used by Alembic.
revision: str = '4dd8a6c2db98'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('project',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('repo_id', sa.Integer(), nullable=False),
    sa.Column('repo_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('repo_html_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('repo_clone_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('project')
    # ### end Alembic commands ###
