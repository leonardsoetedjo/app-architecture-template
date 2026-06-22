package com.example.orderservice.infrastructure.scheduler.jobs;

import com.example.orderservice.infrastructure.services.batch.BatchJobService;
import com.example.orderservice.domain.models.batch.BatchJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

/**
 * Sample Quartz scheduled job demonstrating business status tracking.
 * 
 * This job runs every 5 minutes and creates/updates batch job records
 * to demonstrate the scheduling pattern.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SampleQuartzJob implements Job {
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SampleQuartzJob.class);
    
    private final BatchJobService batchJobService;
    
    @Override
    public void execute(JobExecutionContext context) {
        try {
            // Create job record
            log.info("Executing scheduled Quartz job");
            BatchJob job = batchJobService.startJob(1L);
            
            log.info("Scheduled job {} started", job.getId());
            
            // Simulate work
            Thread.sleep(2000);
            
            // Update to COMPLETED
            batchJobService.completeJob(job.getId(), 50, 0);
            log.info("Scheduled job {} completed successfully", job.getId());
            
        } catch (Exception e) {
            log.error("Scheduled job failed", e);
            // Update to FAILED if we have a job ID
            try {
                Long jobId = context.getMergedJobDataMap().getLong("jobId");
                batchJobService.failJob(jobId, e.getMessage());
            } catch (Exception ex) {
                log.error("Could not update job status to FAILED", ex);
            }
            throw new RuntimeException(e);
        }
    }
}
