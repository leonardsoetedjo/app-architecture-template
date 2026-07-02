"""
Revision ID: 004_align_outbox_events_schema
Revises: 003_add_version_to_orders
Create Date: 2026-07-02 00:00:00.000000

Align outbox_events table with canonical cross-stack schema.
Adds missing columns for parity with NestJS implementation.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision = '004_align_outbox_events_schema'
down_revision = '003_add_version_to_orders'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns
    op.add_column('outbox_events', 
        sa.Column('aggregate_type', sa.String(128), nullable=True))
    op.add_column('outbox_events', 
        sa.Column('correlation_id', sa.String(100), nullable=True))
    op.add_column('outbox_events', 
        sa.Column('retry_count', sa.Integer, nullable=False, server_default='0'))
    op.add_column('outbox_events', 
        sa.Column('sent_at', sa.DateTime, nullable=True))
    
    # Modify event_type to match canonical length
    op.alter_column('outbox_events', 'event_type',
        existing_type=sa.String(100),
        type_=sa.String(128),
        existing_nullable=False)
    
    # Modify aggregate_id to match canonical length
    op.alter_column('outbox_events', 'aggregate_id',
        existing_type=sa.String(100),
        type_=sa.String(256),
        existing_nullable=False)
    
    # Change payload from Text to JSONB for better querying
    op.alter_column('outbox_events', 'payload',
        existing_type=sa.Text,
        type_=pg.JSONB,
        existing_nullable=False)
    
    # Create indexes for efficient polling
    op.create_index('idx_outbox_status_created', 'outbox_events', ['status', 'created_at'])
    op.create_index('idx_outbox_correlation', 'outbox_events', ['correlation_id'])


def downgrade() -> None:
    op.drop_index('idx_outbox_correlation', 'outbox_events')
    op.drop_index('idx_outbox_status_created', 'outbox_events')
    op.alter_column('outbox_events', 'payload',
        existing_type=pg.JSONB,
        type_=sa.Text,
        existing_nullable=False)
    op.alter_column('outbox_events', 'aggregate_id',
        existing_type=sa.String(256),
        type_=sa.String(100),
        existing_nullable=False)
    op.alter_column('outbox_events', 'event_type',
        existing_type=sa.String(128),
        type_=sa.String(100),
        existing_nullable=False)
    op.drop_column('outbox_events', 'sent_at')
    op.drop_column('outbox_events', 'retry_count')
    op.drop_column('outbox_events', 'correlation_id')
    op.drop_column('outbox_events', 'aggregate_type')
