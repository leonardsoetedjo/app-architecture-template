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
