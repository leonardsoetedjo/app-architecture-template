---
title: "Order State Machine Implementation Guide"
type: "Documentation"
created: "2026-06-27"
status: "active"
---
# Order State Machine Implementation Guide

## Overview

This template implements a **state machine** for managing order lifecycle in both Java/Spring Boot and Python/FastAPI stacks. The state machine ensures that orders progress through valid state transitions only.

**Note:** This is an *aggregate state machine* for single-entity lifecycle management. For long-running, multi-service workflow orchestration, see the optional Workflow Engine section in ADR-02 (Temporal / Airflow / Camunda).

## State Machine Design

### States

| State | Description | Terminal |
|-------|-------------|----------|
| `PENDING` | Order created, awaiting payment | No |
| `CONFIRMED` | Payment confirmed, ready for processing | No |
| `PROCESSING` | Order being prepared/fulfilled | No |
| `SHIPPED` | Order shipped to customer | No |
| `DELIVERED` | Order delivered to customer | No |
| `COMPLETED` | Order successfully completed | **Yes** |
| `CANCELLED` | Order cancelled (anytime before delivery) | **Yes** |
| `RETURNED` | Customer initiated return | No |
| `REFUNDED` | Refund processed for returned order | **Yes** |

### Events & Transitions

```
┌─────────────┐
│  PENDING    │
└──────┬──────┘
       │
       ├─ CONFIRM_PAYMENT ──→ CONFIRMED
       │                        │
       ├─ CANCEL_ORDER ─────────┼──→ CANCELLED
       │                        │
       │                        ├─ START_PROCESSING ──→ PROCESSING
       │                        │                        │
       │                        │                        ├─ SHIP_ORDER ──→ SHIPPED
       │                        │                        │                 │
       │                        │                        ├─ CANCEL_ORDER ──┤
       │                        │                        │                 ├─ DELIVER_ORDER ──→ DELIVERED
       │                        │                        │                 │                    │
       │                        │                        │                 ├─ INITIATE_RETURN ──┤
       │                        │                        │                 │                    ├─ COMPLETE_ORDER ──→ COMPLETED
       │                        │                        │                 │                    │
       │                        │                        │                 │                    ├─ INITIATE_RETURN ──→ RETURNED
       │                        │                        │                 │                                            │
       │                        │                        │                 │                                            ├─ PROCESS_REFUND ──→ REFUNDED
       │                        │                        │                 │
       │                        │                        │                 └─ (already handled above)
       │                        │                        │
       │                        │                        └─ (already handled above)
       │                        │
       │                        └─ (already handled above)
       │
       └─ (already handled above)
```

## Java Implementation

### Location
```
boilerplate/java/order-service/src/main/java/com/example/orderservice/
├── domain/
│   ├── models/
│   │   ├── OrderState.java          # State enum
│   │   └── OrderEvent.java          # Event enum
│   └── ports/
│       └── OrderRepository.java     # Repository interface
├── application/
│   └── services/
│       └── OrderStateService.java   # State machine service
├── infrastructure/
│   ├── config/
│   │   └── OrderStateMachineConfig.java  # Spring StateMachine config
│   └── persistence/
│       └── OrderStateEntity.java    # JPA entity for state persistence
└── presentation/
    └── api/
        └── OrderStateController.java  # REST endpoints
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/orders/{orderId}/state` | Get current order state |
| `POST` | `/api/v1/orders/{orderId}/state/confirm-payment` | Confirm payment |
| `POST` | `/api/v1/orders/{orderId}/state/start-processing` | Start processing |
| `POST` | `/api/v1/orders/{orderId}/state/ship` | Ship order |
| `POST` | `/api/v1/orders/{orderId}/state/deliver` | Deliver order |
| `POST` | `/api/v1/orders/{orderId}/state/complete` | Complete order |
| `POST` | `/api/v1/orders/{orderId}/state/cancel` | Cancel order |
| `POST` | `/api/v1/orders/{orderId}/state/return` | Initiate return |
| `POST` | `/api/v1/orders/{orderId}/state/refund` | Process refund |

### Example Usage

```bash
# Get current state
curl http://localhost:8080/api/v1/orders/123/state

# Confirm payment
curl -X POST http://localhost:8080/api/v1/orders/123/state/confirm-payment

# Expected response:
{
  "success": "true",
  "message": "Payment confirmed",
  "newState": "CONFIRMED"
}

# Invalid transition (returns 400)
curl -X POST http://localhost:8080/api/v1/orders/123/state/confirm-payment
# Response: { "success": "false", "error": "Invalid state transition" }
```

### Spring StateMachine Configuration

```java
@Configuration
@EnableStateMachine
public class OrderStateMachineConfig 
    extends StateMachineConfigurerAdapter<OrderState, OrderEvent> {
    
    @Override
    public void configure(StateMachineStateConfigurer<OrderState, OrderEvent> states)
        throws Exception {
        states
            .withStates()
            .initial(OrderState.PENDING)
            .states(EnumSet.allOf(OrderState.class))
            .end(OrderState.COMPLETED)
            .end(OrderState.CANCELLED)
            .end(OrderState.REFUNDED);
    }
    
    @Override
    public void configure(StateMachineTransitionConfigurer<OrderState, OrderEvent> transitions)
        throws Exception {
        transitions
            .external().source(OrderState.PENDING).target(OrderState.CONFIRMED)
                .event(OrderEvent.CONFIRM_PAYMENT)
            .and()
            .external().source(OrderState.CONFIRMED).target(OrderState.PROCESSING)
                .event(OrderEvent.START_PROCESSING)
            // ... more transitions
            ;
    }
}
```

## Python Implementation

