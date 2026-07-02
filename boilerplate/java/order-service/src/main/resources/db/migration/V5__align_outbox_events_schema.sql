-- Flyway migration to align outbox_events schema with canonical standard
-- Version: 5
-- Description: Add missing columns to outbox_events for cross-stack parity

-- Add missing columns
ALTER TABLE outbox_events 
    ADD COLUMN IF NOT EXISTS event_type VARCHAR(128),
    ADD COLUMN IF NOT EXISTS aggregate_type VARCHAR(128),
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Modify payload column to JSONB if it isn't already
-- (Java may have created it as TEXT initially)
-- Note: This is a no-op if already JSONB

-- Create indexes for efficient polling
CREATE INDEX IF NOT EXISTS idx_outbox_status_created 
    ON outbox_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_correlation 
    ON outbox_events(correlation_id);

-- Add comment for documentation
COMMENT ON TABLE outbox_events IS 'Outbox pattern table for reliable event publishing. See docs/01-agnostic/01-standards/cross-stack-parity.md';
