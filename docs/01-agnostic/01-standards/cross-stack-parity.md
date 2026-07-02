# Cross-Stack Parity Guidelines

## Purpose

This document clarifies which features, tables, and components are **required** for parity across all stacks vs which are **optional/stack-specific** demonstrations.

## Core Principle

**Boilerplate stacks demonstrate the same architectural patterns, not necessarily identical features.**

Each stack should implement the **core order management domain** (orders, order_items, customers) to enable cross-stack comparison. Auxiliary features (batch jobs, workflow executions, order state machine) are **optional demonstrations** of stack-specific capabilities.

## Required Parity (Core Domain)

All backend stacks **must** have:

| Table/Feature | Purpose | Stacks |
|---------------|---------|--------|
| `orders` | Core aggregate root | Java, Python, NestJS |
| `order_items` | Line items (relational, not JSONB) | Java, Python, NestJS |
| `outbox_events` | Event sourcing / CDC pattern | Java, Python, NestJS |
| Optimistic locking (`version` column) | Concurrency control | Java, Python, NestJS |
| Bruno smoke tests | API verification | All backends |
| Playwright E2E tests | Frontend verification | ReactJS, Quasar |

## Optional Features (Stack-Specific Demonstrations)

These features demonstrate **additional capabilities** but are NOT required for parity:

| Feature | Present In | Purpose | Parity Required? |
|---------|-----------|---------|------------------|
| `batch_jobs` | Java | Batch processing demo | ❌ No — Java-only demonstration |
| `workflow_executions` | Python | Workflow orchestration demo | ❌ No — Python-only demonstration |
| `order_state` / `order_state_history` | Java | State machine demo | ❌ No — Java-only demonstration |
| Common package domain layer | Java, NestJS, Python | Shared value objects | ✅ Yes — all should have (in progress) |
| Common package infrastructure | Java, NestJS, Python | HTTP client, secrets, correlation ID | ✅ Yes — all should have (in progress) |

## Rationale

1. **Core domain parity** enables developers to compare how each stack implements the same business logic.

2. **Optional features** showcase unique strengths:
   - Java: Spring Batch integration, state machine patterns
   - Python: Workflow orchestration, async task queues
   - NestJS: Modern TypeScript patterns, microservices architecture

3. **Adding all features to all stacks** would:
   - Bloat the boilerplate with redundant code
   - Increase maintenance burden
   - Dilute focus on core patterns

## Compliance

- ✅ **All backends** have `orders`, `order_items`, `outbox_events` tables
- ✅ **All backends** have optimistic locking
- ✅ **All backends** have Bruno smoke test environments
- ✅ **All frontends** have Playwright E2E tests with page objects
- ⚠️ **Common packages** being aligned across stacks (see #376, #375, #377)
- ℹ️ **Auxiliary tables** (`batch_jobs`, `workflow_executions`, `order_state`) are stack-specific demonstrations

## When to Add Parity

Add a feature to all stacks when:
- It's part of the **core domain** (e.g., order_items vs JSONB)
- It's a **critical pattern** (e.g., outbox events, optimistic locking)
- It enables **cross-stack comparison** of the same pattern

Keep features stack-specific when:
- It demonstrates a **unique capability** (batch processing, workflows)
- It would require **significant duplication** without added value
- It's a **nice-to-have** rather than core functionality

---

**Related Issues:**
- #374 — Schema Parity (this document)
- #376, #375, #377 — Common package parity
- #370, #372, #371 — order_items table parity

**Last Updated:** 2026-07-02
