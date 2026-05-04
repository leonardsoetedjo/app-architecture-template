# ADR 04: Batch Idempotency Framework

**Status**: Accepted
**Date**: 2026-04-30

## Context
Batch jobs process high volumes of data. Failures during execution are inevitable. Without strict idempotency, restarts lead to duplicate records, double-processed side effects (e.g., duplicate emails), and impossible-to-undo data corruption.

## Decision
Implement a defense-in-depth batch idempotency framework consisting of five mandatory constraints:

1. **Deterministic ID Generation**: Avoid DB sequences for batch inserts. Use natural keys or a hash of the record's unique attributes as the Primary Key.
2. **Upsert (Merge) Strategy**: Use `INSERT ... ON CONFLICT` (PostgreSQL) or Merge patterns in `ItemWriter` to "heal" data on restart.
3. **Spring Batch State Leverage**: Mandate the use of the `JobRepository` for state tracking to resume from the last successful chunk.
4. **Pure ItemProcessors**: `ItemProcessor` must be a pure function with no side effects. All side effects must be consolidated in the `ItemWriter` transaction.
5. **Execution Tracking (Run-ID)**: Every batch-modified record must include a `last_batch_run_id` column to allow instant "undo" of a specific job execution.

## Consequences
- **Positive**: Absolute data integrity, "undo" capability for corrupted runs, and zero-manual-intervention recovery.
- **Negative**: Slightly higher CPU overhead for hashing, slower write performance due to Upserts, and minor schema pollution.
- **Trade-off**: We prioritize reliability and recoverability over marginal gains in write throughput.
