package com.example.orderservice.domain.models.batch;

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
public class BatchJob {

    private final Long id;
    private final String jobName;
    private final String jobType;
    private final BatchJobStatus businessStatus;
    private final LocalDateTime startTime;
    private final LocalDateTime endTime;
    private final int recordsProcessed;
    private final int recordsFailed;
    private final String errorMessage;

    private BatchJob(Builder builder) {
        this.id = builder.id;
        this.jobName = builder.jobName;
        this.jobType = builder.jobType;
        this.businessStatus = builder.businessStatus;
        this.startTime = builder.startTime;
        this.endTime = builder.endTime;
        this.recordsProcessed = builder.recordsProcessed;
        this.recordsFailed = builder.recordsFailed;
        this.errorMessage = builder.errorMessage;
    }

    public static Builder builder() {
        return new Builder();
    }

    // --- Getters ---

    public Long getId() { return id; }
    public String getJobName() { return jobName; }
    public String getJobType() { return jobType; }
    public BatchJobStatus getBusinessStatus() { return businessStatus; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public int getRecordsProcessed() { return recordsProcessed; }
    public int getRecordsFailed() { return recordsFailed; }
    public String getErrorMessage() { return errorMessage; }

    /**
     * Fluent builder for constructing immutable BatchJob instances.
     */
    public static class Builder {
        private Long id;
        private String jobName;
        private String jobType;
        private BatchJobStatus businessStatus;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private int recordsProcessed = 0;
        private int recordsFailed = 0;
        private String errorMessage;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder jobName(String jobName) {
            this.jobName = jobName;
            return this;
        }

        public Builder jobType(String jobType) {
            this.jobType = jobType;
            return this;
        }

        public Builder businessStatus(BatchJobStatus businessStatus) {
            this.businessStatus = businessStatus;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalDateTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder recordsProcessed(int recordsProcessed) {
            this.recordsProcessed = recordsProcessed;
            return this;
        }

        public Builder recordsFailed(int recordsFailed) {
            this.recordsFailed = recordsFailed;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        public BatchJob build() {
            return new BatchJob(this);
        }
    }
}
