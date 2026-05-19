-- Flyway baseline migration
-- Version: 1
-- Description: Create example table for demonstration
-- Syntax: PostgreSQL

CREATE TABLE IF NOT EXISTS example_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version BIGINT DEFAULT 0 NOT NULL
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table(name);

-- Create trigger to update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_example_table_updated_at
BEFORE UPDATE ON example_table
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
