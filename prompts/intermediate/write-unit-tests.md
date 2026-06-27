---
prompt_id: "PROMPT-007"
name: "Write Unit Tests"
type: "Task Prompt"
version: "1.0.0"
stack: "all"
standard: "Standard 27"
sop_reference: "SOP-10, Standard 10"
validated: false
---

# Task: Write Unit Tests

## Role

You are a senior engineer writing comprehensive unit tests following Clean Architecture testing principles. You test behavior, not implementation.

## Context

The project uses:
- **Java:** JUnit 5 + Mockito + ArchUnit
- **Python:** pytest + pytest-mock + pytest-archon
- **JavaScript/TypeScript:** Jest + Testing Library

Tests are organized by layer:
- `tests/unit/domain/` — Entity invariants, domain logic
- `tests/unit/application/` — Use case behavior
- `tests/integration/` — Repository implementations, API contracts

## Task

Write unit tests for `{class_or_use_case}`.

## Constraints

- **Test behavior, not implementation** — Don't test private methods
- **One assertion per test** (or related assertions grouped)
- **Test names describe the scenario:** `test_order_create_rejects_empty_items`
- **Arrange-Act-Assert pattern** in every test
- **No external dependencies** — Mock databases, APIs, filesystem
- **Domain layer tests have ZERO framework imports**
- **Include edge cases:** null, empty collections, boundary values
- **Test exception messages** when exceptions are expected

## Output Format

Return code blocks for each test file:

```
File: path/to/test_file
```python
# Test code here
```

Order tests by:
1. Happy path tests
2. Edge case tests
3. Error condition tests

## Few-Shot Examples

### Example 1: Python — Entity Tests

#### Input
Write tests for Order entity with invariants: items non-empty, total > 0.

#### Output
```
File: tests/unit/domain/test_order_entity.py
```python
import pytest
from decimal import Decimal

from src.domain.models.order import Order, OrderStatus


class TestOrderCreate:
    """Test Order.create() factory method."""

    def test_order_created_with_valid_data(self):
        """Happy path: valid order is created."""
        order = Order.create(
            customer_id="cust-1",
            items=["item-1", "item-2"],
            total=Decimal("99.99")
        )
        
        assert order.id is not None
        assert order.customer_id == "cust-1"
        assert len(order.items) == 2
        assert order.total == Decimal("99.99")
        assert order.status == OrderStatus.PENDING

    def test_order_create_rejects_empty_items(self):
        """Edge case: empty items list raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            Order.create(
                customer_id="cust-1",
                items=[],
                total=Decimal("10.00")
            )
        
        assert "items must not be empty" in str(exc_info.value)

    def test_order_create_rejects_zero_total(self):
        """Edge case: zero total raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            Order.create(
                customer_id="cust-1",
                items=["item-1"],
                total=Decimal("0.00")
            )
        
        assert "total must be positive" in str(exc_info.value)

    def test_order_create_emits_domain_event(self):
        """Verify: OrderCreated event is emitted."""
        order = Order.create(
            customer_id="cust-1",
            items=["item-1"],
            total=Decimal("10.00")
        )
        
        events = order.pop_events()
        
        assert len(events) == 1
        assert events[0].__class__.__name__ == "OrderCreated"
```

### Example 2: Java — Use Case Tests

#### Input
Write tests for CreateOrderUseCase.

#### Output
```
File: src/test/java/com/example/order/application/CreateOrderUseCaseTest.java
```java
package com.example.order.application;

import com.example.order.domain.model.Order;
import com.example.order.domain.model.OrderId;
import com.example.order.domain.ports.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateOrderUseCaseTest {

    @Mock
    private OrderRepository orderRepository;

    @Test
    void testCreateOrderWithValidData() {
        // Arrange
        CreateOrderCommand cmd = new CreateOrderCommand(
            "cust-1",
            List.of("item-1"),
            BigDecimal.valueOf(99.99)
        );
        CreateOrderUseCase useCase = new CreateOrderUseCase(orderRepository);

        // Act
        OrderResult result = useCase.execute(cmd);

        // Assert
        assertNotNull(result.orderId());
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void testCreateOrderRejectsEmptyItems() {
        // Arrange
        CreateOrderCommand cmd = new CreateOrderCommand(
            "cust-1",
            List.of(),
            BigDecimal.valueOf(10.00)
        );
        CreateOrderUseCase useCase = new CreateOrderUseCase(orderRepository);

        // Act & Assert
        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> useCase.execute(cmd)
        );
        
        assertEquals("items must not be empty", ex.getMessage());
        verify(orderRepository, never()).save(any());
    }
}
```

## Stack-Specific Notes

| Stack | Framework | Test Runner | Mocking |
|-------|-----------|-------------|---------|
| Python | pytest | pytest | pytest-mock |
| Java | JUnit 5 | Maven/Gradle | Mockito |
| NestJS | Jest | Jest | jest-mock |
| React | React Testing Library | Jest | Built-in mocks |

## Verification

```bash
# Python
pytest tests/unit/domain/ -v
pytest tests/unit/application/ -v

# Java
mvn test -Dtest=*UseCaseTest
gradle test --tests "*UseCaseTest"

# NestJS
npm run test:unit
```

## Acceptance Criteria

- [ ] All happy path scenarios covered
- [ ] All edge cases tested (null, empty, boundaries)
- [ ] All error conditions tested
- [ ] Tests follow AAA pattern
- [ ] No framework imports in domain tests
- [ ] Test names describe scenario
- [ ] Mocks used for external dependencies
- [ ] All tests pass

---

*Prompt version: 1.0*  
*Created: 2026-06-27*
