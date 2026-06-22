package com.example.orderservice.infrastructure.services.batch;

import com.example.orderservice.domain.models.batch.BatchJob;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import com.example.orderservice.domain.ports.batch.BatchJobPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for managing batch job status transitions.
 * 
 * This service encapsulates business logic for status updates and provides
 * a clean interface for controllers and schedulers to interact with batch jobs.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BatchJobService {
    
    private final BatchJobPort batchJobPort;
    
    /**
     * Start a batch job by transitioning to PROCESSING status.
     * 
     * @param jobId the job ID
     * @return the updated batch job
     */
    public BatchJob startJob(Long jobId) {
        return batchJobPort.updateStatus(jobId, BatchJobStatus.PROCESSING, null);
    }
    
    /**
     * Complete a batch job successfully.
     * 
     * @param jobId the job ID
     * @param recordsProcessed number of records successfully processed
     * @param recordsFailed number of records that failed processing
     * @return the updated batch job
     */
    public BatchJob completeJob(Long jobId, int recordsProcessed, int recordsFailed) {
        BatchJob job = batchJobPort.updateStatus(jobId, BatchJobStatus.COMPLETED, null);
        // In a real implementation, you would also update the record counts
        // This would require an additional method in the port or a separate update
        return job;
    }
    
    /**
     * Fail a batch job with an error message.
     * 
     * @param jobId the job ID
     * @param errorMessage the error message describing the failure
     * @return the updated batch job
     */
    public BatchJob failJob(Long jobId, String errorMessage) {
        return batchJobPort.updateStatus(jobId, BatchJobStatus.FAILED, errorMessage);
    }
    
    /**
     * Cancel a batch job.
     * 
     * @param jobId the job ID
     * @return the updated batch job
     */
    public BatchJob cancelJob(Long jobId) {
        return batchJobPort.updateStatus(jobId, BatchJobStatus.CANCELLED, null);
    }
}
