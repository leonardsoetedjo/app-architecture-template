# Quartz Scheduler Implementation Guide

## Overview

This guide provides Clean Architecture-compliant patterns for implementing cron-based job scheduling using Quartz Scheduler in the Java boilerplate.

**⚠️ IMPORTANT:** Before implementing scheduled jobs, read the [Batch Job Status Architecture](../../../docs/01-agnostic/01-standards/batch-job-status-architecture.md) to understand the critical distinction between:
- **Business batch statuses** (Domain layer) - COMPLETED, FAILED, PARTIALLY_COMPLETED, etc.
- **Scheduler technical statuses** (Infrastructure layer) - Quartz TriggerState (NORMAL, PAUSED, ERROR, etc.)

**Never mix these concerns!** Business statuses track what happened to the data; scheduler statuses track technical execution.

## Architecture

### Layer Responsibilities

**Domain Layer** (`domain/models/scheduler/`, `domain/ports/scheduler/`):
- Scheduled job entities (pure POJOs)
- Job definition interfaces
- Trigger configuration interfaces

**Application Layer** (`application/usecases/scheduler/`, `application/services/scheduler/`):
- Job scheduling use cases
- Job execution services
- Scheduler management

**Infrastructure Layer** (`infrastructure/scheduler/`):
- Quartz configuration
- Job implementations (Quartz Job classes)
- Trigger configurations
- Scheduler service

## Implementation Steps

### 1. Add Dependencies

Add to `pom.xml`:

```xml
<!-- Quartz Scheduler -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

### 1.5. ⚠️ CRITICAL: Parameter Externalization

**IMPORTANT**: Externalize ALL configuration parameters to maximize flexibility and reduce code changes.

**DO NOT hardcode these values:**

| Parameter | Externalize To | Example |
|-----------|---------------|---------|
| Cron expressions | `application-quartz.yml` | `quartz.job.cron.sample=0 0 0 * * ?` |
| Job names | `application-quartz.yml` | `quartz.job.name.sample=SampleJob` |
| Job groups | `application-quartz.yml` | `quartz.job.group.sample=DEFAULT` |
| Thread pool size | `application-quartz.yml` | `quartz.thread.pool.size=10` |
| Retry counts | `application-quartz.yml` | `quartz.retry.count=3` |
| Misfire instructions | `application-quartz.yml` | `quartz.misfire.policy=DO_NOTHING` |
| Job data map values | `application-quartz.yml` | `quartz.job.data.key=value` |
| Cluster settings | `application-quartz.yml` | `quartz.clustered=true` |

**Recommended Configuration Pattern:**

```yaml
# application-quartz.yml
quartz:
  jobs:
    sample-job:
      name: SampleQuartzJob
      group: DEFAULT
      cron: "0 0 0 * * ?"
      description: "Daily batch processing job"
      enabled: true
      data:
        inputFile: ${INPUT_PATH:/data/input}
        outputFile: ${OUTPUT_PATH:/data/output}
        batchSize: ${BATCH_SIZE:1000}
  thread-pool:
    size: 10
    priority: 5
  job-store:
    type: jdbc  # or 'memory' for dev
    clustered: false
    misfire-threshold: 60000  # 1 minute
  retry:
    count: 3
    delay-ms: 5000
```

**Java Config with Externalized Parameters:**

```java
@Value("${quartz.jobs.sample-job.cron}")
private String cronExpression;

@Value("${quartz.jobs.sample-job.data.batchSize:1000}")
private int batchSize;

@Value("${quartz.jobs.sample-job.data.inputPath:/data/input}")
private String inputPath;

@Bean
public JobDetail sampleJobDetail() {
    return JobBuilder.newJob(SampleQuartzJob.class)
        .withIdentity(jobName, jobGroup)  // Externalized
        .usingJobData("batchSize", batchSize)  // Externalized
        .usingJobData("inputPath", inputPath)  // Externalized
        .storeDurably()
        .build();
}

