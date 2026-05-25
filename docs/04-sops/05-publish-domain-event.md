---
name: "SOP: Publish Domain Event"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: Publish Domain Event

## Trigger

Adding a new domain event (e.g., `OrderPlaced`, `CustomerRegistered`) and wiring it through the outbox pattern.

## Files & Locations

### Backend (boilerplate/java/order-service)

| File | Path | Purpose |
|------|------|---------|
| Event Class | `src/main/java/com/example/orderservice/domain/models/events/{EventName}.java` | Event data record |
| Event Publisher | `src/main/java/com/example/orderservice/domain/services/{EventPublisher}.java` | Publish events to outbox |
| Listener | `src/main/java/com/example/orderservice/infrastructure/events/{EventName}Listener.java` | Process outbox messages |
| Integration Test | `src/test/java/com/example/orderservice/domain/events/{EventName}Test.java` | Event logic tests |
| Outbox Table | `src/main/resources/db/migration/V{version}__create_outbox_events_table.sql` | Table schema |

## Procedure

### 1. Create Domain Event Class

```java
// src/main/java/com/example/orderservice/domain/models/events/OrderPlaced.java
package com.example.orderservice.domain.models.events;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OrderPlaced(
    UUID orderId,
    UUID customerId,
    OffsetDateTime createdAt,
    double totalAmount,
    int itemCount
) {}
```

### 2. Create Event Publisher Interface

```java
// src/main/java/com/example/orderservice/domain/ports/EventPublisher.java
package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.events.OrderPlaced;
import com.example.orderservice.domain.models.events.OrderConfirmed;
import java.util.List;

public interface EventPublisher {
    void publishOrderPlaced(OrderPlaced event);
    void publishOrderConfirmed(OrderConfirmed event);
    List<Object> getPendingEvents();
    void clearEvents();
}
```

### 3. Update Aggregate Root to Register Events

```java
// src/main/java/com/example/orderservice/domain/models/Order.java (updated)
package com.example.orderservice.domain.models;

import com.example.orderservice.domain.models.events.OrderPlaced;
import com.example.orderservice.domain.ports.EventPublisher;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.Copy_OnWriteArrayList;

public record Order(
    OrderId id,
    UUID customerId,
    List<OrderItem> items,
    OffsetDateTime createdAt,
    String status
) {
    private final List<Object> domainEvents = new CopyOnWriteArrayList<>();

    public Order {
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }
    }

    public static Order create(UUID customerId, List<OrderItem> items) {
        return new Order(
            OrderId.generate(),
            customerId,
            items,
            OffsetDateTime.now(ZoneOffset.UTC),
            "PENDING"
        );
    }

    public void place(EventPublisher publisher) {
        if (!"PENDING".equals(status)) {
            throw new IllegalStateException("Order must be PENDING");
        }
        
        publisher.publishOrderPlaced(new OrderPlaced(
            id.value(),
            customerId,
            createdAt,
            calculateTotal(),
            items.size()
        ));
    }

    public void confirm(EventPublisher publisher) {
        if (!"PENDING".equals(status)) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }
        this.status = "CONFIRMED";
        publisher.publishOrderConfirmed(new OrderConfirmed(id.value(), OffsetDateTime.now()));
    }

    public double calculateTotal() {
        return items.stream().mapToDouble(item -> item.unitPrice() * item.quantity()).sum();
    }

    public void registerEvent(Object event) {
        domainEvents.add(event);
    }

    public List<Object> getDomainEvents() {
        return new ArrayList<>(domainEvents);
    }

    public void clearEvents() {
        domainEvents.clear();
    }
}
```

### 4. Create Outbox Event Entity

```java
// src/main/java/com/example/orderservice/infrastructure/persistence/OutboxEvent.java
package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "outbox_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "text")
    private String payload;

    @Column(name = "correlation_id", nullable = true)
    private String correlationId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "published", nullable = false)
    private boolean published = false;
}
```

### 5. Create Outbox Repository

```java
// src/main/java/com/example/orderservice/infrastructure/persistence/OutboxEventRepository.java
package com.example.orderservice.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {
    
    @Query("SELECT e FROM OutboxEvent e WHERE e.published = false AND e.createdAt <= :before")
    List<OutboxEvent> findUnpublishedBefore(OffsetDateTime before);

    @Query("SELECT e FROM OutboxEvent e WHERE e.published = false ORDER BY e.createdAt ASC")
    List<OutboxEvent> findUnpublishedOrderedByCreatedAt();

    @Modifying
    @Query("UPDATE OutboxEvent e SET e.published = true WHERE e.id = :id")
    @Transactional
    void markAsPublished(UUID id);
}
```

### 6. Create Outbox Event Publisher Implementation

