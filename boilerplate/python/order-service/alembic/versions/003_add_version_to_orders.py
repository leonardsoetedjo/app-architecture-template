"""
Revision ID: 003_add_version_to_orders
Revises: 002_create_workflow_executions
Create Date: 2026-07-02 00:00:00.000000

Add optimistic locking version column to orders table.
"""
from alembic import op
import sqlalchemy as sa


revision = '003_add_version_to_orders'
down_revision = '002_create_workflow_executions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add version column for optimistic locking
    # Default to 0 for existing rows, NOT NULL constraint
    op.add_column(
        'orders',
        sa.Column(
            'version',
            sa.Integer,
            nullable=False,
            server_default='0'
        )
    )


def downgrade() -> None:
    op.drop_column('orders', 'version')
