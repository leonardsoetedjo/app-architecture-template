---
name: "SOP: Add New Use Case"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: Add New Use Case

## Trigger

Adding a new application-level business operation that orchestrates domain objects (e.g., CancelOrder, ShipOrder, ProcessPayment).

## Files & Locations

### Backend (Java/Spring Boot)

| File | Path | Purpose |
|------|------|---------|
| Use Case Interface | `src/main/java/.../application/usecases/{Name}UseCase.java` | Operation contract |
| Use Case Implementation | `src/main/java/.../application/usecases/{Name}UseCaseImpl.java` | Business logic orchestration |
| Command DTO | `src/main/java/.../application/dtos/{Name}Command.java` | Input parameters |
| Result DTO | `src/main/java/.../application/dtos/{Name}Result.java` | Output payload |
| Use Case Test | `src/test/java/.../application/usecases/{Name}UseCaseTest.java` | Unit tests |

### Backend (Python/FastAPI)

| File | Path | Purpose |
|------|------|---------|
| Use Case Interface | `src/application/usecases/{name}_use_case.py` | Operation contract |
| Use Case Implementation | `src/application/usecases/{name}_use_case_impl.py` | Business logic |
| Command DTO | `src/application/dtos.py` | Input parameters (Pydantic) |
| Result DTO | `src/application/dtos.py` | Output payload |
| Use Case Test | `tests/unit/test_{name}_use_case.py` | Unit tests |

## Procedure

### 1. Define Command DTO (Input)

```java
// src/main/java/com/example/orderservice/application/dtos/CancelOrderCommand.java
package com.example.orderservice.application.dtos;

import java.util.UUID;

public record CancelOrderCommand(
    UUID orderId,
    String cancellationReason,
    UUID cancelledByUserId
) {
    public CancelOrderCommand {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }
        if (cancellationReason == null || cancellationReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }
    }
}
```

### 2. Define Result DTO (Output)

```java
// src/main/java/com/example/orderservice/application/dtos/CancelOrderResult.java
package com.example.orderservice.application.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CancelOrderResult(
    UUID orderId,
    String status,
    OffsetDateTime cancelledAt,
    String cancellationReason
) {}
```

### 3. Create Use Case Interface

```java
// src/main/java/com/example/orderservice/application/usecases/CancelOrderUseCase.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CancelOrderCommand;
import com.example.orderservice.application.dtos.CancelOrderResult;

public interface CancelOrderUseCase {
    CancelOrderResult execute(CancelOrderCommand command);
}
```

### 4. Create Use Case Implementation

```java
// src/main/java/com/example/orderservice/application/usecases/CancelOrderUseCaseImpl.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CancelOrderCommand;
import com.example.orderservice.application.dtos.CancelOrderResult;
import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.models.events.OrderCancelledEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class CancelOrderUseCaseImpl implements CancelOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    @Override
    public CancelOrderResult execute(CancelOrderCommand command) {
        // 1. Load aggregate
        OrderId orderId = new OrderId(command.orderId());
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        // 2. Execute domain logic
        order.cancel(command.cancellationReason());

        // 3. Persist changes
        orderRepository.save(order);

        // 4. Publish domain event
        eventPublisher.publish(new OrderCancelledEvent(
            order.id().value(),
            command.cancellationReason(),
            OffsetDateTime.now()
        ));

        // 5. Return result
        return new CancelOrderResult(
            order.id().value(),
            order.status(),
            OffsetDateTime.now(),
            command.cancellationReason()
        );
    }
}
```

### 5. Create Use Case Test

```java
// src/test/java/com/example/orderservice/application/usecases/CancelOrderUseCaseTest.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CancelOrderCommand;
import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.EventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CancelOrderUseCaseTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private CancelOrderUseCaseImpl useCase;

    @Test
    void shouldCancelOrderSuccessfully() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        Order order = mock(Order.class);
        when(orderRepository.findById(any(OrderId.class))).thenReturn(Optional.of(order));
        doNothing().when(eventPublisher).publish(any());

        CancelOrderCommand command = new CancelOrderCommand(
            orderId,
            "Customer requested cancellation",
            UUID.randomUUID()
        );

        // Act
        CancelOrderResult result = useCase.execute(command);

        // Assert
        assertNotNull(result);
        verify(order).cancel("Customer requested cancellation");
        verify(orderRepository).save(order);
        verify(eventPublisher).publish(any(OrderCancelledEvent.class));
    }

    @Test
    void shouldThrowExceptionWhenOrderNotFound() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        when(orderRepository.findById(any(OrderId.class))).thenReturn(Optional.empty());

        CancelOrderCommand command = new CancelOrderCommand(
            orderId,
            "Test reason",
            UUID.randomUUID()
        );

        // Act & Assert
        assertThrows(OrderNotFoundException.class, () -> useCase.execute(command));
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run use case tests**: `./mvnw test -Dtest=CancelOrderUseCaseTest -f services/order-service/pom.xml`
3. **Verify dependency injection**: Ensure use case is auto-wired in controller
4. **Check transaction boundaries**: Verify `@Transactional` annotation is present
5. **Verify event publishing**: Check domain events are published correctly

## Python Example (FastAPI)

```python
# src/application/usecases/cancel_order_use_case_impl.py
from uuid import UUID
from datetime import datetime, timezone
from domain.order import Order
from domain.order_id import OrderId
from domain.ports.repository import OrderRepository
from domain.ports.publisher import EventPublisher
from domain.events.order_cancelled_event import OrderCancelledEvent
from application.dtos import CancelOrderCommand, CancelOrderResult


class CancelOrderUseCaseImpl:
    def __init__(self, repository: OrderRepository, publisher: EventPublisher):
        self._repository = repository
        self._publisher = publisher

    def execute(self, command: CancelOrderCommand) -> CancelOrderResult:
        # 1. Load aggregate
        order_id = OrderId(command.order_id)
        order = self._repository.find_by_id(order_id)
        if not order:
            raise OrderNotFoundException(order_id)

        # 2. Execute domain logic
        order.cancel(command.cancellation_reason)

        # 3. Persist changes
        self._repository.save(order)

        # 4. Publish domain event
        self._publisher.publish(OrderCancelledEvent(
            order_id=order.id.value,
            reason=command.cancellation_reason,
            timestamp=datetime.now(timezone.utc)
        ))

        # 5. Return result
        return CancelOrderResult(
            order_id=order.id.value,
            status=order.status,
            cancelled_at=datetime.now(timezone.utc),
            cancellation_reason=command.cancellation_reason
        )
```

## Notes

- **Single Responsibility**: Each use case should do ONE thing only
- **Constructor Injection**: Always use constructor injection (no `@Autowired` fields)
- **Transaction Boundaries**: Use `@Transactional` for write operations
- **Domain Events**: Publish events AFTER persisting changes
- **Exception Handling**: Throw domain-specific exceptions, not generic ones
- **No Framework Imports**: Use case implementations should NOT import Spring/FastAPI directly
- **Test Isolation**: Unit tests should mock all dependencies (repository, publisher)

## Related SOPs

- SOP-01: [Add New Aggregate Root](01-add-new-aggregate-root.md)
- SOP-02: [Add New REST Endpoint](02-add-new-rest-endpoint.md)
- SOP-05: [Publish Domain Event](05-publish-domain-event.md)