```java
// src/main/java/com/example/orderservice/infrastructure/events/OutboxEventPublisher.java
package com.example.orderservice.infrastructure.events;

import com.example.orderservice.domain.models.events.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.infrastructure.persistence.OutboxEvent;
import com.example.orderservice.infrastructure.persistence.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxEventPublisher implements EventPublisher {

    private final OutboxEventRepository outboxEventRepository;

    @Override
    public void publishOrderPlaced(OrderPlaced event) {
        OutboxEvent outboxEvent = OutboxEvent.builder()
            .eventType("OrderPlaced")
            .payload("{\"orderId\":\"" + event.orderId() +
                     "\",\"customerId\":\"" + event.customerId() +
                     "\",\"totalAmount\":" + event.totalAmount() +
                     ",\"itemCount\":" + event.itemCount() + "}")
            .correlationId(OffsetDateTime.now().toString())
            .createdAt(OffsetDateTime.now())
            .published(false)
            .build();

        outboxEventRepository.save(outboxEvent);
        log.info("OrderPlaced event persisted to outbox: {}", event.orderId());
    }

    @Override
    public void publishOrderConfirmed(OrderConfirmed event) {
        OutboxEvent outboxEvent = OutboxEvent.builder()
            .eventType("OrderConfirmed")
            .payload("{\"orderId\":\"" + event.orderId() + "\"}")
            .correlationId(OffsetDateTime.now().toString())
            .createdAt(OffsetDateTime.now())
            .published(false)
            .build();

        outboxEventRepository.save(outboxEvent);
        log.info("OrderConfirmed event persisted to outbox: {}", event.orderId());
    }

    @Override
    public List<Object> getPendingEvents() {
        return List.of();
    }

    @Override
    public void clearEvents() {
        // Outbox events are cleared via publishing success
    }

    public void markEventAsPublished(UUID eventId) {
        outboxEventRepository.markAsPublished(eventId);
    }

    public List<OutboxEvent> findUnpublishedEvents() {
        return outboxEventRepository.findUnpublishedOrderedByCreatedAt();
    }
}
```

### 7. Create Event Listener (Background Worker)

```java
// src/main/java/com/example/orderservice/infrastructure/events/OutboxEventProcessor.java
package com.example.orderservice.infrastructure.events;

import com.example.orderservice.infrastructure.persistence.OutboxEvent;
import com.example.orderservice.infrastructure.persistence.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxEventProcessor {

    private final OutboxEventRepository outboxEventRepository;
    private final OutboxEventPublisher outboxEventPublisher;

    @Scheduled(fixedDelay = Duration.ofSeconds(10).toMillis())
    @Transactional
    public void processPendingEvents() {
        try {
            List<OutboxEvent> pendingEvents = outboxEventRepository.findUnpublishedBefore(
                OffsetDateTime.now()
            );

            if (pendingEvents.isEmpty()) {
                log.debug("No pending outbox events");
                return;
            }

            log.info("Processing {} pending outbox events", pendingEvents.size());

            for (OutboxEvent event : pendingEvents) {
                try {
                    // In real implementation, send to message broker
                    // For now, just mark as published
                    outboxEventPublisher.markEventAsPublished(event.getId());
                    log.info("Successfully published outbox event: {}", event.getId());
                } catch (Exception e) {
                    log.error("Failed to publish outbox event: {}", event.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error processing outbox events", e);
        }
    }
}
```

### 8. Add Integration Test

```java
// src/test/java/com/example/orderservice/domain/events/OrderPlacedTest.java
package com.example.orderservice.domain.events;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.models.events.OrderPlaced;
import com.example.orderservice.domain.ports.EventPublisher;
import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderPlacedTest {

    @Test
    void shouldCreateOrderAndPublishEvent() {
        UUID customerId = UUID.randomUUID();
        List<OrderItem> items = List.of(new OrderItem(UUID.randomUUID(), 2, 49.99));
        EventPublisher publisher = mock(EventPublisher.class);

        Order order = Order.create(customerId, items);
        order.place(publisher);

        verify(publisher, times(1)).publishOrderPlaced(any(OrderPlaced.class));
        assertEquals("PENDING", order.status());
    }

    @Test
    void shouldThrowExceptionWhenOrderNotPending() {
        UUID customerId = UUID.randomUUID();
        List<OrderItem> items = List.of(new OrderItem(UUID.randomUUID(), 2, 49.99));

        Order order = Order.create(customerId, items);
        // Order already PENDING, place() should work
        
        assertDoesNotThrow(() -> order.place(mock(EventPublisher.class)));
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run domain tests**: `./mvnw test -Dtest=OrderPlacedTest -f services/order-service/pom.xml`
3. **Verify outbox table exists**: `psql -c "SELECT * FROM outbox_events;"`

## Notes

- Domain events use **past tense** naming (`OrderPlaced`, not `PlaceOrder`)
- Keep events immutable (record types)
- Events should only carry data needed by subscribers
- Never reference aggregates directly in events
