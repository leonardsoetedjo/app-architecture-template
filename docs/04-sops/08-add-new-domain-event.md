---
name: "SOP: Add New Domain Event"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture_team"
---

# SOP: Add New Domain Event

## Trigger

Adding a new domain event to notify other parts of the system about significant business occurrences (e.g., OrderShipped, PaymentFailed, InventoryReserved).

## Files & Locations

### Backend (Java/Spring Boot)

| File | Path | Purpose |
|------|------|---------|
| Domain Event Record | `src/main/java/.../domain/models/events/{Name}Event.java` | Event definition |
| Event Publisher Port | `src/main/java/.../domain/ports/EventPublisher.java` | Interface (if not exists) |
| Event Handler | `src/main/java/.../application/handlers/{Name}EventHandler.java` | Event consumer |
| Integration Test | `src/test/java/.../domain/events/{Name}EventTest.java` | Event tests |

### Backend (Python/FastAPI)

| File | Path | Purpose |
|------|------|---------|
| Domain Event Class | `src/domain/events/{name}_event.py` | Event definition |
| Event Publisher Port | `src/domain/ports/publisher.py` | Interface |
| Event Handler | `src/application/handlers/{name}_handler.py` | Consumer |
| Integration Test | `tests/unit/test_{name}_event.py` | Event tests |

## Procedure

### 1. Define Domain Event

**Domain events should:**
- Use **past tense** naming (OrderShipped, NOT ShipOrder)
- Be **immutable** (records in Java, frozen dataclasses in Python)
- Contain **only data** (no business logic)
- Include **timestamp** and **correlation ID** for tracing

#### Java Example

```java
// src/main/java/com/example/orderservice/domain/models/events/OrderShippedEvent.java
package com.example.orderservice.domain.models.events;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Domain event published when an order has been shipped.
 * Used to trigger downstream processes (notifications, analytics, etc.)
 */
public record OrderShippedEvent(
    UUID id,                    // Event ID for idempotency
    UUID orderId,              // Aggregate ID
    String trackingNumber,     // Shipping tracking number
    String carrier,            // Shipping carrier name
    OffsetDateTime shippedAt,  // When shipment occurred
    OffsetDateTime occurredAt  // Event timestamp
) {
    /**
     * Factory method with automatic ID and timestamp generation.
     */
    public static OrderShippedEvent create(
        UUID orderId,
        String trackingNumber,
        String carrier
    ) {
        return new OrderShippedEvent(
            UUID.randomUUID(),
            orderId,
            trackingNumber,
            carrier,
            OffsetDateTime.now(),
            OffsetDateTime.now()
        );
    }

    /**
     * Validation in compact constructor.
     */
    public OrderShippedEvent {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null");
        }
        if (trackingNumber == null || trackingNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Tracking number is required");
        }
        if (carrier == null || carrier.trim().isEmpty()) {
            throw new IllegalArgumentException("Carrier is required");
        }
    }
}
```

#### Python Example

```python
# src/domain/events/order_shipped_event.py
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4


@dataclass(frozen=True)
class OrderShippedEvent:
    """Domain event published when an order has been shipped."""
    
    id: UUID
    order_id: UUID
    tracking_number: str
    carrier: str
    shipped_at: datetime
    occurred_at: datetime

    def __post_init__(self):
        if self.order_id is None:
            raise ValueError("Order ID cannot be null")
        if not self.tracking_number or not self.tracking_number.strip():
            raise ValueError("Tracking number is required")
        if not self.carrier or not self.carrier.strip():
            raise ValueError("Carrier is required")

    @classmethod
    def create(
        cls,
        order_id: UUID,
        tracking_number: str,
        carrier: str
    ) -> "OrderShippedEvent":
        """Factory method with automatic ID and timestamp generation."""
        now = datetime.now(timezone.utc)
        return cls(
            id=uuid4(),
            order_id=order_id,
            tracking_number=tracking_number,
            carrier=carrier,
            shipped_at=now,
            occurred_at=now
        )
```

### 2. Publish Event from Use Case

```java
// src/main/java/com/example/orderservice/application/usecases/ShipOrderUseCaseImpl.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.events.OrderShippedEvent;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.EventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ShipOrderUseCaseImpl implements ShipOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    @Override
    public ShipOrderResult execute(ShipOrderCommand command) {
        // 1. Load aggregate
        Order order = orderRepository.findById(new OrderId(command.orderId()))
            .orElseThrow(() -> new OrderNotFoundException(command.orderId()));

        // 2. Execute domain logic
        order.ship(command.trackingNumber(), command.carrier());

        // 3. Persist changes
        orderRepository.save(order);

        // 4. Publish domain event (AFTER persistence)
        OrderShippedEvent event = OrderShippedEvent.create(
            order.id().value(),
            command.trackingNumber(),
            command.carrier()
        );
        eventPublisher.publish(event);

        // 5. Return result
        return new ShipOrderResult(order.id().value(), order.status());
    }
}
```

