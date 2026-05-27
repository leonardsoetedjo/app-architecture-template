"""create workflow executions table

Revision ID: 002
Revises: 001
Create Date: 2026-05-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create workflow_executions table for tracking workflow execution status."""
    op.create_table(
        'workflow_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workflow_name', sa.String(length=255), nullable=False),
        sa.Column('workflow_type', sa.String(length=100), nullable=False),
        sa.Column('business_status', sa.String(length=50), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('records_processed', sa.Integer(), nullable=False, default=0),
        sa.Column('records_failed', sa.Integer(), nullable=False, default=0),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for efficient querying by status
    op.create_index('idx_workflow_executions_business_status', 'workflow_executions', ['business_status'])
    op.create_index('idx_workflow_executions_workflow_name', 'workflow_executions', ['workflow_name'])
    
    # Add comment to table (PostgreSQL-specific)
    op.execute("COMMENT ON TABLE workflow_executions IS 'Tracks business status of workflow executions'")
    op.execute("COMMENT ON COLUMN workflow_executions.business_status IS 'Business status: scheduled, processing, completed, failed, cancelled'")


def downgrade() -> None:
    """Drop workflow_executions table."""
    op.drop_index('idx_workflow_executions_workflow_name', table_name='workflow_executions')
    op.drop_index('idx_workflow_executions_business_status', table_name='workflow_executions')
    op.drop_table('workflow_executions')
