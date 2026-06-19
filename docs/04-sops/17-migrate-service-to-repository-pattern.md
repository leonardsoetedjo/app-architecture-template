---
name: "Migrate Service to Repository Pattern"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP-17: Migrate Service to Repository Pattern

> **Purpose:** Retrofit an existing service that uses direct ORM into Clean Architecture.
> **Time estimate:** 15-30 min per service (mechanical refactor)
> **Prerequisites:** Boilerplate reference code indexed via `ctx_search`

## 1. When to Use This SOP

Use when a service has any of these violations:
- Imports `app.models` or `sqlmodel` directly
- Has `db.add()`, `db.commit()`, or `db.execute()` in business logic
- Receives `AsyncSession` in constructor
- Has mixed concerns (business logic + persistence + orchestration)

**Example violation (BEFORE):**
```python
# src/app/services/analytics_service.py
class AnalyticsService:
    def __init__(self, db: AsyncSession):  # ❌ receives ORM session
        self.db = db
    
    async def get_metrics(self):
        result = await self.db.execute(select(Trade))  # ❌ raw ORM
        return result.scalars().all()
```

## 2. Step-by-Step Migration

### Step 1: Create/Verify Repository Port

**Action:** Define an abstract base class in `src/app/domain/ports/repositories.py`

**Pattern (from boilerplate):**
```python
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

class AnalyticsRepository(ABC):
    @abstractmethod
    async def get_metrics(self, filters: dict) -> List[DomainMetric]:
        """Fetch metrics for analytics. Returns domain entities only."""
        ...
    
    @abstractmethod
    async def get_total_trades(self, start_date: datetime, end_date: datetime) -> int:
        ...
```

**Verification:**
```bash
cd backend
grep -r "AnalyticsRepository" src/app/domain/ports/
# Expected: 1 result in repositories.py
```

---

### Step 2: Create SQLModel Adapter

**Action:** Implement port in `src/app/infrastructure/repositories/sqlmodel_adapters.py`

**Pattern (from boilerplate):**
```python
class SQLModelAnalyticsRepository(SQLModelRepositoryBase, AnalyticsRepository):
    model_class: Type[SQLModelTrade] = SQLModelTrade

    async def get_metrics(self, filters: dict) -> List[DomainMetric]:
        stmt = select(self.model_class).where(...)
        result = await self.db.execute(stmt)
        orm_trades = result.scalars().all()
        return [TradeMapper.to_domain(t) for t in orm_trades]
    
    async def get_total_trades(self, start_date: datetime, end_date: datetime) -> int:
        stmt = select(func.count()).select_from(self.model_class).where(...)
        result = await self.db.execute(stmt)
        return result.scalar()
```

**Rules:**
- Use existing `SQLModelRepositoryBase` if available
- Return domain entities (use mapper if one exists)
- Add to `__init__.py` exports

---

### Step 3: Refactor Service

**Action:** Replace direct ORM with port injection

**Before:**
```python
class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_metrics(self):
        result = await self.db.execute(select(Trade))  # raw ORM
        return result.scalars().all()
```

**After:**
```python
from app.domain.ports.repositories import AnalyticsRepository

class AnalyticsService:
    def __init__(self, repo: AnalyticsRepository):  # ✅ port injection
        self.repo = repo
    
    async def get_metrics(self, filters: dict):
        return await self.repo.get_metrics(filters)  # ✅ delegates to port
```

**Rules:**
- Constructor receives port, not ORM session
- Business logic stays in service (calculations, decisions)
- All persistence goes through `self.repo`

---

### Step 4: Wire in deps.py

**Action:** Add factory function in `src/app/api/deps.py`

**Pattern:**
```python
from app.services.analytics_service import AnalyticsService
from app.infrastructure.repositories import SQLModelAnalyticsRepository
from app.domain.ports.repositories import AnalyticsRepository

async def get_analytics_service(
    db: AsyncSession = Depends(get_db)
) -> AnalyticsService:
    return AnalyticsService(
        repo=SQLModelAnalyticsRepository(db)
    )
```

