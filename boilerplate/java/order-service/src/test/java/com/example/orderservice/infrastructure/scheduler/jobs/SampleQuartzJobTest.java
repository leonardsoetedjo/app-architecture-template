package com.example.orderservice.infrastructure.scheduler.jobs;

import com.example.orderservice.application.services.batch.BatchJobService;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.spi.TriggerFiredBundle;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SampleQuartzJob.
 */
@ExtendWith(MockitoExtension.class)
class SampleQuartzJobTest {

    @Mock
    private BatchJobService batchJobService;

    @Mock
    private JobExecutionContext jobExecutionContext;

    private SampleQuartzJob sampleQuartzJob;

    @BeforeEach
    void setUp() {
        sampleQuartzJob = new SampleQuartzJob(batchJobService);
    }

    @Test
    @DisplayName("should execute job successfully")
    void shouldExecuteSuccessfully() throws Exception {
        // Arrange
        BatchJobService mockService = mock(BatchJobService.class);
        SampleQuartzJob job = new SampleQuartzJob(mockService);
        
        // Act
        job.execute(jobExecutionContext);
        
        // Assert
        verify(mockService).startJob(anyLong());
        verify(mockService).completeJob(anyLong(), eq(50), eq(0));
    }

    @Test
    @DisplayName("should update to FAILED on exception")
    void shouldFailOnException() {
        // Arrange
        BatchJobService mockService = mock(BatchJobService.class);
        doThrow(new RuntimeException("Test error"))
            .when(mockService).startJob(anyLong());
        
        SampleQuartzJob job = new SampleQuartzJob(mockService);
        
        // Act & Assert
        assertThatThrownBy(() -> job.execute(jobExecutionContext))
            .isInstanceOf(JobExecutionException.class);
        
        verify(mockService).startJob(anyLong());
    }
}