@Bean
public Trigger sampleTrigger(JobDetail sampleJobDetail) {
    return TriggerBuilder.newTrigger()
        .forJob(sampleJobDetail)
        .withSchedule(
            CronScheduleBuilder.cronSchedule(cronExpression)  // Externalized
                .withMisfireHandlingInstructionDoNothing()
        )
        .build();
}
```

**Environment-Specific Overrides:**

```yaml
# application-dev.yml
quartz:
  jobs:
    sample-job:
      cron: "0 */2 * * * ?"  # Every 2 hours in dev
      data:
        batchSize: 10  # Small batches for testing
  thread-pool:
    size: 2  # Minimal threads in dev

# application-prod.yml
quartz:
  jobs:
    sample-job:
      cron: "0 0 0 * * ?"  # Daily at midnight in prod
      data:
        batchSize: 5000  # Large batches for prod
  thread-pool:
    size: 20  # Max threads for prod
  job-store:
    clustered: true  # HA in prod
```

**Benefits:**
1. ✅ No code changes for schedule adjustments
2. ✅ Environment-specific configuration (dev/staging/prod)
3. ✅ Runtime adjustments via config refresh
4. ✅ Security: Secrets in environment variables
5. ✅ Audit trail: Schedule changes tracked in config
6. ✅ Flexibility: Easy to add/modify jobs

### 2. Create Domain Layer

**File**: `domain/models/scheduler/ScheduledJob.java`
```java
package com.example.order.domain.models.scheduler;

import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;

/**
 * Domain entity representing a scheduled job.
 * Pure POJO - no Quartz/Spring annotations.
 */
@Value
@Builder
public class ScheduledJob {
    String jobName;
    String jobGroup;
    String cronExpression;
    String description;
    JobStatus status;
    LocalDateTime nextFireTime;
    LocalDateTime lastFireTime;
    LocalDateTime created_at;
    
    public enum JobStatus {
        ACTIVE,
        PAUSED,
        COMPLETE,
        ERROR,
        BLOCKED
    }
}
```

**File**: `domain/ports/scheduler/SchedulerPort.java`
```java
package com.example.order.domain.ports.scheduler;

import com.example.order.domain.models.scheduler.ScheduledJob;
import java.util.List;
import java.util.Optional;

/**
 * Interface for scheduler operations.
 * Defined in domain layer for Clean Architecture.
 */
public interface SchedulerPort {
    ScheduledJob scheduleJob(String jobName, String cronExpression, String description);
    void pauseJob(String jobName, String jobGroup);
    void resumeJob(String jobName, String jobGroup);
    void unscheduleJob(String jobName, String jobGroup);
    Optional<ScheduledJob> getJob(String jobName, String jobGroup);
    List<ScheduledJob> getAllJobs();
    List<ScheduledJob> getJobsByStatus(ScheduledJob.JobStatus status);
}
```

### 3. Create Application Layer

**File**: `application/usecases/scheduler/ScheduleJobUseCase.java`
```java
package com.example.order.application.usecases.scheduler;

/**
 * Use case interface for scheduling jobs.
 */
public interface ScheduleJobUseCase {
    /**
     * Schedule a job with the given configuration.
     * @param jobName the name of the job
     * @param cronExpression cron expression for scheduling
     * @param parameters job parameters
     * @return job execution ID
     */
    JobScheduleResult schedule(String jobName, String cronExpression, JobParameters parameters);
    
    record JobParameters(
        String inputData,
        String targetService
    ) {}
    
    record JobScheduleResult(
        String jobName,
        String jobGroup,
        boolean scheduled
    ) {}
}
```

**File**: `application/services/scheduler/JobSchedulerService.java`
```java
package com.example.order.application.services.scheduler;