**Rules:**
- Factory is the ONLY place SQLModel is constructed
- Router uses `Depends(get_analytics_service)`
- Test mocks replace `get_analytics_service` return value

---

### Step 5: Update Router

**Action:** Replace direct model imports with service dependency

**Before:**
```python
from app.models.trade import Trade  # ❌ direct model import

@router.get("/analytics/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Trade))  # ❌ raw ORM
    return result.scalars().all()
```

**After:**
```python
from app.services.analytics_service import AnalyticsService
from app.api.deps import get_analytics_service

@router.get("/analytics/metrics")
async def get_metrics(
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.get_metrics()  # ✅ delegates to service
```

---

### Step 6: Update Architecture Test

**Action:** Verify the service no longer appears in violations

```bash
cd backend
python -m pytest tests/archunit/test_architecture.py -v
# Look for: "analytics_service" in violations list
# Expected: NOT listed (or listed as FIXED after uncomment assertions)
```

---

### Step 7: Run Verification Gates

**All gates must pass before commit:**
```bash
cd backend
# Gate 1: Architecture tests
pytest tests/archunit/test_architecture.py -v

# Gate 2: Import linter (if import-linter installed)
PYTHONPATH=src lint-imports

# Gate 3: Unit tests
pytest tests/unit/ -v

# Gate 4: Type check
pyright src/
```

---

## 3. Per-Service Checklist

- [ ] Port ABC created in `domain/ports/repositories.py`
- [ ] SQLModel adapter implements port in `infrastructure/repositories/`
- [ ] Service constructor receives port, not `AsyncSession`
- [ ] All raw ORM removed from service (no `db.add`/`commit`/`execute`)
- [ ] `deps.py` has factory function wiring adapter → service
- [ ] Router uses `Depends()` with factory (not direct model imports)
- [ ] Architecture tests pass with assertions enabled
- [ ] Import-linter contracts pass (if enabled)
- [ ] Service added to `.importlinter` contract list (if using granular contracts)

---

## 4. Batch Migration Strategy

For multiple services, create a tracking issue:

```markdown
## Repository Pattern Migration — Batch X

| # | Service | Port | Adapter | Service Refactor | deps.py | Router | Test |
|---|---------|------|---------|-----------------|---------|--------|------|
| 1 | analytics_service.py | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | portfolio_service.py | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | journal_service.py | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

**Depends on:** #200 (re-enable test assertions)
**Blocking:** None
```

---

## 5. Boilerplate Reference

| Element | Boilerplate Path |
|---------|-----------------|
| Repository Port ABC | `boilerplate/python/order-service/src/domain/ports/order_repository.py` |
| SQLModel Adapter | `boilerplate/python/order-service/src/infrastructure/persistence/sqlalchemy_order_repository.py` |
| Use Case (Application) | `boilerplate/python/order-service/src/application/usecases/place_order_use_case.py` |
| deps.py Pattern | `boilerplate/python/order-service/src/api/deps.py` |

---

## 6. Verification

### 6.1 Single Service Verification
```bash
cd backend
grep "db\.add\|db\.commit\|db\.execute" src/app/services/analytics_service.py
# Expected: NO MATCHES
grep "AsyncSession" src/app/services/analytics_service.py
# Expected: NO MATCHES (except in type hints of deps.py factory)
grep "from app.domain.ports" src/app/services/analytics_service.py
# Expected: 1 match
```

### 6.2 Batch Verification
```bash
# Count remaining violations
cd backend
grep -rl "db\.add\|db\.commit\|db\.execute" src/app/services/ | wc -l
# Should decrease as services are migrated
grep -rl "from app.models" src/app/services/ | wc -l
# Should decrease as services are migrated
```

---

*Template version: 1.0 | Based on: boilerplate/python/order-service | Last updated: 2026-06-19*
