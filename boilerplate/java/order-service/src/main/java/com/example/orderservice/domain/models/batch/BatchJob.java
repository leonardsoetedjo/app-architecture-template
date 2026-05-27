package com.example.orderservice.domain.models.batch;

import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;

/**
 * Domain entity representing a batch job execution.
 * Pure POJO - no Spring, Quartz, or JPA annotations.
 * 
 * This entity tracks the business status of batch jobs, separate from
 * technical scheduler statuses (Quartz TriggerState, Spring Batch JobExecution).
 * 
 * @see BatchJobStatus
 * @see <a href="https://github.com/leonardsoetedjo/app-architecture-template/blob/main/docs/01-agnostic/01-standards/batch-job-status-architecture.md">
 * Batch Job Status Architecture Guide</a>
 */
@Value
@Builder
public class BatchJob {
    
    /**
     * Unique identifier for the job execution.
     */
    Long id;
    
    /**
     * Name of the batch job.
     */
    String jobName;
    
    /**
     * Type/category of the batch job.
     */
    String jobType;
    
    /**
     * Business status of the job (not technical scheduler status).
     */
    BatchJobStatus businessStatus;
    
    /**
     * When the job started processing.
     */
    LocalDateTime startTime;
    
    /**
     * When the job completed (successfully or failed).
     */
    LocalDateTime endTime;
    
    /**
     * Number of records successfully processed.
     */
    @Builder.Default
    int recordsProcessed = 0;
    
    /**
     * Number of records that failed processing.
     */
    @Builder.Default
    int recordsFailed = 0;
    
    /**
     * Error message if the job failed.
     */
    String errorMessage;
}
