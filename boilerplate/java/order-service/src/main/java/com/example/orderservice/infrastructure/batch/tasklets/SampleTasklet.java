package com.example.orderservice.infrastructure.batch.tasklets;

import com.example.orderservice.application.services.batch.BatchJobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.chunk.ChunkContext;
import org.springframework.batch.core.repeat.RepeatStatus;
import org.springframework.batch.item.ExecutionContext;
import org.springframework.stereotype.Component;

/**
 * Sample Spring Batch Tasklet demonstrating business status tracking.
 * 
 * This tasklet updates the batch job status through its lifecycle:
 * SCHEDULED → PROCESSING → COMPLETED (or FAILED on error)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SampleTasklet implements org.springframework.batch.core.Tasklet {
    
    private final BatchJobService batchJobService;
    
    /**
     * Job ID parameter - in production would come from job parameters.
     */
    private final Long jobId = 1L;
    
    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        ExecutionContext executionContext = chunkContext.getStepContext().getStepExecution().getExecutionContext();
        
        try {
            // Update to PROCESSING
            log.info("Starting batch job {} - updating status to PROCESSING", jobId);
            batchJobService.startJob(jobId);
            
            // Simple batch logic: simulate processing
            log.info("Executing sample batch job - processing data...");
            int recordsProcessed = 100;
            int recordsFailed = 5;
            
            // Simulate processing time
            Thread.sleep(1000);
            
            // Update to COMPLETED
            log.info("Batch job {} completed - {} records processed, {} failed", 
                jobId, recordsProcessed, recordsFailed);
            batchJobService.completeJob(jobId, recordsProcessed, recordsFailed);
            
            // Store results in execution context
            executionContext.putInt("recordsProcessed", recordsProcessed);
            executionContext.putInt("recordsFailed", recordsFailed);
            
            return RepeatStatus.FINISHED;
            
        } catch (Exception e) {
            // Update to FAILED
            log.error("Batch job {} failed with error: {}", jobId, e.getMessage(), e);
            batchJobService.failJob(jobId, e.getMessage());
            
            // Store error in execution context
            executionContext.putString("errorMessage", e.getMessage());
            
            throw e;
        }
    }
}
