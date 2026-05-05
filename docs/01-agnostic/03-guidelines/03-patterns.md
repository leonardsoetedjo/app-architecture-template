# Coding Patterns: Bad vs. Good

This document provides concrete examples of the project's standards in action. Use these examples to guide your implementation and PR reviews.

---

## 1. Architecture & Domain

### Dependency Rule (Domain Isolation)
**Rule**: Domain layer has zero framework imports.

❌ **Bad**: Domain entity using JPA annotations or Spring components.
```java
@Entity // JPA Leak
public class Order {
    @Id private UUID id;
    
    public void process() {
        // Using a Spring bean directly inside the domain
        ApplicationContextHolder.getBean(EmailService.class).send(); 
    }
}
```

✅ **Good**: Pure Java entity. Persistence is handled by the adapter.
```java
public class Order {
    private final OrderId id;
    
    public void process() {
        // Domain logic only. Events are registered to be handled by the application layer.
        registerEvent(new OrderProcessedEvent(id));
    }
}
```

### Entities vs. Value Objects
**Rule**: Use Value Objects for complex attributes to avoid primitive obsession.

❌ **Bad**: Using strings and decimals for everything.
```java
public class User {
    private String email; // Primitive obsession
    private BigDecimal balance;
}
```

✅ **Good**: Encapsulating logic in Value Objects.
```java
public class User {
    private final Email email; // Validates format on creation
    private final Money balance; // Handles currency and rounding
}
```

---

## 2. Backend Implementation

### Validation Hierarchy
**Rule**: Infrastructure = Syntactic; Domain = Semantic.

❌ **Bad**: Putting business rules in Controller DTOs.
```java
public record CreateOrderRequest(
    @NotNull String productId,
    @Min(1) int quantity,
    @Pattern(regexp = "^ORD-.*") String orderCode // Business rule leak!
) {}
```

✅ **Good**: 
- **Infra**: `@NotNull`, `@Size`.
- **Domain**: `if (quantity > maxAvailable) throw new InsufficientStockException();`

### Mapping Isolation
**Rule**: No manual mapping in Use Cases. Use MapStruct.

❌ **Bad**: Manual field copying in the service.
```java
public OrderResponse execute(PlaceOrderCommand cmd) {
    Order order = repository.save(new Order(cmd.id(), ...));
    OrderResponse res = new OrderResponse();
    res.setId(order.getId()); // Manual mapping leak
    res.setStatus(order.getStatus().name());
    return res;
}
```

✅ **Good**: Using a mapper.
```java
public OrderResponse execute(PlaceOrderCommand cmd) {
    Order order = repository.save(new Order(cmd.id(), ...));
    return orderMapper.toResponse(order); // Clean transition
}
```

### Pure ItemProcessors (Batch)
**Rule**: No side effects in the process phase.

❌ **Bad**: Sending an email during processing.
```java
public ItemProcessor<<OrderOrder, OrderProcessed> process(Order item) {
    if (item.isPriority()) {
        emailService.sendPriorityAlert(item); // Side effect!
    }
    return new OrderProcessed(item);
}
```

✅ **Good**: Mark for action in the processed object; execute in Writer.
```java
public ItemProcessor<<OrderOrder, OrderProcessed> process(Order item) {
    boolean shouldAlert = item.isPriority();
    return new OrderProcessed(item, shouldAlert); // Pure function
}
// Writer then handles the email sending within the DB transaction.
```

---

## 3. Frontend Implementation

### API Client Isolation
**Rule**: Components must never call axios/fetch directly.

❌ **Bad**: `useEffect` with a direct API call.
```tsx
function UserProfile() {
  useEffect(() => {
    axios.get('/api/v1/users/123').then(res => { ... }); // Leak!
  }, []);
}
```

✅ **Good**: Use a service layer via a custom hook.
```tsx
function UserProfile() {
  const { user, loading } = useUser(123); // Logic encapsulated in hook
  if (loading) return <<SpinSpin />;
  return <div>{user.name}</div>;
}
```

