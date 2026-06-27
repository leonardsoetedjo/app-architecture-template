---
title: "Order State Machine Design"
type: "Guideline"
created: "2026-06-27"
status: "active"
---
# Order State Machine Design

**Status**: ✅ **Complete** (2026-05-25)  
**Date**: 2026-05-25  
**Related Issue**: [#73](https://github.com/leonardsoetedjo/app-architecture-template/issues/73)

---

## Implementation Summary

### ✅ Completed Components

**State Machine Design:**
- ✅ 9 states (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED, RETURNED, REFUNDED)
- ✅ 11 valid transitions with guard conditions
- ✅ 3 terminal states (COMPLETED, CANCELLED, REFUNDED)
- ✅ Design document: `docs/01-agnostic/03-guidelines/workflow-state-machine.md`
- ✅ Implementation guide: `docs/ORDER_STATE_MACHINE_GUIDE.md`

**Java Implementation (Spring Statemachine):**
- ✅ Spring Statemachine dependency (3.4.0)
- ✅ `OrderState` and `OrderEvent` enums
- ✅ `OrderStateMachineConfig` with all transitions
- ✅ `OrderStateService` for state operations
- ✅ State change listener for audit logging
- ✅ `OrderStateController` REST API endpoints

**Python Implementation (transitions):**
- ✅ transitions library dependency (0.9.0)
- ✅ `OrderStateMachine` class with full state/transition table
- ✅ Transition history tracking
- ✅ Guard condition methods
- ✅ FastAPI router with state management endpoints

**Saga Pattern (Order Creation):**
- ✅ Java: `OrderCreationSaga` with orchestration pattern
- ✅ Python: `OrderCreationSaga` with compensating transactions
- ✅ Inventory and payment service ports
- ✅ Rollback logic for all failure scenarios

**State Persistence:**
- ✅ Database schema (Flyway V3 migration)
  - `order_state` table (current state with optimistic locking)
  - `order_state_history` table (complete audit trail)
- ✅ Java: JPA entities (`OrderStateEntity`, `OrderStateHistoryEntity`)
- ✅ Java: `OrderStateRepository` with optimistic locking
- ✅ Python: SQLAlchemy models + `OrderStateRepository`

**Testing:**
- ✅ Java: `OrderStateMachineIntegrationTest` (15 test cases)
- ✅ Python: `test_order_state_machine.py` (20+ test cases)
- ✅ Coverage: All state transitions, terminal states, guard conditions

**Documentation:**
- ✅ `docs/01-agnostic/03-guidelines/workflow-state-machine.md` - Design specification
- ✅ `docs/01-agnostic/03-guidelines/workflow-implementation.md` - Implementation guide
- ✅ API documentation in controllers/routers

---

## Overview

This document defines the state machine for the Order aggregate, implementing the **State Pattern** for lifecycle management.

---

## State Machine Definition

### Order States

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
    ↓         ↓           ↓           ↓          ↓
 CANCELLED  CANCELLED  CANCELLED   RETURNED  RETURNED
                                      ↓
                                   REFUNDED
```

### State Enum

```typescript
enum OrderState {
  PENDING = "PENDING",           // Initial state - order created
  CONFIRMED = "CONFIRMED",       // Payment confirmed
  PROCESSING = "PROCESSING",     // Being prepared/picked
  SHIPPED = "SHIPPED",          // Shipped to customer
  DELIVERED = "DELIVERED",      // Delivered to customer
  COMPLETED = "COMPLETED",      // Order completed (no returns)
  CANCELLED = "CANCELLED",      // Cancelled (terminal state)
  RETURNED = "RETURNED",        // Item returned
  REFUNDED = "REFUNDED"         // Refund processed (terminal state)
}
```

### Transitions

| From State | Event | To State | Guard Condition | Action |
|------------|-------|----------|-----------------|--------|
| PENDING | confirmPayment | CONFIRMED | Payment successful | Send confirmation email |
| PENDING | cancelOrder | CANCELLED | Within cancellation window | Release inventory, refund |
| CONFIRMED | startProcessing | PROCESSING | Inventory available | Assign to warehouse |
| CONFIRMED | cancelOrder | CANCELLED | Before processing starts | Refund payment |
| PROCESSING | shipOrder | SHIPPED | Package ready | Generate tracking number |
| PROCESSING | cancelOrder | CANCELLED | Before shipment | Refund + restock |
| SHIPPED | deliverOrder | DELIVERED | Delivery confirmed | Send delivery notification |
| SHIPPED | initiateReturn | RETURNED | Within return window | Generate return label |
| DELIVERED | completeOrder | COMPLETED | Return window expired | Close order |
| DELIVERED | initiateReturn | RETURNED | Within return window | Generate return label |
| RETURNED | processRefund | REFUNDED | Return inspected | Issue refund |

### Terminal States

Once an order reaches a terminal state, no further transitions are allowed:
- **COMPLETED**: Order lifecycle finished successfully
- **CANCELLED**: Order cancelled before completion
- **REFUNDED**: Order returned and refunded

---

## Implementation Approach

### Java: Spring Statemachine

**Why Spring Statemachine:**
- ✅ Native Spring Boot integration
- ✅ Persistent state machine support
- ✅ Event-driven transitions
- ✅ Guard conditions and actions
- ✅ UML state machine support

**Dependencies:**
```xml
<dependency>
    <groupId>org.springframework.statemachine</groupId>
    <artifactId>spring-statemachine-starter</artifactId>
    <version>3.4.0</version>
</dependency>
```

### Python: transitions

**Why transitions:**
- ✅ Lightweight and Pythonic
- ✅ Hierarchical state machines
- ✅ Event-driven
- ✅ Model-based (binds to Order entity)
- ✅ Persistence support via callbacks

**Dependencies:**
```toml
[tool.poetry.dependencies]
transitions = "^0.9.0"
```

---

## State Persistence Strategy

### Database Schema

```sql
-- Order state tracking
CREATE TABLE order_state (
    order_id UUID PRIMARY KEY,
    current_state VARCHAR(50) NOT NULL,
    previous_state VARCHAR(50),
    state_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0  -- Optimistic locking
);

-- State transition history (audit trail)
CREATE TABLE order_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    event VARCHAR(50) NOT NULL,
    triggered_by VARCHAR(100),  -- User ID or system
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_state_history_order_id ON order_state_history(order_id);
CREATE INDEX idx_order_state_history_created_at ON order_state_history(created_at);
```

---

## Event Definitions

### Domain Events

```java
// Java
public record OrderConfirmedEvent(
    OrderId orderId,
    Instant confirmedAt,
    String paymentId
) implements DomainEvent {}

public record OrderShippedEvent(
    OrderId orderId,
    Instant shippedAt,
    String trackingNumber,
    String carrier
) implements DomainEvent {}

public record OrderCancelledEvent(
    OrderId orderId,
    Instant cancelledAt,
    CancellationReason reason,
    String cancelledBy
) implements DomainEvent {}
```

```python
# Python
@dataclass(frozen=True)
class OrderConfirmedEvent(DomainEvent):
    order_id: OrderId
    confirmed_at: datetime
    payment_id: str

@dataclass(frozen=True)
class OrderShippedEvent(DomainEvent):
    order_id: OrderId
    shipped_at: datetime
    tracking_number: str
    carrier: str
```

---

## Usage Examples

### Java - State Machine Usage

```java
@Autowired
private StateMachine<OrderState, OrderEvent> orderStateMachine;

public void confirmOrder(OrderId orderId, Payment payment) {
    Message<OrderEvent> message = MessageBuilder
        .withPayload(OrderEvent.CONFIRM_PAYMENT)
        .setHeader("order_id", orderId)
        .setHeader("payment", payment)
        .build();
    
    orderStateMachine.sendEvent(message);
    
    if (orderStateMachine.getState().getId() == OrderState.CONFIRMED) {
        // Success - order confirmed
    }
}
```

### Python - State Machine Usage

```python
from transitions import Machine

class Order:
    states = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 
              'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED']
    
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.state = 'PENDING'
        
        # Initialize state machine
        self.machine = Machine(
            model=self,
            states=Order.states,
            initial='PENDING',
            transitions=[
                {'trigger': 'confirm_payment', 'source': 'PENDING', 'dest': 'CONFIRMED'},
                {'trigger': 'cancel', 'source': ['PENDING', 'CONFIRMED', 'PROCESSING'], 
                 'dest': 'CANCELLED'},
                # ... more transitions
            ]
        )
    
    def confirm_order(self, payment: Payment):
        if self.confirm_payment():
            # Success - order confirmed
            pass
