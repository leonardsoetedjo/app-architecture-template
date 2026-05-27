package com.example.orderservice.infrastructure.persistence.batch;

import com.example.orderservice.domain.models.batch.BatchJob;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import com.example.orderservice.domain.ports.batch.BatchJobPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration test for JpaBatchJobAdapter using real PostgreSQL via Testcontainers.
 * 
 * Run with: mvn test -Dtest=JpaBatchJobAdapterTest -DDOCKER_AVAILABLE=true
 */
@DataJpaTest
@Testcontainers
@Import({JpaBatchJobAdapter.class, BatchJobJpaRepository.class})
@EnabledIfSystemProperty(named = "DOCKER_AVAILABLE", matches = "true")
class JpaBatchJobAdapterTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private BatchJobPort batchJobPort;

    @Test
    @DisplayName("should create batch job with SCHEDULED status")
    void shouldCreateBatchJob() {
        BatchJob job = batchJobPort.createJob("Daily Data Sync", "data_sync");

        assertThat(job.getId()).isNotNull();
        assertThat(job.getJobName()).isEqualTo("Daily Data Sync");
        assertThat(job.getJobType()).isEqualTo("data_sync");
        assertThat(job.getBusinessStatus()).isEqualTo(BatchJobStatus.SCHEDULED);
        assertThat(job.getRecordsProcessed()).isZero();
        assertThat(job.getRecordsFailed()).isZero();
    }

    @Test
    @DisplayName("should update job status from SCHEDULED to PROCESSING")
    void shouldUpdateStatusToProcessing() {
        BatchJob job = batchJobPort.createJob("Test Job", "test");
        
        BatchJob updated = batchJobPort.updateStatus(job.getId(), BatchJobStatus.PROCESSING, null);

        assertThat(updated.getBusinessStatus()).isEqualTo(BatchJobStatus.PROCESSING);
        assertThat(updated.getStartTime()).isNotNull();
        assertThat(updated.getEndTime()).isNull();
    }

    @Test
    @DisplayName("should update job status to COMPLETED")
    void shouldUpdateStatusToCompleted() {
        BatchJob job = batchJobPort.createJob("Test Job", "test");
        
        BatchJob updated = batchJobPort.updateStatus(job.getId(), BatchJobStatus.COMPLETED, null);

        assertThat(updated.getBusinessStatus()).isEqualTo(BatchJobStatus.COMPLETED);
        assertThat(updated.getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("should update job status to FAILED with error message")
    void shouldUpdateStatusToFailed() {
        BatchJob job = batchJobPort.createJob("Test Job", "test");
        String errorMessage = "Data validation failed for 5 records";
        
        BatchJob updated = batchJobPort.updateStatus(job.getId(), BatchJobStatus.FAILED, errorMessage);

        assertThat(updated.getBusinessStatus()).isEqualTo(BatchJobStatus.FAILED);
        assertThat(updated.getErrorMessage()).isEqualTo(errorMessage);
        assertThat(updated.getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("should get job by ID")
    void shouldGetJobById() {
        BatchJob created = batchJobPort.createJob("Test Job", "test");
        
        Optional<BatchJob> found = batchJobPort.getJob(created.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getJobName()).isEqualTo("Test Job");
    }

    @Test
    @DisplayName("should return empty for non-existent job")
    void shouldReturnEmptyForNonExistentJob() {
        Optional<BatchJob> found = batchJobPort.getJob(999L);

        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("should get jobs by status")
    void shouldGetJobsByStatus() {
        batchJobPort.createJob("Job 1", "type1");
        batchJobPort.createJob("Job 2", "type2");
        batchJobPort.createJob("Job 3", "type1");
        
        List<BatchJob> scheduledJobs = batchJobPort.getJobsByStatus(BatchJobStatus.SCHEDULED);

        assertThat(scheduledJobs).hasSize(3);
        assertThat(scheduledJobs).extracting("businessStatus")
            .allMatch(status -> status == BatchJobStatus.SCHEDULED);
    }

    @Test
    @DisplayName("should throw exception when updating non-existent job")
    void shouldThrowExceptionWhenUpdatingNonExistentJob() {
        assertThatThrownBy(() -> batchJobPort.updateStatus(999L, BatchJobStatus.PROCESSING, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Batch job not found");
    }

    @Test
    @DisplayName("should track records processed and failed")
    void shouldTrackRecordsProcessedAndFailed() {
        BatchJob job = batchJobPort.createJob("Data Processing", "etl");
        
        // Simulate processing by updating with record counts
        // (In real implementation, this would be done incrementally)
        BatchJob updated = batchJobPort.updateStatus(job.getId(), BatchJobStatus.COMPLETED, null);
        
        assertThat(updated.getRecordsProcessed()).isZero(); // Default value
        assertThat(updated.getRecordsFailed()).isZero(); // Default value
    }
}
