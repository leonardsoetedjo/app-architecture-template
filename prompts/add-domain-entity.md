# Task: Add Domain Entity

## Version
1.0.0 — 2026-06-20

## Changelog

### 1.0.0 — 2026-06-20
- Initial template for adding domain entities following Clean Architecture purity rules

## Prompt Template

### Role
You are a senior backend engineer defining a new domain entity in the cleanest possible layer of a Clean Architecture service. The entity has zero framework dependencies and is fully unit-testable.

### Context
The project uses Clean Architecture: domain/ (entities, ports, events, exceptions), application/ (use cases, DTOs), infrastructure/ (controllers, persistence). The domain layer is sacred — no framework annotations, no ORM imports, no validation decorators.

### Task
Create a `{EntityName}` entity and its port (repository interface) in the domain layer.

### Constraints
- **ZERO framework imports** in `domain/`: no FastAPI, SQLAlchemy, Pydantic, Spring, JPA, TypeORM, NestJS decorators
- Entity fields are plain types (str, int, Decimal, enum, Optional)
- Use `decimal.Decimal` for money, never float/number
- Entity has factory method `create(...)` that enforces invariants
- Entity emits domain events on state changes (immutable event list)
- Repository is an ABC/Protocol/interface in `domain/ports/`, no implementation
- Include unit tests for entity invariants (happy path + edge cases)
- Docstring per class: responsibility + invariant rules

### Output Format
Return code blocks for each file:
```
File: path/to/file.ext
```
// code here
```
Order: entity → tests → events (if any) → repository port.

## Few-Shot Examples

### Example 1: Python — Order Entity

#### Input
Create Order entity with: id (UUID), customer_id (str), items (list[str]), total (Decimal), status (enum), created_at (datetime). Events: OrderCreated, OrderCancelled.

#### Output
File: src/domain/models/order.py
```python
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum, auto
from typing import List
from uuid import UUID, uuid4

from src.domain.events.order_event import OrderCreated, OrderCancelled


class OrderStatus(Enum):
    PENDING = auto()
    CONFIRMED = auto()
    SHIPPED = auto()
    CANCELLED = auto()


@dataclass(frozen=True)
class Order:
    """Order aggregate root. Invariant: total > 0 and items non-empty."""
    id: UUID
    customer_id: str
    items: List[str]
    total: Decimal
    status: OrderStatus
    created_at: datetime
    _events: List[object] = field(default_factory=list, repr=False)

    @staticmethod
    def create(customer_id: str, items: List[str], total: Decimal) -> "Order":
        if not items:
            raise ValueError("items must not be empty")
        if total <= 0:
            raise ValueError("total must be positive")
        order = Order(
            id=uuid4(),
            customer_id=customer_id,
            items=list(items),
            total=total,
            status=OrderStatus.PENDING,
            created_at=datetime.utcnow(),
        )
        order._events.append(OrderCreated(order_id=order.id))
        return order

    def cancel(self) -> "Order":
        if self.status == OrderStatus.SHIPPED:
            raise ValueError("cannot cancel shipped order")
        return Order(
            id=self.id,
            customer_id=self.customer_id,
            items=list(self.items),
            total=self.total,
            status=OrderStatus.CANCELLED,
            created_at=self.created_at,
            _events=list(self._events) + [OrderCancelled(order_id=self.id)],
        )

    def pop_events(self) -> List[object]:
        """Return and clear domain events (for outbox/relay)."""
        events = list(self._events)
        self._events.clear()
        return events
```

File: src/domain/ports/order_repository.py
```python
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from src.domain.models.order import Order


class OrderRepository(ABC):
    """Port for Order persistence. Implementations in infrastructure/persistence/."""

    @abstractmethod
    def save(self, order: Order) -> None:
        ...

    @abstractmethod
    def find_by_id(self, order_id: UUID) -> Optional[Order]:
        ...

    @abstractmethod
    def list_by_customer(self, customer_id: str) -> List[Order]:
        ...
```

File: tests/unit/domain/test_order_entity.py
```python
import pytest
from decimal import Decimal
from uuid import UUID

from src.domain.models.order import Order, OrderStatus


def test_order_created_with_valid_data():
    order = Order.create(customer_id="cust-1", items=["item-1"], total=Decimal("10.00"))
    assert order.id is not None
    assert isinstance(order.id, UUID)
    assert order.status == OrderStatus.PENDING
    assert len(order.pop_events()) == 1


def test_order_create_rejects_empty_items():
    with pytest.raises(ValueError, match="items must not be empty"):
        Order.create(customer_id="cust-1", items=[], total=Decimal("10.00"))


def test_order_create_rejects_zero_total():
    with pytest.raises(ValueError, match="total must be positive"):
        Order.create(customer_id="cust-1", items=["item-1"], total=Decimal("0.00"))


def test_cancel_emits_event():
    order = Order.create(customer_id="cust-1", items=["item-1"], total=Decimal("10.00"))
    order.pop_events()  # clear create event
    cancelled = order.cancel()
    events = cancelled.pop_events()
    assert len(events) == 1
    assert events[0].__class__.__name__ == "OrderCancelled"
```

### Example 2: Java — Product Entity

#### Input
Create Product aggregate with: id, sku, name, price (BigDecimal), quantityAvailable. Event: StockDecreased.

#### Output
File: src/main/java/.../domain/model/Product.java
```java
package com.example.order.domain.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public final class Product {
    private final UUID id;
    private final String sku;
    private final String name;
    private final BigDecimal price;
    private int quantityAvailable;
    private final List&lt;DomainEvent&gt; events = new ArrayList&lt;&gt;();

    private Product(UUID id, String sku, String name, BigDecimal price, int qty) {
        this.id = id; this.sku = sku; this.name = name; this.price = price;
        this.quantityAvailable = qty;
    }

    public static Product create(String sku, String name, BigDecimal price, int qty) {
        if (sku == null || sku.isBlank()) throw new IllegalArgumentException("sku required");
        if (price.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("price > 0");
        var p = new Product(UUID.randomUUID(), sku, name, price, qty);
        p.events.add(new ProductCreated(p.id));
        return p;
    }

    public void decreaseStock(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount > 0");
        if (quantityAvailable < amount) throw new IllegalStateException("insufficient stock");
        quantityAvailable -= amount;
        events.add(new StockDecreased(id, amount, quantityAvailable));
    }

    public List&lt;DomainEvent&gt; popEvents() {
        var copy = new ArrayList&lt;&gt;(events);
        events.clear();
        return copy;
    }

    // getters omitted for brevity
}
```
