-- Create batch_jobs table for tracking batch job executions
-- This table stores business status independent of scheduler implementation (Quartz/Spring Batch)

CREATE TABLE batch_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    business_status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying by status and job name
CREATE INDEX idx_batch_jobs_business_status ON batch_jobs(business_status);
CREATE INDEX idx_batch_jobs_job_name ON batch_jobs(job_name);

-- Comment on table and columns
COMMENT ON TABLE batch_jobs IS 'Tracks business status of batch job executions';
COMMENT ON COLUMN batch_jobs.business_status IS 'Business status: SCHEDULED, PROCESSING, COMPLETED, FAILED, CANCELLED';