### Location
```
boilerplate/python/order-service/src/
├── domain/
│   ├── services/
│   │   └── order_state_machine.py  # transitions-based state machine
│   └── models/
│       └── workflow_status.py      # Status tracking models
├── infrastructure/
│   └── persistence/
│       └── order_state_repository.py  # SQLAlchemy repository
└── presentation/
    └── api/
        └── order_state_router.py   # FastAPI router
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/orders/{order_id}/state` | Get current order state |
| `POST` | `/api/v1/orders/{order_id}/state/confirm-payment` | Confirm payment |
| `POST` | `/api/v1/orders/{order_id}/state/start-processing` | Start processing |
| `POST` | `/api/v1/orders/{order_id}/state/ship` | Ship order |
| `POST` | `/api/v1/orders/{order_id}/state/deliver` | Deliver order |
| `POST` | `/api/v1/orders/{order_id}/state/complete` | Complete order |
| `POST` | `/api/v1/orders/{order_id}/state/cancel` | Cancel order |
| `POST` | `/api/v1/orders/{order_id}/state/return` | Initiate return |
| `POST` | `/api/v1/orders/{order_id}/state/refund` | Process refund |

### Example Usage

```python
from domain.services.order_state_machine import OrderStateMachine

# Create state machine
order = OrderStateMachine("order-123")

# Check current state
print(order.state)  # PENDING

# Transition
order.confirm_payment()
print(order.state)  # CONFIRMED

# Check if transition is allowed
if order.can_cancel():
    order.cancel()

# Get transition history
history = order.get_transition_history()
```

### FastAPI Router

```python
from fastapi import APIRouter
from domain.services.order_state_machine import OrderStateMachine

router = APIRouter(prefix="/orders/{order_id}/state")

@router.post("/confirm-payment")
async def confirm_payment(order_id: UUID):
    state_machine = OrderStateMachine(str(order_id))
    
    if not state_machine.can_confirm_payment():
        return {"success": False, "error": "Invalid transition"}
    
    state_machine.confirm_payment()
    return {
        "success": True,
        "message": "Payment confirmed",
        "new_state": state_machine.state
    }
```

## Testing

### Java Integration Test

```java
@Test
void transitionOrderState() throws Exception {
    Order order = createTestOrder();
    
    // PENDING → CONFIRMED
    mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/confirm-payment"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success", is("true")))
        .andExpect(jsonPath("$.newState", is("CONFIRMED")));
    
    // CONFIRMED → PROCESSING
    mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/start-processing"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.newState", is("PROCESSING")));
    
    // Invalid transition
    mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/confirm-payment"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success", is("false")));
}
```

### Python Integration Test

```python
@pytest.mark.asyncio
async def test_transition_order_state(client):
    # Create order
    create_response = await client.post("/api/v1/orders", json=order_data)
    order_id = create_response.json()["id"]
    
    # PENDING → CONFIRMED
    response = await client.post(f"/api/v1/orders/{order_id}/state/confirm-payment")
    assert response.json()["success"] is True
    assert response.json()["new_state"] == "CONFIRMED"
    
    # Invalid transition
    response = await client.post(f"/api/v1/orders/{order_id}/state/confirm-payment")
    assert response.status_code == 400
```

## State Persistence

### Java (JPA)

State is persisted using `OrderStateEntity`:

```java
@Entity
@Table(name = "order_state")
public class OrderStateEntity {
    @Id
    private String orderId;
    
    @Enumerated(EnumType.STRING)
    private OrderState currentState;
    
    @OneToMany
    private List<OrderStateHistoryEntity> history;
}
```

### Python (SQLAlchemy)

State is persisted using `OrderStateModel`:

```python
class OrderStateModel(Base):
    __tablename__ = "order_state"
    
    order_id = Column(String, primary_key=True)
    current_state = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)
```

## Saga Pattern Integration

The state machine integrates with the Saga pattern for distributed transactions:

```java
// Java Saga
@Component
public class OrderCreationSaga {
    private final OrderStateService stateService;
    private final PaymentService paymentService;
    private final InventoryService inventoryService;
    
    public void execute(OrderId orderId) {
        try {
            stateService.triggerEvent(orderId, OrderEvent.CONFIRM_PAYMENT);
            paymentService.charge(orderId);
            inventoryService.reserve(orderId);
            stateService.triggerEvent(orderId, OrderEvent.START_PROCESSING);
        } catch (Exception e) {
            // Compensating transactions
            inventoryService.release(orderId);
            paymentService.refund(orderId);
            stateService.triggerEvent(orderId, OrderEvent.CANCEL_ORDER);
        }
    }
}
```

## Error Handling

| Scenario | Response Code | Response Body |
|----------|---------------|---------------|
| Invalid transition | `400 Bad Request` | `{"success": false, "error": "Invalid state transition"}` |
| Order not found | `404 Not Found` | `{"error": "Order not found"}` |
| Unauthorized | `403 Forbidden` | `{"error": "Access denied"}` |

## Best Practices

1. **Idempotency**: All state transition endpoints are idempotent - repeating the same event returns the same result
2. **Audit Trail**: Every transition is logged with timestamp, user, and source/destination state
3. **Guard Conditions**: Use `can_*()` methods to check if transitions are allowed before attempting
4. **Terminal States**: Once in a terminal state (COMPLETED, CANCELLED, REFUNDED), no further transitions are allowed
5. **Event Sourcing**: Consider storing all events for full audit capability

## Related Documents

- [SAGA Pattern Guide](04-sops/02-add-new-rest-endpoint.md)
- [Event-Driven Architecture](01-agnostic/02-adrs/02-eda-outbox.md)
- [API Design Standards](01-agnostic/03-guidelines/08-openapi-standards.md)
