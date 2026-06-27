---
name: "Standard 20: Workflow Engine Selection Criteria"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# Standard 20: Workflow Engine Selection Criteria

**Standard**: `docs/01-agnostic/01-standards/20-workflow-selection.md`
**Version**: 1.0
**Status**: Active
**Date**: 2026-06-16

---

## Purpose

This standard provides a decision framework for selecting between state machines, task schedulers, and workflow orchestration engines. It eliminates ambiguity about which tool to use for which problem.

---

## Decision Matrix

| Use Case | Recommended Pattern | Recommended Library | Stack |
|---|---|---|---|
| Single entity lifecycle (Order, User, Payment) | **State Machine** | `spring-statemachine` (Java), `transitions` (Python) | All |
| Multi-step process within one service | State Machine + Domain Events | Above + internal event bus | All |
| Periodic batch jobs, data pipelines | **Task Scheduler** | Quartz + Spring Batch (Java), Prefect (Python) | All |
| Cron-based reporting, ETL | **Task Scheduler** | Quartz (Java), Prefect (Python) | All |
| Multi-service coordination, minutes to hours | **Workflow Orchestration** | Temporal (optional) | All |
| Saga with compensation (inventory + payment) | **Workflow Orchestration** | Temporal (optional) | All |
| Human-in-the-loop approvals | **Workflow Orchestration** | Camunda / custom BPMN | All |
| Complex business rules (discounts, eligibility) | **Rules Engine** | Drools (Java), Durable Rules (Python) | All |

---

## Complexity Indicators: When to Escalate

### Use State Machine When:
- ✅ Single aggregate lifecycle (one entity, multiple states)
- ✅ Transitions are synchronous and fast (< 1 second)
- ✅ No cross-service calls during transitions
- ✅ Compensation is simple (reverse a single DB update)

**Examples**: Order status, Payment status, Ticket lifecycle

### Use Task Scheduler When:
- ✅ Periodic execution (hourly, daily, weekly)
- ✅ Batch processing of records
- ✅ Data pipeline / ETL
- ✅ Retries are acceptable, no saga compensation needed

**Examples**: Daily sales report, nightly data sync, periodic cleanup

### Use Workflow Orchestration (Temporal) When:
- ✅ Cross-service coordination (3+ services)
- ✅ Process duration > 5 minutes or spans hours/days
- ✅ Need for human approval steps
- ✅ Complex compensation (multiple rollback steps)
- ✅ Durable execution required (survive process crashes)

**Examples**: Order creation saga (inventory + payment + shipping), Loan approval workflow, Claim processing

---

## Anti-Patterns: What NOT to Do

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| Use state machine for cross-service saga | State machines are in-process and die with the process | Use Temporal for saga orchestration |
| Use workflow engine for simple CRUD status fields | Overkill; adds operational complexity | Use state machine |
| Use task scheduler for real-time user-facing flows | Quartz/Prefect are async batch tools | Use state machine or synchronous API |
| Use state machine without persistence | State is lost on restart | Persist to DB with optimistic locking |
| Implement saga manually with try/catch | No crash recovery, no visibility | Use Temporal or proper saga library |

---

## Stack-Specific Quick Reference

### Java / Spring Boot
| Pattern | Library | See Also |
|---|---|---|
| State Machine | `spring-statemachine-starter` | `ORDER_STATE_MACHINE_GUIDE.md` |
| Task Scheduler | Quartz + Spring Batch | `04-sops/09-add-new-batch-job.md` |
| Workflow Orchestration | Temporal Java SDK (optional) | ADR-02 |
| Rules Engine | Drools | `docs/02-java/04-adrs/01-tech-stack.md` |

### Python / FastAPI
| Pattern | Library | See Also |
|---|---|---|
| State Machine | `transitions` | `ORDER_STATE_MACHINE_GUIDE.md` |
| Task Scheduler | Prefect | `04-sops/09-add-new-batch-job.md` |
| Workflow Orchestration | `temporalio` (optional) | ADR-02 |
| Rules Engine | Durable Rules | `docs/03-python/04-adrs/01-tech-stack.md` |

---

## Real-World Scenarios

### Scenario 1: E-Commerce Order

**Problem**: Customer places order → reserve inventory → authorize payment → confirm order

**Decision**: **Workflow Orchestration (Temporal)**

**Rationale**: Cross-service (Order, Inventory, Payment), compensation required (release inventory on payment failure), survives crashes.

**Fallback if Temporal unavailable**: Saga pattern implemented manually with outbox + event-driven compensation (see `workflow-implementation.md`).

---

### Scenario 2: Order Status Display

**Problem**: Order page shows PENDING → CONFIRMED → SHIPPED → DELIVERED

**Decision**: **State Machine**

**Rationale**: Single aggregate, synchronous transitions, no cross-service calls during state change.

---

### Scenario 3: Daily Sales Report

**Problem**: Generate PDF report every day at 6 AM with yesterday's sales data

**Decision**: **Task Scheduler**

**Rationale**: Periodic, batch-oriented, no saga, no compensation needed. Quartz/Prefect perfect fit.

---

### Scenario 4: Fraud Detection

**Problem**: Evaluate transaction risk score using 20+ business rules

**Decision**: **Rules Engine**

**Rationale**: Complex boolean logic, frequently changing rules, no state transitions or saga needed.

---

## Related Documents

- `docs/ORDER_STATE_MACHINE_GUIDE.md` — Aggregate state machine implementation
- `docs/01-agnostic/03-guidelines/workflow-implementation.md` — State machine + Saga pattern guide
- `docs/02-java/04-adrs/01-tech-stack.md` — Java ADR-02 (technology decisions)
- `docs/03-python/04-adrs/01-tech-stack.md` — Python ADR-02 (technology decisions)
- `04-sops/09-add-new-batch-job.md` — Adding batch jobs

---

*Last updated: 2026-06-16*
*Part of app-architecture-template v2.1*
