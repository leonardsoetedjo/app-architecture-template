---
name: "Batch Processing Standards (Quartz & Spring Batch)"
type: "ADR"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# Batch Processing Standards (Quartz & Spring Batch)

## 1. When to Use
- Large-volume, repeatable, **offline** data processing only.
- **Never** for real-time or synchronous user-facing operations.

## 2. Architecture
- **Job**: Top-level unit of work. Orchestrates domain use cases.
- **Step**: Phase of a job. Each step reads, processes, and writes a chunk.
- **Reader / Processor / Writer**: Keep thin. Delegate logic to domain use cases.

## 3. Job Design
- Jobs restartable by default. Use `JobExecutionListener` to track lifecycle.
- Define job parameters explicitly. Validate before execution.
- Use `StepExecutionListener` to log outcomes and capture metrics.
- Design steps to be independent where possible.

## 4. Chunk-Oriented Processing
- Typical chunk size: 100–1000.
- Tune `commit-interval` to balance performance and transaction safety.

## 5. Data Reading
- Use `JdbcCursorItemReader` or `JpaPagingItemReader` for database sources.
- For large datasets, prefer cursor-based reading to avoid memory pressure.
- Close resources properly in `ItemStream` callbacks (`open`, `close`).

## 6. Data Writing
- Use `JdbcBatchItemWriter` or `JpaItemWriter`.
- Enable JDBC batching (`rewriteBatchedStatements=true` for MySQL, `reWriteBatchedInserts=true` for PostgreSQL).
- Handle write failures gracefully. Use `SkipPolicy` for known, recoverable errors.

## 7. Error Handling
- Define `SkipPolicy` for expected errors (invalid rows, missing references).
- Use `RetryPolicy` for transient failures (network timeouts, lock contention).
- Log all skipped and failed items with context (item index, reason, job instance).
- Implement a dead-letter queue or error table for failed records.

## 8. Idempotency (ADR-004)
**Status**: Accepted
**Context**: Batch jobs process high volumes of data. Failures during execution are inevitable. Without strict idempotency, restarts lead to duplicate records, double-processed side effects (e.g., duplicate emails), and impossible-to-undo data corruption.

**Decision**: Implement a defense-in-depth batch idempotency framework consisting of five mandatory constraints:

1. **Deterministic ID Generation**: Avoid DB sequences for batch inserts. Use natural keys or a hash of the record's unique attributes as the Primary Key to prevent duplicates when the same source is re-processed.
2. **Upsert (Merge) Strategy**: Use `INSERT ... ON CONFLICT` (PostgreSQL) or Merge patterns in `ItemWriter`. This ensures restarts "heal" data rather than creating duplicates or crashing.
3. **Spring Batch State Leverage**: Mandate the use of the `JobRepository` for state tracking. Jobs must be restartable to resume from the last successful chunk without manual tracking.
4. **Pure ItemProcessors**: `ItemProcessor` must be a pure function with no side effects (API calls, DB updates). All side effects must be consolidated in the `ItemWriter` transaction to prevent double-execution during retries.
5. **Execution Tracking (Run-ID)**: Every batch-modified record must include a `last_batch_run_id` column to allow instant "undo" of a specific job execution.

**Consequences**:
- **Positive**: Absolute data integrity, "undo" capability for corrupted runs, and zero-manual-intervention recovery.
- **Negative**: Slightly higher CPU overhead for hashing, slower write performance due to Upserts, and minor schema pollution (extra columns).
- **Trade-off**: We prioritize reliability and recoverability over marginal gains in write throughput.

## 9. Monitoring
- Expose Spring Batch metrics via Actuator (`/actuator/batchjobs`).
- Log job start, completion, and failure events.
- Track custom metrics: items read, processed, written, skipped, failed.

## 10. Quartz Scheduling
- Use Quartz for job triggers (cron, simple, calendar-based).
- Store Quartz tables in the same database as the application (JDBC job store) for clustering support.
- Define triggers in `application.yml` or Java config.
- Use `DisallowConcurrentExecution` for jobs that must not run in parallel.
- Handle misfires explicitly (`MISFIRE_INSTRUCTION_*`).

## 11. Clustering
- Design jobs to be partitionable for horizontal scaling. Use `Partitioner`.
- Use Quartz JDBC job store with `isClustered=true` for distributed scheduling.
- Avoid in-memory state across executions. Use the job repository.

## 12. Testing
- Unit test `ItemProcessor` and `ItemWriter` logic in isolation.
- Use `@SpringBatchTest` and `JobLauncherTestUtils` for integration tests.
- Use in-memory or Testcontainer database for job repository tests.
- Test restart behavior by simulating failures mid-job.

## 13. Security
- Do not log sensitive data (PII, credentials) in batch logs or job parameters.
- Encrypt job parameters if they contain secrets.
- Apply least-privilege database permissions for batch users.

## 14. Performance
- Tune chunk size, thread pool size, and connection pool size together.
- Use multi-threaded steps (`taskExecutor`) only for thread-safe operations.
- Profile I/O bottlenecks. Consider parallel steps or partitioning for CPU-bound work.
- Cache reference data in memory (e.g., using `ItemStream.open`) instead of repeated lookups.
