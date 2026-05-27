# Spring Batch Implementation Guide

## Overview

This guide provides Clean Architecture-compliant patterns for implementing batch processing using Spring Batch in the Java boilerplate.

## Architecture

### Layer Responsibilities

**Domain Layer** (`domain/models/batch/`, `domain/ports/batch/`):
- Batch job entities (pure POJOs)
- Job configuration interfaces
- Chunk processing interfaces

**Application Layer** (`application/usecases/batch/`, `application/services/batch/`):
- Job configuration use cases
- Chunk processors
- Batch orchestration logic

**Infrastructure Layer** (`infrastructure/batch/`):
- Spring Batch configuration
- Tasklet implementations
- ItemReader/ItemProcessor/ItemWriter implementations
- Job launchers

## Implementation Steps

### 1. Add Dependencies

Already added to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-batch</artifactId>
</dependency>
```

### 2. Create Domain Layer

**File**: `domain/models/batch/BatchJob.java`
```java
package com.example.order.domain.models.batch;

import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;

/**
 * Domain entity representing a batch job execution.
 * Pure POJO - no Spring/Batch annotations.
 */
@Value
@Builder
public class BatchJob {
    String jobName;
    String jobType;
    LocalDateTime startTime;
    LocalDateTime endTime;
    JobStatus status;
    int recordsProcessed;
    int recordsFailed;
    
    public enum JobStatus {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED
    }
}
```

**File**: `domain/ports/batch/BatchJobPort.java`
```java
package com.example.order.domain.ports.batch;

import com.example.order.domain.models.batch.BatchJob;
import java.util.List;

/**
 * Interface for batch job operations.
 * Defined in domain layer for Clean Architecture.
 */
public interface BatchJobPort {
    BatchJob createJob(String jobName, String jobType);
    BatchJob updateJobStatus(Long jobId, BatchJob.JobStatus status);
    List<BatchJob> getJobsByStatus(BatchJob.JobStatus status);
    BatchJob getJobById(Long jobId);
}
```

### 3. Create Application Layer

**File**: `application/usecases/batch/ExecuteBatchJobUseCase.java`
```java
package com.example.order.application.usecases.batch;

/**
 * Use case interface for executing batch jobs.
 */
public interface ExecuteBatchJobUseCase {
    /**
     * Execute a batch job with the given parameters.
     * @param jobName the name of the job
     * @param parameters job parameters
     * @return job execution ID
     */
    Long execute(String jobName, JobParameters parameters);
    
    record JobParameters(
        String inputFile,
        String outputFile,
        int chunkSize
    ) {}
}
```

**File**: `application/services/batch/BatchJobExecutor.java`
```java
package com.example.order.application.services.batch;

import com.example.order.application.usecases.batch.ExecuteBatchJobUseCase;
import com.example.order.domain.ports.batch.BatchJobPort;
import com.example.order.domain.models.batch.BatchJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchJobExecutor implements ExecuteBatchJobUseCase {
    
    private final BatchJobPort batchJobPort;
    
    @Override
    @Transactional
    public Long execute(String jobName, JobParameters parameters) {
        log.info("Executing batch job: {} with parameters: {}", jobName, parameters);
        
        // Create job record
        BatchJob job = batchJobPort.createJob(jobName, "SAMPLE_JOB");
        
        // Execute job logic here
        // This would typically delegate to Spring Batch JobLauncher
        
        log.info("Batch job completed: {} records processed", job.recordsProcessed());
        
        return 1L; // Return job execution ID
    }
}
```

### 4. Create Infrastructure Layer

**File**: `infrastructure/batch/config/BatchConfig.java`
```java
package com.example.order.infrastructure.batch.config;

import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.support.DefaultBatchConfiguration;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Spring Batch configuration.
 * Infrastructure layer - can import Spring/Batch annotations.
 */
@Configuration
@EnableBatchProcessing
public class BatchConfig extends DefaultBatchConfiguration {
    
    private final DataSource batchDataSource;
    
    public BatchConfig(@Qualifier("batchDataSource") DataSource batchDataSource) {
        this.batchDataSource = batchDataSource;
    }
    
