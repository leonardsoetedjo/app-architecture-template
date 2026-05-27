package com.example.orderservice.infrastructure.persistence.batch;

import com.example.orderservice.domain.models.batch.BatchJobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for batch job persistence.
 * 
 * This repository extends JpaRepository to provide CRUD operations
 * and custom query methods for batch jobs.
 */
@Repository
public interface BatchJobJpaRepository extends JpaRepository<BatchJobJpaEntity, Long> {
    
    /**
     * Find all jobs with a specific business status.
     * 
     * @param status the business status to filter by
     * @return list of jobs with the specified status
     */
    List<BatchJobJpaEntity> findByBusinessStatus(BatchJobStatus status);
}
