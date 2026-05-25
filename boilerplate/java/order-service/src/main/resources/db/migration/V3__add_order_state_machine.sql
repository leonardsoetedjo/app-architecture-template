-- Order State Machine Persistence
-- Tracks current state and transition history for audit trail

-- Current state table
CREATE TABLE IF NOT EXISTS order_state (
    order_id UUID PRIMARY KEY,
    current_state VARCHAR(50) NOT NULL,
    previous_state VARCHAR(50),
    state_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_order_state CHECK (
        current_state IN (
            'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 
            'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'
        )
    )
);

-- State transition history (audit trail)
CREATE TABLE IF NOT EXISTS order_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    event VARCHAR(50) NOT NULL,
    triggered_by VARCHAR(100),  -- User ID or 'SYSTEM'
    metadata JSONB,  -- Additional context (payment_id, tracking_number, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_history_states CHECK (
        to_state IN (
            'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 
            'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'
        )
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_state_history_order_id ON order_state_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_state_history_created_at ON order_state_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_state_history_event ON order_state_history(event);

-- Comment on tables
COMMENT ON TABLE order_state IS 'Current state of each order (single row per order)';
COMMENT ON TABLE order_state_history IS 'Complete audit trail of all state transitions';
