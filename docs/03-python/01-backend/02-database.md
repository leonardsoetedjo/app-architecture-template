---
name: "Database Standards (Python/Quasar)"
type: "ADR"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# Database Standards (Python/Quasar)

## 1. PostgreSQL Implementation
We use PostgreSQL as the primary relational store. All Python services must use SQLAlchemy 2.0+ for ORM and schema management.

## 2. Conventions
- **Naming**: snake_case for tables and columns. Use plural names for tables (e.g., `shipments`, `users`).
- **ID Generation**: Use UUIDs (v4) as primary keys to ensure global uniqueness and facilitate database sharding.
- **Data Types**:
  - Use `JSONB` for semi-structured data that doesn't require strict schema enforcement.
  - Use `NUMERIC` or `DECIMAL` for all financial/weight precision calculations.
  - Use `TIMESTAMP WITH TIME ZONE` for all timestamps.

## 2a. SQLModel-Specific Rules (MUST follow)

When using **SQLModel** (the standard for Python/FastAPI boilerplate), the following rules prevent the most common runtime errors:

### 2a.1 Every table model MUST declare `__tablename__`

SQLModel auto-generates table names from class names using `camel_to_snake`, but the result is frequently surprising:
- `AuditLog` → `audit_log` (not `audit_logs`)
- `UserSettings` → `user_settings` (not `user_setting`)
- `TradingAccount` → `trading_account` (not `trading_accounts`)

**Rule:** Every class inheriting from `SQLModel` with `table=True` MUST explicitly set `__tablename__ = "<plural_snake_case>"`.

**Why:** Without `__tablename__`, a model and its Alembic migration can silently disagree. The migration creates table `audit_logs` while SQLModel looks for `audit_log`, causing `sqlalchemy.exc.NoReferencedTableError` at runtime.

**Correct:**
```python
class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    ...
```

**Incorrect:**
```python
class AuditLog(SQLModel, table=True):
    # Missing __tablename__ — SQLModel defaults to "audit_log"
    ...
```

### 2a.2 `foreign_key=` references MUST match actual table names

**Rule:** The string passed to `foreign_key="table.column"` MUST exactly match a `__tablename__` declared elsewhere in the codebase.

**Common failure mode:** Singular vs plural mismatch.
```python
# Model A declares table='users'
class User(SQLModel, table=True):
    __tablename__ = "users"

# Model B references 'user.id' — WRONG (singular)
class TradingAccount(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id")  # ❌ Table is 'users', not 'user'

# Correct:
class TradingAccount(SQLModel, table=True):
    user_id: int = Field(foreign_key="users.id")  # ✅
```

**Detection:** Architecture tests scan all models, collect every `__tablename__`, then verify every `foreign_key=` and `ForeignKey(...)` string against that set. Mismatches fail the build.

### 2a.3 Alembic is the sole schema authority — `create_all()` is forbidden

**Rule:** Production databases MUST be created and evolved via Alembic migrations only. `Base.metadata.create_all()` or `SQLModel.metadata.create_all()` MUST NOT be called at application startup.

**Why:** `create_all()` skips migration history, making it impossible to roll back or track schema changes. It also causes "table already exists" errors when Alembic and `create_all()` race.

**Correct startup pattern:**
```python
# main.py — lifespan or startup event
from alembic.config import Config
from alembic import command

async def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
```

**Forbidden:**
```python
# main.py — WRONG
from sqlmodel import SQLModel
SQLModel.metadata.create_all(bind=engine)  # ❌ Bypasses migrations
```

## 3. SQLAlchemy Patterns
- **Session Management**: Use `AsyncSession` with FastAPI's dependency injection for all request-scoped operations.
- **Loading Strategy**: Default to `lazy='select'`. Use `joinedload` or `selectinload` to prevent N+1 query problems.
- **Model Isolation**: SQLAlchemy models must live in the `infrastructure` layer. Map them to domain entities to prevent leakage of persistence details into business logic.

## 4. Migrations (Alembic)
- **Tool**: Alembic is the mandated migration tool.
- **Process**: 
  1. Generate migration: `alembic revision --autogenerate -m "description"`.
  2. Review the generated SQL.
  3. Apply: `alembic upgrade head`.
- **Backward Compatibility**: Follow the **Expand-Contract pattern** for any breaking schema change.

## 5. Performance & Indexing
- **Indexing**: Index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- **VACUUM**: Monitor bloat and configure autovacuum appropriately for high-write tables.
- **Query Optimization**: Use `EXPLAIN ANALYZE` to identify and fix slow queries.

## 6. Concurrency & Locking

Concurrency control is critical for data integrity under load. Python services using SQLAlchemy must implement the same locking discipline as Java services.

