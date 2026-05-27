package com.example.orderservice.domain.models.batch;

/**
 * Business status of a batch job.
 * Used for reporting, auditing, and user-facing dashboards.
 * Independent of scheduler implementation (Quartz, Spring Batch, Prefect).
 * 
 * @see <a href="https://github.com/leonardsoetedjo/app-architecture-template/blob/main/docs/01-agnostic/01-standards/batch-job-status-architecture.md">
 * Batch Job Status Architecture Guide</a>
 */
public enum BatchJobStatus {
    /**
     * Job is configured but not yet triggered.
     */
    SCHEDULED,
    
    /**
     * Job is actively processing data.
     */
    PROCESSING,
    
    /**
     * Job completed successfully with all records processed.
     */
    COMPLETED,
    
    /**
     * Job failed due to business rule violation or data error.
     */
    FAILED,
    
    /**
     * Job was cancelled by user before completion.
     */
    CANCELLED
}
