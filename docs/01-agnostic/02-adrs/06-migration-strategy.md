---
name: "ADR 07: Database Migration Strategy (Expand-Contract)"
type: "Template"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# ADR 07: Database Migration Strategy (Expand-Contract)

**Status**: Accepted
**Date**: 2026-04-30

## Context
We need to perform schema changes in production without downtime. Simply altering a column or removing a table can break the running application during the deployment window.

## Decision
Adopt the **Expand-Contract Pattern** for all destructive or breaking schema changes.

### Process:
1. **Expand**: Add the new column/table in migration N. The application continues using the old schema.
2. **Migrate**: Update the application to write to both the old and new columns, and read from the old. Then, backfill existing data.
3. **Contract**: After verifying the new schema is stable, update the application to read from the new column only. Finally, drop the old column/table in migration N+2.

## Consequences
- **Positive**: Zero-downtime deployments and safe rollbacks.
- **Negative**: Slower migration process (requires multiple releases). Increased complexity in the application code during the "Migrate" phase.
- **Trade-off**: We trade deployment speed for system availability.
