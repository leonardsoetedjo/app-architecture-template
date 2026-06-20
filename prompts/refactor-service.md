# Task: Refactor Into Clean Architecture Layers

## Version
1.0.0 — 2026-06-20

## Changelog

### 1.0.0 — 2026-06-20
- Initial template for refactoring code that violates Clean Architecture layer rules

## Prompt Template

### Role
You are a senior backend engineer performing a surgical refactor to move code into its correct Clean Architecture layer. You identify violations, move code, preserve behavior, and update all callers.

### Context
The project uses Clean Architecture with layers: domain/ (pure business logic), application/ (use cases, DTOs), infrastructure/ (controllers, repositories, adapters). Code often drifts: ORM leaks into domain, business logic in controllers, DTOs missing at boundaries.

### Task
Refactor the identified violations in `{file_path}` by moving code to the correct layer.

### Constraints
- **Never change behavior** — same inputs produce same outputs
- Domain layer: zero framework imports, only pure business logic, events, exceptions
- Application layer: use cases orchestrate, DTOs at every boundary, no ORM
- Infrastructure layer: controllers handle HTTP, repositories handle persistence, adapters handle externals
- Move code, don't duplicate — delete from old location after verifying callers updated
- Preserve existing tests or update them to match new structure
- Add repository port in `domain/ports/` if extracting from raw ORM calls
- Use constructor injection everywhere — never global session/connection
- Refactor one concern at a time, not multiple simultaneous changes

### Output Format
Return a summary followed by per-file diffs:
```
## Summary
Moved {X} to {Y} because {violation}. Callers updated: {N files}.

## Changes
### File: src/old/file.py (DELETED or MODIFIED)
- Removed: {what}
- Reason: {why}

### File: src/new/file.py (CREATED)
- Added: {what}
- Reason: {why}

### Test Impact
- Updated: {test files}
- New coverage needed: {what}
```

## Few-Shot Examples

### Example 1: Move Raw ORM from Service to Repository

#### Input
File: `src/application/order_service.py` contains:
```python
class OrderService:
    def create_order(self, db: Session, cmd: CreateOrderCommand):
        order = Order(**cmd.dict())
        db.add(order)          # ORM leak
        db.commit()            # ORM leak
        db.refresh(order)      # ORM leak
        return OrderResponse.from_orm(order)
```

#### Output
## Summary
Moved raw SQLAlchemy session logic from `OrderService.create_order` to `OrderRepository.save`. `OrderService` now depends on `OrderRepository` port, not `Session`.

## Changes
### File: src/application/order_service.py (MODIFIED)
- Removed: `db.add()`, `db.commit()`, `db.refresh()`
- Removed: `db: Session` parameter
- Added: `repo: OrderRepository` via constructor injection
- Reason: Application layer must not depend on ORM directly

```python
class OrderService:
    def __init__(self, repo: OrderRepository):
        self.repo = repo

    def create_order(self, cmd: CreateOrderCommand) -> OrderResponse:
        order = Order.create(customer_id=cmd.customer_id, items=cmd.items, total=cmd.total)
        self.repo.save(order)
        return OrderResponse.from_entity(order)
```

### File: src/domain/ports/order_repository.py (CREATED)
- Added: Abstract `OrderRepository` port
- Reason: Domain defines contract, infrastructure implements it

```python
from abc import ABC, abstractmethod
from src.domain.models.order import Order

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None: ...

    @abstractmethod
    def find_by_id(self, order_id: str) -> Optional[Order]: ...
```

### File: src/infrastructure/persistence/sqlalchemy_order_repository.py (CREATED)
- Added: SQLAlchemy implementation of `OrderRepository`
- Reason: Infrastructure layer owns persistence details

```python
class SqlalchemyOrderRepository(OrderRepository):
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def save(self, order: Order) -> None:
        with self.session_factory() as db:
            orm_order = OrderOrm.from_domain(order)
            db.add(orm_order)
            db.commit()
            db.refresh(orm_order)
```

### Test Impact
- Updated: `tests/unit/application/test_order_service.py` — mocked `OrderRepository`
- New: `tests/unit/infrastructure/test_sqlalchemy_order_repository.py` — test SQLAlchemy mapping

### Example 2: Extract Business Logic from Controller to Use Case

#### Input
File: `src/infrastructure/api/order_controller.py` contains:
```python
@router.post("/orders")
def create_order(body: OrderRequestBody, db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(400, "items required")   # business rule in controller
    total = sum(item.price * item.qty for item in body.items)  # calculation in controller
    order = OrderOrm(items=body.items, total=total)
    db.add(order); db.commit()
    return {"order_id": order.id}
```

#### Output
## Summary
Extracted business rules (item validation, total calculation) and persistence from controller into `CreateOrderUseCase`. Controller now delegates everything to use case.

## Changes
### File: src/infrastructure/api/order_controller.py (MODIFIED)
- Removed: `if not body.items` validation → moved to DTO
- Removed: `total` calculation → moved to use case
- Removed: `db.add()`, `db.commit()` → moved to repository
- Reason: Controller is thin — HTTP only

```python
@router.post("/orders", response_model=OrderResponse)
def create_order(cmd: CreateOrderCommand, usecase: CreateOrderUseCase = Depends()):
    return usecase.execute(cmd)
```

### File: src/application/order_usecases.py (CREATED/MODIFIED)
- Added: `CreateOrderUseCase` with validation + calculation
- Added: `CreateOrderCommand` DTO with Pydantic validators
- Reason: Application layer owns orchestration and DTOs

```python
class CreateOrderCommand(BaseModel):
    items: List[OrderItemCommand]
    total: Optional[Decimal] = None  # calculated, not passed

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("items required")
        return v

class CreateOrderUseCase:
    def __init__(self, repo: OrderRepository, tax_service: TaxServicePort):
        self.repo = repo
        self.tax_service = tax_service

    def execute(self, cmd: CreateOrderCommand) -> OrderResponse:
        subtotal = sum(item.price * item.qty for item in cmd.items)
        total = self.tax_service.calculate(subtotal)
        order = Order.create(items=cmd.items, total=total)
        self.repo.save(order)
        return OrderResponse(order_id=order.id)
```

### Test Impact
- Updated: `tests/integration/test_order_api.py` — mocked `CreateOrderUseCase`
- New: `tests/unit/application/test_create_order_usecase.py` — tests validation, calculation logic

## Decision Flowchart

When refactoring, use this order:

```
1. Identify violation
   ↓
2. Determine target layer (domain/application/infrastructure)
   ↓
3. Create port/interface if crossing domain↔infrastructure boundary
   ↓
4. Move code to target layer
   ↓
5. Update callers (constructor injection, DTOs)
   ↓
6. Delete from old location
   ↓
7. Verify no phantom imports remain
   ↓
8. Run tests (arch unit + unit + integration)
```
