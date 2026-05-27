package com.example.orderservice.infrastructure.batch.tasklets;

import com.example.orderservice.application.services.batch.BatchJobService;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import com.example.orderservice.domain.ports.batch.BatchJobPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.chunk.ChunkContext;
import org.springframework.batch.core.repeat.RepeatStatus;
import org.springframework.batch.item.ExecutionContext;
import org.springframework.batch.core.StepExecution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SampleTasklet.
 */
@ExtendWith(MockitoExtension.class)
class SampleTaskletTest {

    @Mock
    private BatchJobService batchJobService;

    @Mock
    private StepContribution stepContribution;

    @Mock
    private ChunkContext chunkContext;

    @Mock
    private StepExecution stepExecution;

    @Mock
    private ExecutionContext executionContext;

    private SampleTasklet sampleTasklet;

    @BeforeEach
    void setUp() {
        sampleTasklet = new SampleTasklet(batchJobService);
        
        when(chunkContext.getStepContext()).thenReturn(mock(org.springframework.batch.core.StepContext.class));
        when(chunkContext.getStepContext().getStepExecution()).thenReturn(stepExecution);
        when(stepExecution.getExecutionContext()).thenReturn(executionContext);
    }

    @Test
    @DisplayName("should execute tasklet and update status to COMPLETED")
    void shouldExecuteSuccessfully() throws Exception {
        // Arrange
        BatchJobService mockService = mock(BatchJobService.class);
        SampleTasklet tasklet = new SampleTasklet(mockService);
        
        // Act
        RepeatStatus result = tasklet.execute(stepContribution, chunkContext);
        
        // Assert
        assertThat(result).isEqualTo(RepeatStatus.FINISHED);
        verify(mockService).startJob(anyLong());
        verify(mockService).completeJob(anyLong(), anyInt(), anyInt());
        verify(mockService, never()).failJob(anyLong(), anyString());
    }

    @Test
    @DisplayName("should update status to FAILED on exception")
    void shouldFailOnException() {
        // Arrange
        BatchJobService mockService = mock(BatchJobService.class);
        doThrow(new RuntimeException("Test error"))
            .when(mockService).startJob(anyLong());
        
        SampleTasklet tasklet = new SampleTasklet(mockService);
        
        // Act & Assert
        assertThatThrownBy(() -> tasklet.execute(stepContribution, chunkContext))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("Test error");
        
        verify(mockService).startJob(anyLong());
        verify(mockService).failJob(anyLong(), eq("Test error"));
    }

    @Test
    @DisplayName("should store results in execution context")
    void shouldStoreResultsInExecutionContext() throws Exception {
        // Arrange
        BatchJobService mockService = mock(BatchJobService.class);
        SampleTasklet tasklet = new SampleTasklet(mockService);
        
        // Act
        tasklet.execute(stepContribution, chunkContext);
        
        // Assert
        verify(executionContext, atLeastOnce()).putInt(anyString(), anyInt());
    }
}