### State Ownership (Custom Hooks)
**Rule**: Transform API data into UI state in a hook, not the JSX.

❌ **Bad**: Complex mapping inside the component return.
```tsx
return (
  <div>
    {orders.map(o => (
      <<divdiv className={o.status === 'PENDING' ? 'text-blue' : 'text-green'}>
        {o.createdAt.toLocaleDateString()}
      </div>
    ))}
  </div>
);
```

✅ **Good**: Derived state in the hook.
```ts
function useOrders() {
  const { data } = useQuery(...)
  const formattedOrders = useMemo(() => 
    data.map(o => ({ 
      ...o, 
      statusColor: o.status === 'PENDING' ? 'text-blue' : 'text-green',
      date: o.createdAt.toLocaleDateString()
    })), [data]);
    
  return { orders: formattedOrders };
}
```

### Type Strictness
**Rule**: No `any` or `unknown` for API responses.

❌ **Bad**: Using `any` for flexibility.
```ts
const fetchData = async () => {
  const response: any = await userService.get(); // Type safety lost
  return response.data;
}
```

✅ **Good**: Named interfaces for every response.
```ts
interface UserResponse {
  id: string;
  email: string;
}
const fetchData = async (): Promise<<UserUserResponse> => {
  return await userService.get();
}
```

---

## 4. Concurrency & Locking

### Optimistic Locking Without Retry (Incomplete)
**Rule**: Optimistic locking must always be paired with a bounded retry. Surfacing a raw concurrency failure as a 500 is unacceptable.

#### Java

❌ **Bad**: `@Version` entity with no retry. The user sees a 500 on every conflict.
```java
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository repo;

    @Transactional
    public void deduct(UUID productId, int qty) {
        InventoryEntity inv = repo.findById(productId).orElseThrow();
        inv.setQuantity(inv.getQuantity() - qty); // May throw OptimisticLockException
        repo.save(inv);
    }
    // No retry — every conflict surfaces as a 500.
}
```

✅ **Good**: `@Retry` with exponential backoff + structured user-facing error.
```java
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository repo;

    @Retry(name = "optimisticLockRetry", fallbackMethod = "fallbackDeduct")
    @Transactional
    public void deduct(UUID productId, int qty) {
        InventoryEntity inv = repo.findById(productId).orElseThrow();

        if (inv.getQuantity() < qty) {
            throw new InsufficientStockException(productId, qty, inv.getQuantity());
        }

        inv.setQuantity(inv.getQuantity() - qty);
        repo.save(inv);
    }

    public void fallbackDeduct(UUID productId, int qty, Throwable t) {
        throw new ConcurrentUpdateException(
            "The record was modified by another operation. Please retry."
        );
    }
}
```

#### Python

❌ **Bad**: `version_id_col` with no retry. The user sees a 500 on every conflict.
```python
class InventoryService:
    async def deduct(self, product_id: uuid.UUID, quantity: int) -> None:
        async with self.session() as session:
            inv = await session.get(InventorySqlModel, product_id)
            inv.quantity -= quantity  # May raise StaleDataError
            await session.commit()
    # No retry — every conflict surfaces as a 500.
```

✅ **Good**: `tenacity` retry with exponential backoff.
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy.orm.exc import StaleDataError

class InventoryService:

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.1, max=1),
        retry=retry_if_exception_type(StaleDataError),
    )
    async def deduct(self, product_id: uuid.UUID, quantity: int) -> None:
        async with self.session() as session:
            inv = await session.get(InventorySqlModel, product_id)
            if inv.quantity < quantity:
                raise InsufficientStockException(...)
            inv.quantity -= quantity
            await session.commit()