    @Bean
    public JobLauncher jobLauncher(JobRepository jobRepository) {
        JobLauncher launcher = new org.springframework.batch.core.launch.support.TaskExecutorJobLauncher();
        launcher.setJobRepository(jobRepository);
        return launcher;
    }
}
```

**File**: `infrastructure/batch/config/BatchDataSourceConfig.java`
```java
package com.example.order.infrastructure.batch.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class BatchDataSourceConfig {
    
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSource batchDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

### 5. Create Sample Tasklet

**File**: `infrastructure/batch/tasklets/SampleTasklet.java`
```java
package com.example.order.infrastructure.batch.tasklets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.stereotype.Component;

/**
 * Sample Tasklet implementation for simple batch operations.
 * Use Tasklets for operations that don't require chunk-oriented processing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SampleTasklet implements Tasklet {
    
    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
        log.info("Starting sample tasklet execution");
        
        try {
            // Your batch logic here
            processBatchData();
            
            log.info("Sample tasklet completed successfully");
            return RepeatStatus.FINISHED;
            
        } catch (Exception e) {
            log.error("Sample tasklet failed", e);
            throw e;
        }
    }
    
    private void processBatchData() {
        // Implementation here
        // This could be:
        // - File processing
        // - Database cleanup
        // - Email sending
        // - API calls
    }
}
```

### 6. Create Sample Chunk-Oriented Processing

**File**: `infrastructure/batch/config/SampleChunkConfig.java`
```java
package com.example.order.infrastructure.batch.config;

import com.example.order.domain.models.Order;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.JdbcCursorItemReader;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.batch.item.database.builder.JdbcCursorItemReaderBuilder;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

/**
 * Sample chunk-oriented processing configuration.
 * Use chunk processing for large datasets that need to be processed in batches.
 */
@Configuration
@RequiredArgsConstructor
public class SampleChunkConfig {
    
    private final JobRepository jobRepository;
    private final DataSource dataSource;
    
    @Bean
    public Step sampleChunkStep() {
        return jobRepository.getStep("sampleChunkStep")
            .<Order, Order>chunk(10, jobRepository)  // Process 10 records at a time
            .reader(sampleItemReader())
            .processor(sampleItemProcessor())
            .writer(sampleItemWriter())
            .build();
    }
    
    @Bean
    public ItemReader<Order> sampleItemReader() {
        return new JdbcCursorItemReaderBuilder<Order>()
            .name("sampleItemReader")
            .dataSource(dataSource)
            .sql("SELECT id, customer_id, total_amount, status FROM orders WHERE status = 'PENDING'")
            .rowMapper(this::mapRowToOrder)
            .build();
    }
    
    @Bean
    public ItemProcessor<Order, Order> sampleItemProcessor() {
        return order -> {
            // Transform or validate the order
            // Return null to filter out the item
            if (order.getTotalAmount() <= 0) {
                return null; // Filter out invalid orders
            }
            return order;
        };
    }
    
    @Bean
    public ItemWriter<Order> sampleItemWriter() {
        return new JdbcBatchItemWriter<Order>()
            .setDataSource(dataSource)
            .setSql("UPDATE orders SET status = :status WHERE id = :id")
            .setItemSqlParameterSourceProvider(
                new org.springframework.batch.item.database.BeanPropertyItemSqlParameterSourceProvider<>()
            )
            .build();
    }
    
    private Order mapRowToOrder(ResultSet rs, int rowNum) throws SQLException {
        return Order.builder()
            .id(rs.getLong("id"))
            .customerId(rs.getLong("customer_id"))
            .totalAmount(rs.getBigDecimal("total_amount"))
            .status(rs.getString("status"))
            .build();
    }
}
```

### 7. Create Sample Job Configuration

**File**: `infrastructure/batch/config/SampleJobConfig.java`
```java
package com.example.order.infrastructure.batch.config;

import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Sample Job configuration combining multiple steps.
 */
@Configuration
@RequiredArgsConstructor
public class SampleJobConfig {
    
    private final JobRepository jobRepository;
    private final Step sampleChunkStep;
    
    @Bean
    public Job sampleJob() {
        return new JobBuilder("sampleJob", jobRepository)
            .start(sampleChunkStep)
            .build();
    }
}
```

### 8. Testing

**File**: `src/test/java/com/example/order/infrastructure/batch/SampleBatchTest.java`
```java
package com.example.order.infrastructure.batch;

import org.junit.jupiter.api.Test;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.test.JobLauncherTestUtils;
import org.springframework.batch.test.context.SpringBatchTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBatchTest
@SpringBootTest
@TestPropertySource(properties = {
    "spring.batch.jdbc.initialize-schema=always"
})
class SampleBatchTest {
    
    @Autowired
    private JobLauncherTestUtils jobLauncherTestUtils;
    
    @Autowired
    private Job sampleJob;
    
    @Test
    void testSampleJobExecution() throws Exception {
        // Given
        JobParameters jobParameters = new JobParametersBuilder()
            .addLong("timestamp", System.currentTimeMillis())
            .toJobParameters();
        
        jobLauncherTestUtils.setJob(sampleJob);
        
        // When
        JobExecution jobExecution = jobLauncherTestUtils.launchJob(jobParameters);
        
        // Then
        assertThat(jobExecution.getStatus().isUnsuccessful()).isFalse();
    }
}
```

### 9. Configuration Properties

**File**: `src/main/resources/application-batch.yml`
```yaml
spring:
  batch:
    jdbc:
      initialize-schema: always  # Set to 'never' in production
    job:
      enabled: false  # Disable auto-start of all jobs
      
  datasource:
    url: jdbc:postgresql://localhost:5432/order_db
    username: app_user
    password: ${POSTGRES_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      
logging:
  level:
    org.springframework.batch: DEBUG
    com.example.order.batch: DEBUG
```

## Usage Examples

### Running a Job Programmatically

```java
@Service
@RequiredArgsConstructor
public class BatchJobScheduler {
    
    private final JobLauncher jobLauncher;
    private final Job sampleJob;
    
    @Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
    public void runSampleJob() {
        try {
            JobParameters params = new JobParametersBuilder()
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();
            
            JobExecution execution = jobLauncher.run(sampleJob, params);
            
            log.info("Job completed with status: {}", execution.getStatus());
        } catch (Exception e) {
            log.error("Job failed", e);
        }
    }
}
```

## Best Practices

1. **Chunk Size**: Start with chunk size of 10-100, tune based on memory and performance
2. **Transaction Management**: Each chunk runs in a transaction by default
3. **Error Handling**: Use skip/retry policies for transient failures
4. **Monitoring**: Use Spring Boot Actuator endpoints for job monitoring
5. **Testing**: Always test with `@SpringBatchTest` annotation
6. **Logging**: Log at chunk boundaries for progress tracking

## Common Patterns

### File Processing
```java
@Bean
public ItemReader<String> fileReader() {
    return new FlatFileItemReaderBuilder<String>()
        .name("fileReader")
        .resource(new FileSystemResource("input.csv"))
        .lineMapper(new DefaultLineMapper<>())
        .build();
}
```

### API Integration
```java
@Bean
public ItemReader<Order> apiReader() {
    return new CursorBasedItemReader<>() {
        // Implement cursor-based pagination for API calls
    };
}
```

### Parallel Processing
```java
@Bean
public Step parallelStep() {
    return jobRepository.getStep("parallelStep")
        .<Input, Output>chunk(10, jobRepository)
        .reader(reader())
        .processor(processor())
        .taskExecutor(new SimpleAsyncTaskExecutor())
        .throttleLimit(4)  // Max 4 concurrent threads
        .writer(writer())
        .build();
}
```

## Monitoring

### Actuator Endpoints
```bash
# Job executions
curl http://localhost:8080/actuator/metrics/batch.job.duration

# Step executions
curl http://localhost:8080/actuator/metrics/batch.step.duration
```

### Custom Health Indicator
```java
@Component
public class BatchHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        // Check if batch jobs are running smoothly
        return Health.up().build();
    }
}
```

## Next Steps

1. Implement actual business logic in tasklets/chunk processors
2. Add retry/skip policies for fault tolerance
3. Configure job notifications (email, Slack)
4. Set up monitoring dashboards
5. Add job scheduling with Quartz (see Issue #94)
