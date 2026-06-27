---
title: "Decision Interview Protocol (DIP)"
number: "19"
type: "SOP"
created: "2026-06-27"
status: "active"
---
# Decision Interview Protocol (DIP)

Agent interviews the product owner before handing work to Cody.

## When to Use
Before any audit findings become GitHub issues for Cody.

## Interview Rules
1. One question at a time
2. Wait for answer before next question
3. Record answer in issue body
4. No defaults — if owner doesn't answer, stop and ask again

## Interview Script

### Q1: Critical — Tests
Finding: 2 architecture tests have commented assertions (14/14 pass falsely).
Options:
A) Uncomment now, accept 50+ failures. Cody fixes them all.
B) Uncomment one test at a time. Cody fixes per-test.
C) Leave commented. Tests stay informational.
Your answer: ___

### Q2: Critical — Dead Code
Finding: models/ is stale clone of infra/persistence/models/
Options:
A) Delete models/ immediately after migrating imports.
B) Delete after all 57 services are refactored (weeks away).
C) Keep both. Document which is canonical.
Your answer: ___

### Q3: Critical — Empty Layer
Finding: application/ has 0 .py files.
Options:
A) Create application/usecases/ and extract 3 use cases now.
B) Rename services/ to application/ and leave as-is.
C) Document services/ as application layer (no code change).
Your answer: ___

### Q4: Major — Orphans
Finding: 13 services have no router/deps caller.
Options:
A) Delete all 13 after verifying no event bus wiring.
B) Keep all. Document which are event-driven.
C) Investigate one by one. Delete only confirmed dead.
Your answer: ___

### Q5: Major — Migration Pace
Finding: 57 services use raw ORM. 10 use ports correctly.
Options:
A) Fix all 57. Maximum 10 per sprint.
B) Fix only router-facing services (~20). Leave rest.
C) Fix none. Document as known debt.
Your answer: ___

### Q6: Major — Frontend
Finding: Frontend exemption (ADR-006) has no review date.
Options:
A) Add dependency-cruiser now (frontend has services/ layer).
B) Set review date (e.g. 2026-08-01) and revisit.
C) Keep permanent exemption. Document why.
Your answer: ___

### Q7: Minor — AGENTS.md
Finding: AGENTS.md is 39KB monolith.
Options:
A) Split into DOX hierarchy now.
B) Leave as-is. Add to tech debt backlog.
C) Create child AGENTS.md for new features only.
Your answer: ___

## Decision Recording
After interview, append this to the master audit issue:

```markdown
## Owner Decisions
| # | Finding | Decision | Rationale |
|---|---------|----------|-----------|
| 1 | Tests | [answer] | [owner quote] |
| 2 | Dead code | [answer] | [owner quote] |
...
```

## Stop Conditions
- If owner picks "C" for Q5 (fix none), downgrade all service findings to Advisory
- If owner picks "C" for Q3 (no code change), note architecture drift as accepted
- If owner skips any question, do not create issues for skipped items

## Handoff Gate
Interview is complete when all 7 questions answered.
Issues created ONLY for items with owner decisions.