import com.example.order.application.usecases.scheduler.ScheduleJobUseCase;
import com.example.order.domain.ports.scheduler.SchedulerPort;
import com.example.order.domain.models.scheduler.ScheduledJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobSchedulerService implements ScheduleJobUseCase {
    
    private final SchedulerPort schedulerPort;
    
    @Override
    @Transactional
    public JobScheduleResult schedule(String jobName, String cronExpression, JobParameters parameters) {
        log.info("Scheduling job: {} with cron: {}", jobName, cronExpression);
        
        try {
            // Create scheduled job record
            ScheduledJob job = schedulerPort.scheduleJob(
                jobName,
                cronExpression,
                "Scheduled job: " + jobName
            );
            
            log.info("Job scheduled successfully: {}", jobName);
            
            return new JobScheduleResult(jobName, "DEFAULT", true);
            
        } catch (Exception e) {
            log.error("Failed to schedule job: {}", jobName, e);
            throw e;
        }
    }
}
```

### 4. Create Infrastructure Layer - Quartz Configuration

**File**: `infrastructure/scheduler/config/QuartzConfig.java`
```java
package com.example.order.infrastructure.scheduler.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

import javax.sql.DataSource;
import java.util.Properties;

/**
 * Quartz Scheduler configuration.
 * Infrastructure layer - can import Quartz/Spring annotations.
 */
@Configuration
public class QuartzConfig {
    
