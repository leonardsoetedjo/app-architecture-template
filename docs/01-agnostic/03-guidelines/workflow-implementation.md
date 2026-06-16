# Order State Machine Implementation Guide

**Status**: 🟡 **In Progress** (2026-05-25)  
**Related Issue**: [#73](https://github.com/leonardsoetedjo/app-architecture-template/issues/73)

---

## Overview

This guide documents the **order state machine** implementation for single-entity lifecycle management (order states), plus the Saga pattern for distributed transactions.

**Note:** This is an *aggregate state machine*, not a workflow orchestration engine. For long-running, multi-service workflow orchestration, see ADR-02 (optional: Temporal / Airflow / Camunda).

---

## Part 1: State Machine Pattern

### What is a State Machine?

A state machine is a computational model that transitions between states based on events. It's ideal for:
- Managing entity lifecycles (orders, payments, shipments)
- Enforcing business rules (guard conditions)
- Tracking state history (audit trail)
- Preventing invalid transitions

### Order Lifecycle State Machine

```
┌─────────┐  confirm  ┌───────────┐  start   ┌────────────┐  ship   ┌─────────┐
│ PENDING │──────────▶│ CONFIRMED │─────────▶│ PROCESSING │────────▶│ SHIPPED │
└────┬────┘           └─────┬─────┘          └─────┬──────┘         └────┬────┘
     │ cancel               │ cancel                │ cancel              │ deliver
     ▼                      ▼                       ▼                     ▼
┌───────────┐        ┌───────────┐           ┌───────────┐        ┌─────────────┐
│ CANCELLED │        │ CANCELLED │           │ CANCELLED │        │  DELIVERED  │
└───────────┘        └───────────┘           └───────────┘        └──────┬──────┘
                                                                          │
                                         ┌────────────────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │     COMPLETED       │◀── Terminal State
                              └─────────────────────┘
```

### States

| State | Description | Terminal |
|-------|-------------|----------|
| `PENDING` | Order created, awaiting payment | No |
| `CONFIRMED` | Payment confirmed | No |
| `PROCESSING` | Being prepared/picked | No |
| `SHIPPED` | Shipped to customer | No |
| `DELIVERED` | Delivered to customer | No |
| `COMPLETED` | Return window expired | **Yes** |
| `CANCELLED` | Order cancelled | **Yes** |
| `RETURNED` | Item returned | No |
| `REFUNDED` | Refund processed | **Yes** |

### Transitions

| From | Event | To | Guard Condition |
|------|-------|----|-----------------|
| PENDING | CONFIRM_PAYMENT | CONFIRMED | Payment successful |
| PENDING | CANCEL_ORDER | CANCELLED | Within cancellation window |
| CONFIRMED | START_PROCESSING | PROCESSING | Inventory available |
| CONFIRMED | CANCEL_ORDER | CANCELLED | Before processing |
| PROCESSING | SHIP_ORDER | SHIPPED | Package ready |
| PROCESSING | CANCEL_ORDER | CANCELLED | Before shipment |
| SHIPPED | DELIVER_ORDER | DELIVERED | Delivery confirmed |
| SHIPPED | INITIATE_RETURN | RETURNED | Within return window |
| DELIVERED | COMPLETE_ORDER | COMPLETED | Return window expired |
| DELIVERED | INITIATE_RETURN | RETURNED | Within return window |
| RETURNED | PROCESS_REFUND | REFUNDED | Return inspected |

---

## Part 2: Implementation

### Java (Spring Statemachine)

**Dependencies** (`pom.xml`):
```xml
<dependency>
    <groupId>org.springframework.statemachine</groupId>
    <artifactId>spring-statemachine-starter</artifactId>
    <version>3.4.0</version>
</dependency>
```

**Configuration**:
```java
@Configuration
@EnableStateMachineFactory
public class OrderStateMachineConfig 
        extends StateMachineConfigurerAdapter<OrderState, OrderEvent> {
    
    @Override
    public void configure(StateMachineStateConfigurer<OrderState, OrderEvent> states) {
        states
            .withStates()
                .initial(OrderState.PENDING)
                .states(EnumSet.allOf(OrderState.class))
                .terminal(OrderState.COMPLETED)
                .terminal(OrderState.CANCELLED)
                .terminal(OrderState.REFUNDED);
    }
    
    @Override
    public void configure(StateMachineTransitionConfigurer<OrderState, OrderEvent> transitions) {
        transitions
            .withExternal()
                .source(OrderState.PENDING).target(OrderState.CONFIRMED)
                .event(OrderEvent.CONFIRM_PAYMENT)
            .and()
            // ... more transitions
            ;
    }
}
```

**Usage**:
```java
@Service
public class OrderService {
    
    @Autowired
    private OrderStateService orderStateService;
    
    public void confirmOrder(OrderId orderId) {
        boolean success = orderStateService.triggerEvent(
            orderId, 
            OrderEvent.CONFIRM_PAYMENT
        );
        
        if (!success) {
            throw new InvalidStateException("Cannot confirm order");
        }
    }
}
```

### Python (transitions)

**Dependencies** (`pyproject.toml`):
```toml
[tool.poetry.dependencies]
transitions = "^0.9.0"
```

**Implementation**:
```python
from transitions import Machine

class OrderStateMachine:
    states = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 
              'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED']
    
    transitions = [
        {'trigger': 'confirm_payment', 'source': 'PENDING', 'dest': 'CONFIRMED'},
        {'trigger': 'cancel', 'source': ['PENDING', 'CONFIRMED', 'PROCESSING'], 
         'dest': 'CANCELLED'},
        # ... more transitions
    ]
    
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.state = 'PENDING'
        
        self.machine = Machine(
            model=self,
            states=self.states,
            initial='PENDING',
            transitions=self.transitions
        )
```

**Usage**:
```python
state_machine = OrderStateMachine("order-123")
state_machine.confirm_payment()  # PENDING → CONFIRMED
state_machine.start_processing()  # CONFIRMED → PROCESSING
```

---

## Part 3: Saga Pattern

### What is a Saga?

A saga is a sequence of local transactions where each updates the database and triggers the next. If a step fails, the saga executes **compensating transactions** to undo previous steps.

### Order Creation Saga

**Flow**:
```
1. Create Order (PENDING)
   ↓
2. Reserve Inventory
   ├─ Success → Continue
   └─ Failure → Compensate: Cancel Order
   ↓
3. Authorize Payment
   ├─ Success → Confirm Order
   └─ Failure → Compensate: Release Inventory → Cancel Order
   ↓
4. Confirm Order (CONFIRMED)
```

### Implementation (Java)

```java
@Component
public class OrderCreationSaga {
    
    public boolean execute(Order order) {
        try {
            createOrder(order);
            
            if (!reserveInventory(order)) {
                compensateInventory(order);
                cancelOrder(order);
                return false;
            }
            
            if (!authorizePayment(order)) {
                compensatePayment(order);
                compensateInventory(order);
                cancelOrder(order);
                return false;
            }
            
            confirmOrder(order);
            return true;
            
        } catch (Exception e) {
            rollback(order);
            return false;
        }
    }
}
```

### Key Concepts

1. **Orchestration vs Choreography**
   - **Orchestration**: Central coordinator (this implementation)
   - **Choreography**: Event-driven, decentralized

2. **Compensating Transactions**
   - Must undo the effects of the original transaction
   - May fail (need retry logic)
   - Idempotent (safe to retry)

3. **Saga Logs**
   - Persist each step for recovery
   - Enable manual intervention if needed

---

## Part 4: State Persistence

### Database Schema

```sql
-- Current state
CREATE TABLE order_state (
    order_id UUID PRIMARY KEY,
    current_state VARCHAR(50) NOT NULL,
    previous_state VARCHAR(50),
    state_changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0
);

-- Transition history (audit trail)
CREATE TABLE order_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    event VARCHAR(50) NOT NULL,
    triggered_by VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_state_history_order_id ON order_state_history(order_id);
```

---

## Part 5: Testing

### Java Integration Test

```java
@SpringBootTest
class OrderStateMachineIntegrationTest {
    
    @Autowired
    private OrderStateService orderStateService;
    
    @Test
    void shouldTransitionFromPendingToConfirmed() {
        // Arrange
        OrderId orderId = OrderId.from("test-123");
        
        // Act
        boolean success = orderStateService.triggerEvent(
            orderId, 
            OrderEvent.CONFIRM_PAYMENT
        );
        
        // Assert
        assertThat(success).isTrue();
        assertThat(orderStateService.getCurrentState(orderId))
            .isEqualTo(OrderState.CONFIRMED);
    }
}
```

### Python Unit Test

```python
def test_order_state_transitions():
    # Arrange
    state_machine = OrderStateMachine("order-123")
    
    # Act
    state_machine.confirm_payment()
    
    # Assert
    assert state_machine.state == "CONFIRMED"
    assert state_machine.can_cancel()  # Guard condition
```

---

## Part 6: Best Practices

### Do's ✅

1. **Define all states explicitly** - No implicit states
2. **Use enums for states and events** - Type safety
3. **Log all transitions** - Audit trail
4. **Persist state changes** - Recovery after crashes
5. **Use guard conditions** - Prevent invalid transitions
6. **Test all transition paths** - Including failures

### Don'ts ❌

1. **Don't bypass the state machine** - Always use events
2. **Don't allow arbitrary state jumps** - Enforce valid transitions
3. **Don't forget compensating transactions** - Saga must rollback
4. **Don't ignore failures** - Handle transition failures gracefully

---

## Related Documentation

- **Caching Layer**: `docs/01-agnostic/03-guidelines/caching.md`
- **Architecture Standards**: `docs/01-agnostic/01-standards/02-architecture.md`
- **SOP-07**: Add New Use Case

---

**Last Updated**: 2026-05-25  
**Owner**: @backend-team  
**Status**: Implementation in progress (state machine + saga complete, persistence pending)