### 3. Create Event Handler (Optional)

```java
// src/main/java/com/example/orderservice/application/handlers/OrderShippedEventHandler.java
package com.example.orderservice.application.handlers;

import com.example.orderservice.domain.models.events.OrderShippedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderShippedEventHandler {

    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    /**
     * Handle event AFTER transaction commits.
     * Runs asynchronously to avoid blocking the main transaction.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderShipped(OrderShippedEvent event) {
        log.info("Handling OrderShippedEvent: orderId={}, trackingNumber={}", 
            event.orderId(), event.trackingNumber());

        // Send shipping confirmation email
        notificationService.sendShippingConfirmation(
            event.orderId(),
            event.trackingNumber(),
            event.carrier()
        );

        // Track analytics
        analyticsService.trackOrderShipped(event.orderId());
    }
}
```

### 4. Write Event Test

```java
// src/test/java/com/example/orderservice/domain/models/events/OrderShippedEventTest.java
package com.example.orderservice.domain.models.events;

import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrderShippedEventTest {

    @Test
    void shouldCreateEventWithFactoryMethod() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        String trackingNumber = "1Z999AA10123456784";
        String carrier = "UPS";

        // Act
        OrderShippedEvent event = OrderShippedEvent.create(
            orderId,
            trackingNumber,
            carrier
        );

        // Assert
        assertNotNull(event.id());
        assertEquals(orderId, event.orderId());
        assertEquals(trackingNumber, event.trackingNumber());
        assertEquals(carrier, event.carrier());
        assertNotNull(event.shippedAt());
        assertNotNull(event.occurredAt());
    }

    @Test
    void shouldThrowExceptionForNullOrderId() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            OrderShippedEvent.create(
                null,
                "1Z999AA10123456784",
                "UPS"
            )
        );
    }

    @Test
    void shouldThrowExceptionForEmptyTrackingNumber() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            OrderShippedEvent.create(
                UUID.randomUUID(),
                "",
                "UPS"
            )
        );
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run event tests**: `./mvnw test -Dtest=OrderShippedEventTest -f services/order-service/pom.xml`
3. **Verify event publishing**: Integration test with mocked EventPublisher
4. **Check event handler registration**: Ensure `@TransactionalEventListener` is detected by Spring
5. **Test async execution**: Verify handler runs in separate thread

## Event Naming Conventions

| ✅ Correct (Past Tense) | ❌ Incorrect |
|------------------------|--------------|
| `OrderShipped` | `ShipOrder` |
| `PaymentConfirmed` | `ConfirmPayment` |
| `InventoryReserved` | `ReserveInventory` |
| `OrderCancelled` | `CancelOrder` |

## Event Payload Guidelines

**DO Include:**
- ✅ Event ID (for idempotency)
- ✅ Aggregate ID (which entity changed)
- ✅ Timestamp (when it happened)
- ✅ Relevant data (what changed)
- ✅ Correlation ID (for tracing across services)

**DO NOT Include:**
- ❌ Entire aggregate (keep it lean)
- ❌ Sensitive data (PII, passwords)
- ❌ Business logic (events are data-only)
- ❌ External service calls (handlers do this)

## Python Example (FastAPI)

```python
# src/application/handlers/order_shipped_handler.py
from domain.events.order_shipped_event import OrderShippedEvent
from domain.ports.publisher import EventPublisher
from infrastructure.services.notification_service import NotificationService
from infrastructure.services.analytics_service import AnalyticsService


class OrderShippedHandler:
    def __init__(
        self,
        notification_service: NotificationService,
        analytics_service: AnalyticsService
    ):
        self._notification_service = notification_service
        self._analytics_service = analytics_service

    async def handle(self, event: OrderShippedEvent) -> None:
        """Handle order shipped event asynchronously."""
        # Send shipping confirmation email
        await self._notification_service.send_shipping_confirmation(
            order_id=event.order_id,
            tracking_number=event.tracking_number,
            carrier=event.carrier
        )

        # Track analytics
        await self._analytics_service.track_order_shipped(event.order_id)
```

## Notes

- **Eventual Consistency**: Domain events enable eventual consistency between bounded contexts
- **Idempotency**: Event handlers must be idempotent (safe to retry)
- **Async Processing**: Use `@Async` or background tasks to avoid blocking
- **Transaction Boundaries**: Events should be published AFTER transaction commits
- **Schema Evolution**: Design events for backward compatibility (additive changes only)
- **Testing**: Test events in isolation (unit) and with handlers (integration)

## Related SOPs

- SOP-01: [Add New Aggregate Root](01-add-new-aggregate-root.md)
- SOP-07: [Add New Use Case](07-add-new-use-case.md)
- SOP-05: [Publish Domain Event](05-publish-domain-event.md)