    @Bean
    public SchedulerFactoryBean schedulerFactoryBean(DataSource dataSource) {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        
        // Configure Quartz properties
        Properties quartzProperties = new Properties();
        quartzProperties.put("org.quartz.scheduler.instanceName", "OrderServiceScheduler");
        quartzProperties.put("org.quartz.scheduler.instanceId", "AUTO");
        
        // JobStore configuration (JDBC for persistence)
        quartzProperties.put("org.quartz.jobStore.class", "org.springframework.scheduling.quartz.LocalDataSourceJobStore");
        quartzProperties.put("org.quartz.jobStore.driverDelegateClass", "org.quartz.impl.jdbcjobstore.PostgreSQLDelegate");
        quartzProperties.put("org.quartz.jobStore.dataSource", "quartzDataSource");
        quartzProperties.put("org.quartz.jobStore.tablePrefix", "QRTZ_");
        quartzProperties.put("org.quartz.jobStore.isClustered", "false");
        
        // Thread pool configuration
        quartzProperties.put("org.quartz.threadPool.class", "org.quartz.simpl.SimpleThreadPool");
        quartzProperties.put("org.quartz.threadPool.threadCount", "10");
        quartzProperties.put("org.quartz.threadPool.threadPriority", "5");
        
        factory.setQuartzProperties(quartzProperties);
        factory.setDataSource(dataSource);
        factory.setApplicationContextSchedulerContextKey("applicationContext");
        factory.setOverwriteExistingJobs(true);
        factory.setWaitForJobsToCompleteOnShutdown(true);
        
        return factory;
    }
}
```

**File**: `infrastructure/scheduler/config/QuartzDataSourceConfig.java`
```java
package com.example.order.infrastructure.scheduler.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class QuartzDataSourceConfig {
    
    @Bean(name = "quartzDataSource")
    @ConfigurationProperties("spring.datasource")
    public DataSource quartzDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

### 5. Create Sample Quartz Job

**File**: `infrastructure/scheduler/jobs/SampleQuartzJob.java`
```java
package com.example.order.infrastructure.scheduler.jobs;

import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

/**
 * Sample Quartz Job implementation.
 * Use Jobs for scheduled task execution.
 */
@Component
@Slf4j
public class SampleQuartzJob implements Job {
    
    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("Executing scheduled job: {}", context.getJobDetail().getKey());
        
        try {
            // Get job parameters
            String jobData = context.getMergedJobDataMap().getString("jobData");
            
            // Execute scheduled task
            executeScheduledTask(jobData);
            
            log.info("Scheduled job completed: {}", context.getJobDetail().getKey());
            
        } catch (Exception e) {
            log.error("Scheduled job failed: {}", context.getJobDetail().getKey(), e);
            throw new JobExecutionException(e);
        }
    }
    
    private void executeScheduledTask(String jobData) {
        // Implementation here
        // This could be:
        // - Daily report generation
        // - Data cleanup
        // - Scheduled API calls
        // - Batch processing trigger
        log.info("Processing job data: {}", jobData);
    }
}
```

### 6. Create Job Configuration

**File**: `infrastructure/scheduler/config/SampleJobConfig.java`
```java
package com.example.order.infrastructure.scheduler.config;

import com.example.order.infrastructure.scheduler.jobs.SampleQuartzJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Sample Job and Trigger configuration.
 */
@Configuration
public class SampleJobConfig {
    
    /**
     * JobDetail defines the job identity and metadata.
     */
    @Bean
    public JobDetail sampleJobDetail() {
        return JobBuilder.newJob(SampleQuartzJob.class)
            .withIdentity("sampleJob", "DEFAULT")
            .withDescription("Sample scheduled job - runs hourly")
            .storeDurably()
            .build();
    }
    
    /**
     * Trigger defines when the job should run.
     * Cron expression: 0 0 * * * ? = Every hour at minute 0
     */
    @Bean
    public Trigger sampleTrigger(JobDetail sampleJobDetail) {
        return TriggerBuilder.newTrigger()
            .forJob(sampleJobDetail)
            .withIdentity("sampleTrigger", "DEFAULT")
            .withSchedule(
                CronScheduleBuilder.cronSchedule("0 0 * * * ?")
                    .withMisfireHandlingInstructionDoNothing()
            )
            .build();
    }
}
```

### 7. Create Scheduler Service

**File**: `infrastructure/scheduler/service/QuartzSchedulerService.java`
```java
package com.example.order.infrastructure.scheduler.service;

import com.example.order.domain.models.scheduler.ScheduledJob;
import com.example.order.domain.ports.scheduler.SchedulerPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuartzSchedulerService implements SchedulerPort {
    
    private final Scheduler scheduler;
    
    @Override
    public ScheduledJob scheduleJob(String jobName, String cronExpression, String description) {
        try {
            // Create job detail
            JobDetail jobDetail = JobBuilder.newJob()
                .ofType(SampleQuartzJob.class)
                .withIdentity(jobName, "DEFAULT")
                .withDescription(description)
                .storeDurably()
                .build();
            
            // Create trigger
            Trigger trigger = TriggerBuilder.newTrigger()
                .forJob(jobDetail)
                .withIdentity(jobName + "_trigger", "DEFAULT")
                .withSchedule(
                    CronScheduleBuilder.cronSchedule(cronExpression)
                        .withMisfireHandlingInstructionDoNothing()
                )
                .build();
            
            // Schedule the job
            scheduler.scheduleJob(jobDetail, trigger);
            
            log.info("Job scheduled: {} with cron: {}", jobName, cronExpression);
            
            return ScheduledJob.builder()
                .jobName(jobName)
                .jobGroup("DEFAULT")
                .cronExpression(cronExpression)
                .description(description)
                .status(ScheduledJob.JobStatus.ACTIVE)
                .created_at(LocalDateTime.now())
                .build();
                
        } catch (SchedulerException e) {
            log.error("Failed to schedule job: {}", jobName, e);
            throw new RuntimeException("Failed to schedule job", e);
        }
    }
    
    @Override
    public void pauseJob(String jobName, String jobGroup) {
        try {
            JobKey jobKey = new JobKey(jobName, jobGroup);
            scheduler.pauseJob(jobKey);
            log.info("Job paused: {}", jobName);
        } catch (SchedulerException e) {
            log.error("Failed to pause job: {}", jobName, e);
            throw new RuntimeException("Failed to pause job", e);
        }
    }
    
    @Override
    public void resumeJob(String jobName, String jobGroup) {
        try {
            JobKey jobKey = new JobKey(jobName, jobGroup);
            scheduler.resumeJob(jobKey);
            log.info("Job resumed: {}", jobName);
        } catch (SchedulerException e) {
            log.error("Failed to resume job: {}", jobName, e);
            throw new RuntimeException("Failed to resume job", e);
        }
    }
    
    @Override
    public void unscheduleJob(String jobName, String jobGroup) {
        try {
            JobKey jobKey = new JobKey(jobName, jobGroup);
            scheduler.deleteJob(jobKey);
            log.info("Job unscheduled: {}", jobName);
        } catch (SchedulerException e) {
            log.error("Failed to unschedule job: {}", jobName, e);
            throw new RuntimeException("Failed to unschedule job", e);
        }
    }
    
    @Override
    public Optional<ScheduledJob> getJob(String jobName, String jobGroup) {
        try {
            JobKey jobKey = new JobKey(jobName, jobGroup);
            JobDetail jobDetail = scheduler.getJobDetail(jobKey);
            
            if (jobDetail == null) {
                return Optional.empty();
            }
            
            // Get trigger to extract cron expression
            TriggerKey triggerKey = new TriggerKey(jobName + "_trigger", jobGroup);
            CronTrigger trigger = (CronTrigger) scheduler.getTrigger(triggerKey);
            
            return Optional.of(ScheduledJob.builder()
                .jobName(jobName)
                .jobGroup(jobGroup)
                .cronExpression(trigger.getCronExpression())
                .description(jobDetail.getDescription())
                .status(ScheduledJob.JobStatus.ACTIVE)
                .build());
                
        } catch (SchedulerException e) {
            log.error("Failed to get job: {}", jobName, e);
            return Optional.empty();
        }
    }
    
    @Override
    public List<ScheduledJob> getAllJobs() {
        try {
            return scheduler.getJobGroupNames().stream()
                .flatMap(groupName -> {
                    try {
                        return scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName)).stream()
                            .map(jobKey -> {
                                try {
                                    JobDetail jobDetail = scheduler.getJobDetail(jobKey);
                                    return ScheduledJob.builder()
                                        .jobName(jobDetail.getKey().getName())
                                        .jobGroup(jobDetail.getKey().getGroup())
                                        .description(jobDetail.getDescription())
                                        .status(ScheduledJob.JobStatus.ACTIVE)
                                        .build();
                                } catch (SchedulerException e) {
                                    log.error("Failed to get job detail: {}", jobKey, e);
                                    return null;
                                }
                            });
                    } catch (SchedulerException e) {
                        log.error("Failed to get job keys for group: {}", groupName, e);
                        return null;
                    }
                })
                .filter(job -> job != null)
                .collect(Collectors.toList());
        } catch (SchedulerException e) {
            log.error("Failed to get all jobs", e);
            return List.of();
        }
    }
    
    @Override
    public List<ScheduledJob> getJobsByStatus(ScheduledJob.JobStatus status) {
        // Implementation depends on how you track status
        // For simplicity, return all jobs for ACTIVE status
        if (status == ScheduledJob.JobStatus.ACTIVE) {
            return getAllJobs();
        }
        return List.of();
    }
}
```

### 8. Testing

**File**: `src/test/java/com/example/order/infrastructure/scheduler/SampleQuartzTest.java`
```java
package com.example.order.infrastructure.scheduler;

import com.example.order.infrastructure.scheduler.jobs.SampleQuartzJob;
import org.junit.jupiter.api.Test;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.quartz.job-store-type=memory"
})
class SampleQuartzTest {
    
    @Autowired
    private Scheduler scheduler;
    
    @Test
    void testJobExecution() throws Exception {
        // Given
        JobDetail jobDetail = JobBuilder.newJob(SampleQuartzJob.class)
            .withIdentity("testJob", "DEFAULT")
            .storeDurably()
            .build();
        
        Trigger trigger = TriggerBuilder.newTrigger()
            .forJob(jobDetail)
            .withIdentity("testTrigger", "DEFAULT")
            .withSchedule(CronScheduleBuilder.cronSchedule("0 0 * * * ?"))
            .build();
        
        // When
        scheduler.scheduleJob(jobDetail, trigger);
        
        // Then
        assertThat(scheduler.checkExists(jobDetail.getKey())).isTrue();
        assertThat(scheduler.checkExists(trigger.getKey())).isTrue();
        
        // Clean up
        scheduler.unscheduleJob(trigger.getKey());
        scheduler.deleteJob(jobDetail.getKey());
    }
}
```

### 9. Configuration Properties

**File**: `src/main/resources/application-quartz.yml`
```yaml
spring:
  quartz:
    job-store-type: jdbc  # Use 'memory' for testing
    jdbc:
      initialize-schema: always  # Set to 'never' in production
    properties:
      org:
        quartz:
          scheduler:
            instanceName: OrderServiceScheduler
            instanceId: AUTO
          jobStore:
            class: org.springframework.scheduling.quartz.LocalDataSourceJobStore
            driverDelegateClass: org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
            dataSource: quartzDataSource
            tablePrefix: QRTZ_
            isClustered: false
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 10
            threadPriority: 5
```

### 10. Enable Scheduling

**File**: `src/main/java/com/example/order/OrderServiceApplication.java`
```java
package com.example.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // Enable scheduled tasks
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

### 11. Cron Expression Reference

| Expression | Meaning |
|------------|---------|
| `0 0 * * * ?` | Every hour |
| `0 0 0 * * ?` | Daily at midnight |
| `0 0 12 * * ?` | Daily at noon |
| `0 */5 * * * ?` | Every 5 minutes |
| `0 0 9 ? * MON-FRI` | Weekdays at 9 AM |
| `0 0 0 1 * ?` | First day of every month |
| `0 0 0 * * 1` | Every Monday at midnight |

### 12. Best Practices

1. **Job Persistence**: Use JDBC job store for production (survives restarts)
2. **Clustering**: Enable clustering for high availability
3. **Misfire Handling**: Configure appropriate misfire instructions
4. **Error Handling**: Implement proper exception handling in jobs
5. **Logging**: Log job execution start/end and errors
6. **Monitoring**: Track job execution times and failures
7. **Testing**: Use in-memory job store for tests

### 13. Monitoring

**Actuator Endpoint**:
```bash
# Not directly exposed by Quartz, create custom endpoint
curl http://localhost:8080/actuator/quartz/jobs
```

**Custom Health Indicator**:
```java
@Component
public class QuartzHealthIndicator implements HealthIndicator {
    @Autowired
    private Scheduler scheduler;
    
    @Override
    public Health health() {
        try {
            boolean isRunning = !scheduler.isShutdown();
            return isRunning ? Health.up().build() : Health.down().build();
        } catch (SchedulerException e) {
            return Health.down(e).build();
        }
    }
}
```

## Integration with Spring Batch

Quartz can trigger Spring Batch jobs:

```java
@Component
public class BatchJobLauncher {
    @Autowired
    private JobLauncher jobLauncher;
    
    @Autowired
    private Job sampleBatchJob;
    
    public void launchBatchJob() {
        try {
            JobParameters params = new JobParametersBuilder()
                .addLong("timestamp", System.currentTimeMillis())
                .toJobParameters();
            
            jobLauncher.run(sampleBatchJob, params);
        } catch (Exception e) {
            log.error("Batch job failed", e);
        }
    }
}

// Quartz Job that launches Spring Batch
@Component
public class BatchJobQuartzJob implements Job {
    @Autowired
    private BatchJobLauncher batchJobLauncher;
    
    @Override
    public void execute(JobExecutionContext context) {
        batchJobLauncher.launchBatchJob();
    }
}
```

## Next Steps

1. Implement actual business logic in Quartz jobs
2. Configure JDBC job store for persistence
3. Set up clustering for high availability
4. Add monitoring and alerting
5. Integrate with Spring Batch (Issue #93)
6. Create admin UI for job management
