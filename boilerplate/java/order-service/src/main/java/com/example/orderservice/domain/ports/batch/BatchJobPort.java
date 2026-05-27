package com.example.orderservice.domain.ports.batch;

import com.example.orderservice.domain.models.batch.BatchJob;
import com.example.orderservice.domain.models.batch.BatchJobStatus;

import java.util.List;
import java.util.Optional;

/**
 * Interface for batch job operations.
 * Defined in domain layer for Clean Architecture - independent of persistence mechanism.
 * 
 * Implementations:
 * - JPA repository for database persistence
 * - In-memory repository for testing
 * 
 * @see <a href="https://github.com/leonardsoetedjo/app-architecture-template/blob/main/docs/01-agnostic/01-standards/batch-job-status-architecture.md">
 * Batch Job Status Architecture Guide</a>
 */
public interface BatchJobPort {
    
    /**
     * Create a new batch job execution record.
     * 
     * @param jobName the name of the job
     * @param jobType the type/category of the job
     * @return the created batch job with SCHEDULED status
     */
    BatchJob createJob(String jobName, String jobType);
    
    /**
     * Update the business status of a batch job.
     * 
     * @param jobId the job ID
     * @param status the new business status
     * @param errorMessage optional error message (for FAILED status)
     * @return the updated batch job
     */
    BatchJob updateStatus(Long jobId, BatchJobStatus status, String errorMessage);
    
    /**
     * Get a batch job by ID.
     * 
     * @param jobId the job ID
     * @return the batch job, or empty if not found
     */
    Optional<BatchJob> getJob(Long jobId);
    
    /**
     * Get all jobs with a specific business status.
     * 
     * @param status the business status to filter by
     * @return list of matching jobs
     */
    List<BatchJob> getJobsByStatus(BatchJobStatus status);
}
