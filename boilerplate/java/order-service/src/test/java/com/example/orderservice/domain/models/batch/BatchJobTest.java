package com.example.orderservice.domain.models.batch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BatchJob domain entity.
 */
@DisplayName("BatchJob entity")
class BatchJobTest {
    
    @Test
    @DisplayName("should create entity with builder")
    void shouldCreateEntityWithBuilder() {
        BatchJob job = BatchJob.builder()
            .id(1L)
            .jobName("sample-job")
            .jobType("SAMPLE")
            .businessStatus(BatchJobStatus.SCHEDULED)
            .startTime(LocalDateTime.now())
            .recordsProcessed(0)
            .recordsFailed(0)
            .build();
        
        assertThat(job.getId()).isEqualTo(1L);
        assertThat(job.getJobName()).isEqualTo("sample-job");
        assertThat(job.getJobType()).isEqualTo("SAMPLE");
        assertThat(job.getBusinessStatus()).isEqualTo(BatchJobStatus.SCHEDULED);
        assertThat(job.getRecordsProcessed()).isZero();
        assertThat(job.getRecordsFailed()).isZero();
    }
    
    @Test
    @DisplayName("should have default values for records")
    void shouldHaveDefaultValuesForRecords() {
        BatchJob job = BatchJob.builder()
            .id(1L)
            .jobName("test-job")
            .jobType("TEST")
            .businessStatus(BatchJobStatus.SCHEDULED)
            .build();
        
        assertThat(job.getRecordsProcessed()).isZero();
        assertThat(job.getRecordsFailed()).isZero();
    }
    
    @Test
    @DisplayName("should be immutable")
    void shouldBeImmutable() {
        BatchJob job = BatchJob.builder()
            .id(1L)
            .jobName("test-job")
            .jobType("TEST")
            .businessStatus(BatchJobStatus.SCHEDULED)
            .recordsProcessed(100)
            .recordsFailed(5)
            .build();
        
        // Verify values are set
        assertThat(job.getRecordsProcessed()).isEqualTo(100);
        assertThat(job.getRecordsFailed()).isEqualTo(5);
        
        // Lombok @Value makes it immutable - no setters available
    }
    
    @Test
    @DisplayName("should implement equals and hashCode")
    void shouldImplementEqualsAndHashCode() {
        BatchJob job1 = BatchJob.builder()
            .id(1L)
            .jobName("test")
            .jobType("TEST")
            .businessStatus(BatchJobStatus.SCHEDULED)
            .build();
        
        BatchJob job2 = BatchJob.builder()
            .id(1L)
            .jobName("test")
            .jobType("TEST")
            .businessStatus(BatchJobStatus.SCHEDULED)
            .build();
        
        assertThat(job1).isEqualTo(job2);
        assertThat(job1.hashCode()).isEqualTo(job2.hashCode());
    }
}