```

---

## Saga Pattern Integration

### Order Creation Saga

**Scenario**: Create order with inventory reservation and payment authorization

**Participants:**
1. Order Service (orchestrator)
2. Inventory Service
3. Payment Service

**Flow:**
```
1. Create Order (PENDING)
   ↓
2. Reserve Inventory
   ├─ Success → Continue
   └─ Failure → Cancel Order
   ↓
3. Authorize Payment
   ├─ Success → Confirm Order (CONFIRMED)
   └─ Failure → Release Inventory → Cancel Order
```

**Compensating Transactions:**
- If payment fails → Release inventory
- If inventory unavailable → Cancel order

---

## Acceptance Criteria

- [ ] State machine defined for Order aggregate
- [ ] All states and transitions documented
- [ ] Guard conditions implemented
- [ ] State persistence in PostgreSQL
- [ ] Transition history (audit trail)
- [ ] Domain events published on state changes
- [ ] Integration tests for all transitions
- [ ] Saga pattern example implemented

---

## Next Steps

1. **Week 1**: Implement Java state machine with Spring Statemachine
2. **Week 1**: Implement Python state machine with transitions
3. **Week 2**: Add state persistence and audit trail
4. **Week 2**: Implement Order Creation Saga
5. **Week 3**: Add comprehensive tests and documentation

---

**Last Updated**: 2026-05-25  
**Owner**: @backend-team
