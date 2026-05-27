package com.example.orderservice.domain.models.batch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BatchJobStatus enum.
 */
@DisplayName("BatchJobStatus enum")
class BatchJobStatusTest {
    
    @Test
    @DisplayName("should have exactly 5 status values")
    void shouldHaveFiveStatusValues() {
        BatchJobStatus[] values = BatchJobStatus.values();
        
        assertThat(values).hasSize(5);
        assertThat(values).containsExactly(
            BatchJobStatus.SCHEDULED,
            BatchJobStatus.PROCESSING,
            BatchJobStatus.COMPLETED,
            BatchJobStatus.FAILED,
            BatchJobStatus.CANCELLED
        );
    }
    
    @Test
    @DisplayName("should be usable in switch statements")
    void shouldBeUsableInSwitch() {
        BatchJobStatus status = BatchJobStatus.COMPLETED;
        
        String result = switch (status) {
            case SCHEDULED -> "Job is scheduled";
            case PROCESSING -> "Job is processing";
            case COMPLETED -> "Job completed successfully";
            case FAILED -> "Job failed";
            case CANCELLED -> "Job was cancelled";
        };
        
        assertThat(result).isEqualTo("Job completed successfully");
    }
    
    @Test
    @DisplayName("should allow value comparison")
    void shouldAllowValueComparison() {
        assertThat(BatchJobStatus.COMPLETED)
            .isNotEqualTo(BatchJobStatus.FAILED);
        
        assertThat(BatchJobStatus.SCHEDULED)
            .isEqualTo(BatchJobStatus.SCHEDULED);
    }
}
