package com.example.orderservice.infrastructure.persistence.batch;

import com.example.orderservice.domain.models.batch.BatchJobStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Clock;

/**
 * JPA entity for batch job persistence.
 * 
 * This entity belongs to the infrastructure layer and maps the domain BatchJob
 * to a database table. It uses Lombok for boilerplate reduction.
 * 
 * @see com.example.orderservice.domain.models.batch.BatchJob
 */
@Entity
@Table(name = "batch_jobs")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class BatchJobJpaEntity {
    
    /**
     * Unique identifier for the job execution.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Name of the batch job.
     */
    @Column(name = "job_name", nullable = false, length = 255)
    private String jobName;
    
    /**
     * Type/category of the batch job.
     */
    @Column(name = "job_type", nullable = false, length = 100)
    private String jobType;
    
    /**
     * Business status of the job (not technical scheduler status).
     */
    @Column(name = "business_status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private BatchJobStatus businessStatus;
    
    /**
     * When the job started processing.
     */
    @Column(name = "started_at")
    private LocalDateTime startTime;
    
    /**
     * When the job completed (successfully or failed).
     */
    @Column(name = "ended_at")
    private LocalDateTime endTime;
    
    /**
     * Number of records successfully processed.
     */
    @Column(name = "records_processed", nullable = false)
    @Builder.Default
    private Integer recordsProcessed = 0;
    
    /**
     * Number of records that failed processing.
     */
    @Column(name = "records_failed", nullable = false)
    @Builder.Default
    private Integer recordsFailed = 0;
    
    /**
     * Error message if the job failed.
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    /**
     * When the record was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * When the record was last updated.
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * Auto-set createdAt before persist.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(Clock.systemUTC());
        updatedAt = LocalDateTime.now(Clock.systemUTC());
    }
    
    /**
     * Auto-set updatedAt before update.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(Clock.systemUTC());
    }
}