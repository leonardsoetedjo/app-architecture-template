package com.example.orderservice.application.services.batch;

import com.example.orderservice.domain.models.batch.BatchJob;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import com.example.orderservice.domain.ports.batch.BatchJobPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BatchJobService.
 */
@ExtendWith(MockitoExtension.class)
class BatchJobServiceTest {

    @Mock
    private BatchJobPort batchJobPort;

    private BatchJobService batchJobService;

    @BeforeEach
    void setUp() {
        batchJobService = new BatchJobService(batchJobPort);
    }

    @Test
    @DisplayName("should start job by updating status to PROCESSING")
    void shouldStartJob() {
        Long jobId = 1L;
        BatchJob mockJob = createMockJob(jobId, BatchJobStatus.PROCESSING);
        
        when(batchJobPort.updateStatus(eq(jobId), eq(BatchJobStatus.PROCESSING), isNull()))
            .thenReturn(mockJob);
        
        BatchJob result = batchJobService.startJob(jobId);
        
        assertThat(result.getBusinessStatus()).isEqualTo(BatchJobStatus.PROCESSING);
        verify(batchJobPort).updateStatus(jobId, BatchJobStatus.PROCESSING, null);
    }

    @Test
    @DisplayName("should complete job with metrics")
    void shouldCompleteJob() {
        Long jobId = 1L;
        int recordsProcessed = 100;
        int recordsFailed = 5;
        BatchJob mockJob = createMockJob(jobId, BatchJobStatus.COMPLETED);
        
        when(batchJobPort.updateStatus(eq(jobId), eq(BatchJobStatus.COMPLETED), isNull()))
            .thenReturn(mockJob);
        
        BatchJob result = batchJobService.completeJob(jobId, recordsProcessed, recordsFailed);
        
        assertThat(result.getBusinessStatus()).isEqualTo(BatchJobStatus.COMPLETED);
        verify(batchJobPort).updateStatus(jobId, BatchJobStatus.COMPLETED, null);
    }

    @Test
    @DisplayName("should fail job with error message")
    void shouldFailJob() {
        Long jobId = 1L;
        String errorMessage = "Data validation failed";
        BatchJob mockJob = createMockJob(jobId, BatchJobStatus.FAILED);
        
        when(batchJobPort.updateStatus(eq(jobId), eq(BatchJobStatus.FAILED), eq(errorMessage)))
            .thenReturn(mockJob);
        
        BatchJob result = batchJobService.failJob(jobId, errorMessage);
        
        assertThat(result.getBusinessStatus()).isEqualTo(BatchJobStatus.FAILED);
        verify(batchJobPort).updateStatus(jobId, BatchJobStatus.FAILED, errorMessage);
    }

    @Test
    @DisplayName("should cancel job")
    void shouldCancelJob() {
        Long jobId = 1L;
        BatchJob mockJob = createMockJob(jobId, BatchJobStatus.CANCELLED);
        
        when(batchJobPort.updateStatus(eq(jobId), eq(BatchJobStatus.CANCELLED), isNull()))
            .thenReturn(mockJob);
        
        BatchJob result = batchJobService.cancelJob(jobId);
        
        assertThat(result.getBusinessStatus()).isEqualTo(BatchJobStatus.CANCELLED);
        verify(batchJobPort).updateStatus(jobId, BatchJobStatus.CANCELLED, null);
    }

    private BatchJob createMockJob(Long id, BatchJobStatus status) {
        return BatchJob.builder()
            .id(id)
            .jobName("Test Job")
            .jobType("test")
            .businessStatus(status)
            .recordsProcessed(0)
            .recordsFailed(0)
            .build();
    }
}
