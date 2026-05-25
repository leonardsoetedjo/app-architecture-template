---
name: "Batch Job Framework Boilerplate"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# Batch Job Framework Boilerplate

This document provides a standardized implementation pattern for batch jobs to reduce manual coding and ensure adherence to `docs/01-agnostic/01-standards/batch.md` and `ADR-004`.

## 1. Core Architecture
To avoid deviations, all batch jobs must follow the **Template-Based Configuration** pattern.

### 1.1 Base Job Configuration
Instead of defining jobs from scratch, implement the `AbstractBatchJob` pattern.

```java
/**
 * Base class for all batch jobs to ensure consistent 
 * error handling, logging, and monitoring.
 */
public abstract class AbstractBatchJob {
    protected final JobRepository jobRepository;
    protected final PlatformTransactionManager transactionManager;

    public AbstractBatchJob(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        this.jobRepository = jobRepository;
        this.transactionManager = transactionManager;
    }

    // Template method to define the job steps
    public abstract Job createJob(JobRepository jobRepository, StepExecutionListener listener);

    // Standardized Job Execution Listener for all jobs
    protected StepExecutionListener standardStepListener() {
        return new StandardBatchStepListener();
    }
}
```

## 2. Standardized Components

### 2.1 Standard Batch Step Listener
Handles consistent logging of items read, processed, and failed.

```java
public class StandardBatchStepListener implements StepExecutionListener {
    private static final Logger log = LoggerFactory.getLogger(StandardBatchStepListener.class);

    @Override
    public ExitStatus preStep(StepExecution stepExecution) {
        log.info("Starting batch step: {} with parameters {}", 
            stepExecution.getStepName(), stepExecution.getJobExecution().getExecutionContext());
        return ExitStatus.STARTED;
    }

    @Override
    public ExitStatus postStep(StepExecution stepExecution) {
        log.info("Completed batch step: {}. Read: {}, Written: {}, Skipped: {}", 
            stepExecution.getStepName(), 
            stepExecution.getReadCount(), 
            stepExecution.getWriteCount(), 
            stepExecution.getSkipCount());
        return stepExecution.getExitStatus();
    }
}
```

### 2.2 Idempotent Item Writer (ADR-004 implementation)
Standardizes the **Upsert** and **Run-ID** tracking.

```java
/**
 * Base writer for PostgreSQL to ensure idempotency and audit tracking.
 */
public abstract class IdempotentPostgresWriter<T> implements ItemWriter<T> {
    private final JdbcTemplate jdbcTemplate;
    private final String runId;

    public IdempotentPostgresWriter(JdbcTemplate jdbcTemplate, String runId) {
        this.jdbcTemplate = jdbcTemplate;
        this.runId = runId;
    }

    @Override
    public void write(Chunk<? extends T> chunk) throws Exception {
        for (T item : chunk) {
            upsertItem(item);
        }
    }

    private void upsertItem(T item) {
        String sql = getUpsertSql();
        // Implementation must use INSERT ... ON CONFLICT
        // and set last_batch_run_id = :runId
        jdbcTemplate.update(sql, ...);
    }

    protected abstract String getUpsertSql();
}
```

## 3. Implementation Example: `UserSyncJob`

```java
@Configuration
public class UserSyncJob extends AbstractBatchJob {

    @Bean
    public Job userSyncJob(JobRepository jobRepository, Step step1) {
        return new JobBuilder("userSyncJob", jobRepository)
            .start(step1)
            .build();
    }

    @Bean
    public Step step1(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("syncStep", jobRepository)
            .<UserEntity, UserEntity>chunk(100, transactionManager)
            .reader(userItemReader())
            .processor(userItemProcessor())
            .writer(userItemWriter())
            .faultTolerant()
            .skipLimit(10)
            .skip(TransientDataAccessException.class)
            .listener(standardStepListener())
            .build();
    }

    // Implementation of Reader, Processor, Writer...
}
```

## 4. Summary Checklist for Developers
- [ ] Extends `AbstractBatchJob`?
- [ ] Uses `StandardBatchStepListener`?
- [ ] `ItemWriter` implements `INSERT ... ON CONFLICT` (Upsert)?
- [ ] `last_batch_run_id` is updated on every write?
- [ ] `ItemProcessor` is a pure function (no DB/API calls)?
- [ ] `Symmetry` check: Does the job support restart without duplicating data?
