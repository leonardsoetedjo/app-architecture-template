-- Flyway migration: Alter table
-- Version: 2
-- Description: Add timestamp columns to existing table
-- Syntax: PostgreSQL

-- Add created_at and updated_at columns if they don't exist
ALTER TABLE example_table
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add version column for optimistic locking if it doesn't exist
ALTER TABLE example_table
ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;

-- Populate existing rows with default values
UPDATE example_table
SET created_at = NOW(),
    updated_at = NOW(),
    version = 0
WHERE created_at IS NULL OR updated_at IS NULL OR version IS NULL;

-- Set columns to NOT NULL after populating
ALTER TABLE example_table
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL,
ALTER COLUMN version SET NOT NULL;