| Strategy | When to Use | Trade-off |
|----------|------------|-----------|
| **Optimistic** | Low-to-moderate write contention; reads dominant. Prevents lost updates without acquiring DB locks. | Requires retry + user notification on conflict. |
| **Pessimistic** | High-contention resources (inventory, account balance) where conflicts are frequent. | Locks rows, risk of deadlocks if scope is wide. |
| **None** | Immutable / insert-only tables where updates never happen. | Fastest. |

### 6.1 Optimistic Locking (Default)

Optimistic locking allows multiple transactions to proceed without acquiring row locks. Conflicts are detected at commit time via a version check.

**Mechanism**:
1. Every updatable model contains a `version_id` column (integer, default 0).
2. SQLAlchemy uses `version_id_col` on the mapper or declarative base to track the version.
3. On update, the `UPDATE` statement includes: `WHERE id = ? AND version_id = ?`.
4. The database increments the version on a successful update.
5. If zero rows are affected (version mismatch), SQLAlchemy raises `StaleDataError`. Map this to a user-facing error or retry.

**Entity Setup**:
Add `version_id` to your SQLAlchemy model and configure `version_id_col`:

```python
from sqlalchemy import Column, Integer, String, Uuid, DateTime
from sqlalchemy.orm import declarative_base
import uuid
from datetime import datetime, timezone

Base = declarative_base()

class InventorySqlModel(Base):
    __tablename__ = "inventory"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    version_id = Column(Integer, nullable=False, default=0)

    __mapper_args__ = {
        "version_id_col": version_id,
    }
```

*SQLAlchemy automatically includes the `version_id` in the `UPDATE` `WHERE` clause. When a conflict occurs, it raises `sqlalchemy.orm.exc.StaleDataError`.*

**Service Layer with Retry**:
Optimistic locking without retry is incomplete. The use case must catch `StaleDataError`, reload the entity, and retry:

```python
from sqlalchemy.orm.exc import StaleDataError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from common.exceptions import ConcurrentUpdateException

class InventoryAdjustmentService:

    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.1, max=1),
        retry=retry_if_exception_type(StaleDataError),
    )
    async def deduct_stock(self, product_id: uuid.UUID, quantity: int) -> None:
        async with self.session_factory() as session:
            inventory = await session.get(InventorySqlModel, product_id)
            if not inventory:
                raise ProductNotFoundException(product_id)

            # Business rule validation
            if inventory.quantity < quantity:
                raise InsufficientStockException(
                    product_id=product_id,
                    requested=quantity,
                    available=inventory.quantity
                )

            inventory.quantity -= quantity
            await session.commit()  # StaleDataError raised here on version conflict
```

**Key Rules**:
- **Retry is mandatory**: Never surface `StaleDataError` as a generic 500. Either retry or return a structured user-facing error so the client can retry.
- **Keep transactions short**: The read-modify-write window must be as narrow as possible. Avoid external I/O (HTTP calls, file I/O) inside a write transaction.
- **Read-only sessions**: Use `autocommit=True` or `await session.execute(select(...))` without explicit `await session.commit()` for read-only queries so the version is not incremented.
- **Batch conflicts are acceptable**: In bulk operations, a per-item retry is acceptable. Do not fail the entire batch because one item conflicted.

### 6.2 Pessimistic Locking

Use pessimistic locking only when optimistic locking causes excessive retry churn.

**SQLAlchemy `with_for_update()`**:
```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def process_high_contention_order(session, order_id: uuid.UUID):
    result = await session.execute(
        select(OrderSqlModel)
        .where(OrderSqlModel.id == order_id)
        .with_for_update()  # SELECT ... FOR UPDATE NOWAIT (default)
    )
    order = result.scalar_one()
    order.status = "PROCESSING"
    await session.commit()
    # Lock is released at commit.
```

**Advanced Options**:
```python
# SKIP LOCKED — skip rows already locked instead of waiting
select(...).with_for_update(skip_locked=True)

# NOWAIT — raise immediately if locked
select(...).with_for_update(nowait=True)

# OF specific tables in a join
select(...).with_for_update(of=OrderSqlModel)
```

**Rules**:
- Lock scope must be minimal—release as soon as the transaction ends.
- Never call external services while a lock is held.
- Handle `AsyncTimeoutError` (or psycopg’s `LockTimeoutException`) gracefully.

### 6.3 Transaction Isolation

Default isolation is `READ COMMITTED` (PostgreSQL default). Do not change this globally.

| Level | When | Risk |
|-------|------|------|
| `READ COMMITTED` (default) | Normal operations | Non-repeatable reads in long transactions. |
| `REPEATABLE READ` | Strict balance/ledger reads where the same row is read twice in one transaction | Phantom reads still possible. |
| `SERIALIZABLE` | Financial ledgers where phantoms are unacceptable. | Performance penalty. |

Set isolation per session when absolutely necessary:

```python
from sqlalchemy import text

async with session.begin():
    await session.execute(text("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ"))
    # ... strict balance check ...
```
