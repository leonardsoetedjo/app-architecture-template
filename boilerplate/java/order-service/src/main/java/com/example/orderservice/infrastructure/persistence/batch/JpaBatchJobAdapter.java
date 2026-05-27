package com.example.orderservice.infrastructure.persistence.batch;

import com.example.orderservice.domain.models.batch.BatchJob;
import com.example.orderservice.domain.models.batch.BatchJobStatus;
import com.example.orderservice.domain.ports.batch.BatchJobPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * JPA adapter implementing the BatchJobPort interface.
 * 
 * This adapter translates between domain BatchJob entities and JPA entities,
 * maintaining Clean Architecture separation. The domain layer has no knowledge
 * of JPA or Spring.
 * 
 * @see BatchJobPort
 * @see BatchJobJpaEntity
 */
@Component
@RequiredArgsConstructor
public class JpaBatchJobAdapter implements BatchJobPort {
    
    private final BatchJobJpaRepository repository;
    
    @Override
    public BatchJob createJob(String jobName, String jobType) {
        BatchJobJpaEntity entity = BatchJobJpaEntity.builder()
            .jobName(jobName)
            .jobType(jobType)
            .businessStatus(BatchJobStatus.SCHEDULED)
            .recordsProcessed(0)
            .recordsFailed(0)
            .build();
        
        BatchJobJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }
    
    @Override
    public BatchJob updateStatus(Long jobId, BatchJobStatus status, String errorMessage) {
        BatchJobJpaEntity entity = repository.findById(jobId)
            .orElseThrow(() -> new IllegalArgumentException("Batch job not found with id: " + jobId));
        
        entity.setBusinessStatus(status);
        entity.setErrorMessage(errorMessage);
        
        if (status == BatchJobStatus.PROCESSING && entity.getStartTime() == null) {
            entity.setStartTime(LocalDateTime.now());
        }
        
        if (status == BatchJobStatus.COMPLETED || status == BatchJobStatus.FAILED || status == BatchJobStatus.CANCELLED) {
            entity.setEndTime(LocalDateTime.now());
        }
        
        BatchJobJpaEntity updated = repository.save(entity);
        return toDomain(updated);
    }
    
    @Override
    public Optional<BatchJob> getJob(Long jobId) {
        return repository.findById(jobId).map(this::toDomain);
    }
    
    @Override
    public List<BatchJob> getJobsByStatus(BatchJobStatus status) {
        return repository.findByBusinessStatus(status)
            .stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }
    
    /**
     * Map JPA entity to domain model.
     */
    private BatchJob toDomain(BatchJobJpaEntity entity) {
        return BatchJob.builder()
            .id(entity.getId())
            .jobName(entity.getJobName())
            .jobType(entity.getJobType())
            .businessStatus(entity.getBusinessStatus())
            .startTime(entity.getStartTime())
            .endTime(entity.getEndTime())
            .recordsProcessed(entity.getRecordsProcessed())
            .recordsFailed(entity.getRecordsFailed())
            .errorMessage(entity.getErrorMessage())
            .build();
    }
}