```

### Wide Transaction Scope with External Calls
**Rule**: Never perform external I/O (HTTP, file write, message publish) while holding a DB lock or inside a write transaction.

#### Java

❌ **Bad**: HTTP call inside a write transaction. The DB lock is held for the duration of the slow external call, blocking all other writers.
```java
@Transactional
public void processOrder(UUID orderId) {
    OrderEntity order = repo.findById(orderId).orElseThrow();
    // Row locked here (or version read)

    // ❌ External call inside the transaction
    paymentService.charge(order.getTotalAmount());

    order.setStatus("PAID");
    repo.save(order);
    // Lock released / committed here — held for entire paymentService latency.
}
```

✅ **Good**: Split into two transactions. Lock the minimum surface area.
```java
// 1. Reserve (short, guarded transaction)
@Retry(name = "optimisticLockRetry")
@Transactional
public void reserve(UUID orderId) {
    OrderEntity order = repo.findById(orderId).orElseThrow();
    order.setStatus("RESERVED"); // Fast write, lock released immediately
    repo.save(order);
}

// 2. Process payment OUTSIDE the DB transaction
public void processPayment(UUID orderId) {
    reserve(orderId); // Fast, isolated DB write

    paymentService.charge(order.getTotalAmount()); // No lock held.

    // 3. Finalize in a second short transaction
    finalize(orderId);
}

@Retry(name = "optimisticLockRetry")
@Transactional
public void finalize(UUID orderId) {
    OrderEntity order = repo.findById(orderId).orElseThrow();
    order.setStatus("PAID");
    repo.save(order);
}
```

#### Python

❌ **Bad**: HTTP call inside a write async session.
```python
async def process_order(self, order_id: uuid.UUID) -> None:
    async with self.session() as session:
        order = await session.get(OrderSqlModel, order_id)
        # Version read / lock acquired

        # ❌ External call inside the session
        await payment_client.charge(order.total_amount)

        order.status = "PAID"
        await session.commit()
```

✅ **Good**: Split reads, external calls, and writes.
```python
async def process_order(self, order_id: uuid.UUID) -> None:
    # 1. Reserve (short write)
    order = await self.reserve_order(order_id)

    # 2. Payment outside DB session
    await payment_client.charge(order.total_amount)

    # 3. Finalize (short write)
    await self.finalize_order(order_id)

@retry(...)
async def reserve_order(self, order_id: uuid.UUID) -> OrderSqlModel:
    async with self.session() as session:
        order = await session.get(OrderSqlModel, order_id)
        order.status = "RESERVED"
        await session.commit()
        return order

@retry(...)
async def finalize_order(self, order_id: uuid.UUID) -> None:
    async with self.session() as session:
        order = await session.get(OrderSqlModel, order_id)
        order.status = "PAID"
        await session.commit()
```

### Pessimistic Lock Overuse
**Rule**: Use pessimistic locking only after proving optimistic locking causes unacceptable retry churn. Default to optimistic.

#### Java

❌ **Bad**: Using pessimistic locking on every entity by default.
```java
@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) // ❌ Overkill for most entities
    Optional<OrderEntity> findById(UUID id);
}
```

✅ **Good**: Start with optimistic. Switch to pessimistic only for proven hotspots.
```java
// Default repository — no lock. Optimistic by default.
Optional<OrderEntity> findById(UUID id);

// Separate method for known high-contention paths.
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<OrderEntity> findByIdForUpdate(UUID id);
```

#### Python

❌ **Bad**: `with_for_update()` on every query.
```python
result = await session.execute(
    select(OrderSqlModel).where(OrderSqlModel.id == order_id)
    .with_for_update()  # ❌ Overkill
)
```

✅ **Good**: Optimistic by default. Pessimistic only on hotspot paths.
```python
# Default — no lock
result = await session.execute(
    select(OrderSqlModel).where(OrderSqlModel.id == order_id)
)

# High-contention path only
result = await session.execute(
    select(OrderSqlModel).where(OrderSqlModel.id == order_id)
    .with_for_update()  # ✅ Justified by measured contention
)
```
