# ADR 15: Factory Pattern for Use Case Creation

**Status**: Accepted
**Date**: 2026-05-04

## Context

In Spring Boot, dependency injection typically happens via constructor injection. However, when building use cases with complex dependencies (repositories, domain services, external clients), we need a way to:

1. Create use case instances on-demand (not as Spring beans)
2. Inject dependencies into use cases without Spring managing their lifecycle
3. Support different dependency configurations per use case instance

## Decision

We use the **Factory Pattern** to create use case instances. This separates object creation from dependency injection.

### Java Implementation

```java
// Factory interface
public interface PlaceOrderUseCaseFactory {
    PlaceOrderUseCase create();
}

// Factory implementation
@Component
public class PlaceOrderUseCaseFactoryImpl implements PlaceOrderUseCaseFactory {
    
    private final OrderPlacementService orderPlacementService;
    
    public PlaceOrderUseCaseFactoryImpl(OrderPlacementService orderPlacementService) {
        this.orderPlacementService = orderPlacementService;
    }
    
    @Override
    public PlaceOrderUseCase create() {
        return new PlaceOrderUseCaseImpl(orderPlacementService);
    }
}

// Controller uses factory
@RestController
@RequiredArgsConstructor
public class OrderController {
    private final PlaceOrderUseCaseFactory factory;
    
    @PostMapping("/orders")
    public OrderResult createOrder(@RequestBody CreateOrderCommand command) {
        PlaceOrderUseCase useCase = factory.create();
        return useCase.execute(command);
    }
}
```

### Python Implementation

```python
from functools import lru_cache

# Factory function
def create_place_order_use_case(db: Session) -> PlaceOrderUseCase:
    """Factory function to create PlaceOrderUseCase with dependencies."""
    repo = SqlAlchemyOrderRepository(db)
    domain_service = OrderPlacementService(repo)
    return PlaceOrderUseCaseImpl(domain_service)

# Controller uses factory
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    command: CreateOrderCommand,
    db: Session = Depends(get_db)
):
    use_case = create_place_order_use_case(db)
    result = await use_case.execute(command)
    return result
```

### Alternative: Spring `@Scope("prototype")`

For cases where we need Spring to manage creation but allow multiple instances:

```java
@Component
@Scope("prototype")  // Creates new instance each time
public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
    // Dependencies injected via constructor
}

// Then inject ObjectFactory to get new instances
@Service
public class OrderController {
    private final ObjectFactory<PlaceOrderUseCase> useCaseFactory;
    
    public OrderController(ObjectFactory<PlaceOrderUseCase> useCaseFactory) {
        this.useCaseFactory = useCaseFactory;
    }
    
    @PostMapping("/orders")
    public OrderResult createOrder(@RequestBody CreateOrderCommand command) {
        PlaceOrderUseCase useCase = useCaseFactory.getObject();
        return useCase.execute(command);
    }
}
```

## Consequences

- **Positive**: Clear separation of concerns. Use cases remain lightweight. Easier testing with mock factories.
- **Negative**: More boilerplate code. Need to manage factory lifecycle.
- **Trade-off**: We prefer explicit factory creation over prototype beans for clarity.

## When to Use Factory

| Scenario | Pattern |
|----------|---------|
| Use case depends on per-request data | Factory pattern |
| Use case is stateless, shared | Spring bean (default) |
| Use case needs different deps per call | Factory with parameters |
| Use case is expensive to create | Singleton with lazy init |

## Testing Strategy

```java
// Test with mocked factory
@Test
void testCreateOrder() {
    PlaceOrderUseCase mockUseCase = mock(PlaceOrderUseCase.class);
    when(mockUseCase.execute(any())).thenReturn(orderResult);
    
    PlaceOrderUseCaseFactory mockFactory = mock(PlaceOrderUseCaseFactory.class);
    when(mockFactory.create()).thenReturn(mockUseCase);
    
    OrderController controller = new OrderController(mockFactory);
    // ... test
}
```
