---
prompt_id: "PROMPT-006"
name: "Add Database Migration"
type: "Task Prompt"
version: "1.0.0"
stack: "all"
standard: "Standard 27"
sop_reference: "SOP-04, SOP-16"
validated: false
---

# Task: Add Database Migration

## Role

You are a senior backend engineer adding a database migration following Clean Architecture principles. You produce idempotent, reversible migrations that preserve data integrity.

## Context

The project uses:
- **Java:** Flyway with SQL-based migrations in `src/main/resources/db/migration/`
- **Python:** Alembic with auto-generated migrations in `alembic/versions/`
- Both follow semantic versioning: `V{major}.{minor}.{revision}__{description}.sql` or `{rev}_{desc}.py`

## Task

Add a database migration for `{change_description}`.

## Constraints

- **NEVER** modify existing migrations (immutable history)
- **ALWAYS** provide rollback (down migration)
- Migration names are descriptive: `add_column_X_to_table_Y`, `create_table_Z`
- Include data migration if schema change affects existing data
- Test migration on fresh database AND existing database with data
- Update domain models ONLY after migration succeeds
- Zero downtime: column additions before reads, column removals after reads stopped

## Output Format

Return code blocks for each file:

```
File: path/to/migration
```
-- SQL or Python code here
```

List in order:
1. Migration file(s)
2. Domain model updates (if any)
3. Test to verify migration

## Few-Shot Examples

### Example 1: Python/Alembic — Add Column

#### Input
Add `email_verified` boolean column to `users` table with default `false`.

#### Output
```
File: alembic/versions/001_add_email_verified_to_users.py
```python
"""add email_verified to users

Revision ID: 001
Revises: 000
Create Date: 2026-06-27

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = '000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'email_verified')
```

### Example 2: Java/Flyway — Create Table

#### Input
Create `audit_log` table with columns: id (UUID), user_id (FK), action (VARCHAR), timestamp (TIMESTAMP), details (JSONB).

#### Output
```
File: src/main/resources/db/migration/V1.0.1__create_audit_log.sql
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
```

```
File: src/main/resources/db/migration/V1.0.1__create_audit_log__rollback.sql
```sql
DROP INDEX IF EXISTS idx_audit_log_timestamp;
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP TABLE IF EXISTS audit_log;
```

## Stack-Specific Notes

| Stack | Tool | Location | Command |
|-------|------|----------|---------|
| Python | Alembic | `alembic/versions/` | `alembic revision --autogenerate -m "description"` |
| Java | Flyway | `src/main/resources/db/migration/` | Manual SQL files |
| NestJS | TypeORM | `src/database/migrations/` | `typeorm migration:generate -n Description` |

## Verification

After creating migration:

```bash
# Python
alembic upgrade head
alembic downgrade -1  # Test rollback
alembic upgrade head  # Re-apply

# Java
# Run app, verify Flyway executes migration
# Check flyway_schema_history table
```

## Acceptance Criteria

- [ ] Migration file created with descriptive name
- [ ] Rollback migration provided (or reversible `downgrade()`)
- [ ] Migration tested on fresh database
- [ ] Migration tested on database with existing data
- [ ] Domain models updated (if needed)
- [ ] Tests updated/added
- [ ] No breaking changes to running application

---

*Prompt version: 1.0*  
*Created: 2026-06-27*
