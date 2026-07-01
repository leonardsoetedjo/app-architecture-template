-- Flyway migration for order_items table
-- Version: 4
-- Description: Create order_items table with FK to orders
-- Syntax: PostgreSQL

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(19, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient joins and queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add comment for documentation
COMMENT ON TABLE order_items IS 'Line items for orders, following DDD aggregate pattern';
COMMENT ON COLUMN order_items.order_id IS 'Foreign key to orders table with cascade delete';
COMMENT ON COLUMN order_items.unit_price IS 'Price per unit using Decimal(19,4) for currency precision';
