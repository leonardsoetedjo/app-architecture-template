---
title: "First Feature Checklist (10 Minutes)"
number: "03"
type: "Quick Start Guide"
created: "2026-06-27"
status: "active"
---
# First Feature Checklist (10 Minutes)

**Goal:** Complete end-to-end implementation of a simple REST endpoint following all architecture rules.

**Example task:** Add `GET /orders/{id}` endpoint to retrieve an order by ID.

---

## Pre-Flight Checks (1 min)

### 1. GitHub Issue Exists
```bash
# Check for existing issue
gh issue list --state open | grep -i "order"

# If not found, create one
gh issue create --title "Add GET /orders/{id} endpoint" --body "
## Requirements
- Retrieve order by ID
- Return 404 if not found
- Follow Clean Architecture patterns

## Acceptance Criteria
- [ ] Endpoint: GET /orders/{id}
- [ ] Response: Order DTO
- [ ] Error: 404 if not found
- [ ] Tests: Unit + integration
"
```

**✅ Verify:** Issue number assigned (e.g., #92)

---

### 2. Load Required Skills
```python
# In your AI agent session
skill_view(name='architecture-compliance-check')
skill_view(name='test-driven-development')
skill_view(name='clean-architecture-feature-implementation')
skill_view(name='verification-before-completion')
```

**✅ Verify:** All 4 skills loaded successfully

---

### 3. Query Existing Patterns
```python
# Find similar endpoints in boilerplate
ctx_search(queries: ["GET endpoint by ID"], source: "java-boilerplate")
ctx_search(queries: ["order repository findById"], source: "java-boilerplate")

# Find SOP
ctx_search(queries: ["add REST endpoint SOP"])
```

**✅ Verify:** Found at least 2 similar patterns to follow

---

## Step 1: Domain Layer (2 min)

### 1.1 Create/Verify Entity
**File:** `boilerplate/java/order-service/src/main/java/com/example/domain/model/Order.java`

```java
// Pure POJO - NO framework annotations!
public record Order(
    UUID id,
    String customerId,
    OrderStatus status,
    List<OrderItem> items,
    Money totalAmount,
    Instant createdAt
) {}
```

**✅ Verify:** Zero imports from Spring, JPA, or any framework

### 1.2 Create/Verify Repository Port
**File:** `boilerplate/java/order-service/src/main/java/com/example/domain/port/OrderRepository.java`

```java
public interface OrderRepository {
    Optional<Order> findById(UUID id);
    Order save(Order order);
}
```

**✅ Verify:** Interface only, no implementation details

---

## Step 2: Application Layer (2 min)

### 2.1 Create Use Case Interface
**File:** `boilerplate/java/order-service/src/main/java/com/example/application/usecase/GetOrderById.java`

```java
public interface GetOrderById {
    Order execute(UUID id);
}
```

### 2.2 Implement Use Case
**File:** `boilerplate/java/order-service/src/main/java/com/example/application/usecase/GetOrderByIdImpl.java`

```java
@ApplicationService  // Your framework's annotation
public class GetOrderByIdImpl implements GetOrderById {

    private final OrderRepository repository;

    @Override
    public Order execute(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }
}
```

**✅ Verify:**
- No HTTP framework imports
- No database framework imports
- Only domain and application layer imports

---

## Step 3: Infrastructure Layer (2 min)

### 3.1 Implement Repository
**File:** `boilerplate/java/order-service/src/main/java/com/example/infrastructure/persistence/JpaOrderRepository.java`

```java
@Repository  // NOW you can use framework annotations
public class JpaOrderRepository implements OrderRepository {

    private final JpaOrderEntityRepository entityRepository;

    @Override
    public Optional<Order> findById(UUID id) {
        return entityRepository.findById(id)
            .map(entity -> entity.toDomain());  // Entity → Domain mapping
    }

    @Override
    public Order save(Order order) {
        var entity = JpaOrderEntity.fromDomain(order);
        return entityRepository.save(entity).toDomain();
    }
}
```

**✅ Verify:**
- Framework imports ONLY in infrastructure layer
- Proper domain ↔ entity mapping

### 3.2 Create REST Controller
**File:** `boilerplate/java/order-service/src/main/java/com/example/infrastructure/web/OrderController.java`

```java
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final GetOrderById getOrderById;

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        try {
            Order order = getOrderById.execute(id);
            return ResponseEntity.ok(OrderResponse.fromDomain(order));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

**✅ Verify:**
- Controller is in `infrastructure/web/` (NOT in application layer)
- Dependency injection of use case interface (not implementation)

---

## Step 4: Tests (3 min)

### 4.1 Domain Test (Pure Unit Test)
**File:** `boilerplate/java/order-service/src/test/java/com/example/domain/OrderTest.java`

```java
@Test
void order_creation_with_valid_data_should_succeed() {
    var order = new Order(
        UUID.randomUUID(),
        "customer-123",
        OrderStatus.PENDING,
        List.of(),
        new Money("100.00", "USD"),
        Instant.now()
    );

    assertThat(order.id()).isNotNull();
    assertThat(order.customerId()).isEqualTo("customer-123");
}
```

**✅ Verify:** Test passes BEFORE implementation (TDD RED phase)

### 4.2 Use Case Test (Unit Test with Mock)
**File:** `boilerplate/java/order-service/src/test/java/com/example/application/GetOrderByIdImplTest.java`

```java
@Test
void execute_with_existing_id_should_return_order() {
    var order = createTestOrder();
    when(repository.findById(order.id())).thenReturn(Optional.of(order));

    var result = useCase.execute(order.id());

    assertThat(result).isEqualTo(order);
}

@Test
void execute_with_missing_id_should_throw() {
    when(repository.findById(any())).thenReturn(Optional.empty());

    assertThrows(OrderNotFoundException.class, () ->
        useCase.execute(UUID.randomUUID())
    );
}
```

**✅ Verify:** Tests fail before use case implementation

### 4.3 Integration Test (Full Stack)
**File:** `boilerplate/java/order-service/src/test/java/com/example/infrastructure/web/OrderControllerIntegrationTest.java`

```java
@SpringBootTest
@AutoConfigureTestcontainers
class OrderControllerIntegrationTest {

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private OrderRepository repository;

    @Test
    void get_order_by_id_should_return_200() {
        var order = repository.save(createTestOrder());

        var response = restTemplate.getForEntity(
            "/orders/" + order.id(),
            OrderResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().id()).isEqualTo(order.id());
    }

    @Test
    void get_order_by_missing_id_should_return_404() {
        var response = restTemplate.getForEntity(
            "/orders/" + UUID.randomUUID(),
            Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
```

**✅ Verify:** All tests pass (TDD GREEN phase)

---

## Step 5: Architecture Validation (1 min)

### 5.1 Run Pre-Commit Check
```bash
cd boilerplate/java
../.lefthook run pre-commit
```

**Expected output:**
```
✅ All architecture guardrails passed
  - Duration: 2340ms
  - Java architecture: OK
  - Domain layer: 0 forbidden imports
  - Application layer: OK
  - Infrastructure layer: OK
```

### 5.2 Verify with Serena
```python
# Check for forbidden imports in domain layer
mcp_serena_find_symbol(
    name_path_pattern="Order",
    relative_path="boilerplate/java/order-service/src/domain",
    include_info=True
)

# Verify no Spring/JPA imports in domain
# Should return ONLY your domain classes, no framework annotations
```

**✅ Verify:** Zero violations

---

## Step 6: Commit with Evidence (1 min)

### 6.1 Stage Changes
```bash
git add boilerplate/java/order-service/src/
git status
```

**✅ Verify:** No temporary files, no test output files

### 6.2 Commit with Architecture Evidence
```bash
git commit -m "feat: add GET /orders/{id} endpoint (#92)

- Added GetOrderById use case in application layer
- Implemented JpaOrderRepository in infrastructure layer
- Created OrderController with proper error handling
- Added unit tests (domain + use case)
- Added integration test with Testcontainers

Architecture: lefthook run pre-commit PASSED
  - Duration: 2340ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
  - E2E tests: OK"
```

**✅ Verify:** Commit message includes architecture evidence block

---

## Step 7: Update GitHub Issue (30 sec)

### 7.1 Comment with Summary
```bash
gh issue comment 92 --body "
## Implementation Summary

### Changes
- Added GetOrderById use case (application layer)
- Implemented JpaOrderRepository (infrastructure layer)
- Created OrderController with error handling
- Tests: 3 unit + 1 integration

### Architecture Compliance
✅ Domain layer: 0 forbidden imports
✅ Application layer: No HTTP/DB frameworks
✅ Infrastructure layer: Proper isolation

### Tests
- Domain: 2 tests (pure POJO)
- Use Case: 3 tests (with mocks)
- Integration: 2 tests (full stack)
- Coverage: 95%

### Verification
- Architecture pre-commit: PASSED
- All tests: PASSED
- No temporary files in repo
"
```

### 7.2 Close Issue
```bash
gh issue close 92
```

**✅ Verify:** Issue closed with implementation summary

---

## ✅ Final Checklist

Before marking feature complete:

### Code Quality
- [ ] Domain layer has ZERO framework imports
- [ ] Application layer has NO HTTP/database frameworks
- [ ] Infrastructure layer properly isolates framework code
- [ ] All tests pass (unit + integration)
- [ ] No temporary files in repository (`git status` clean)

### Documentation
- [ ] SOP followed (or ADR created for new pattern)
- [ ] Commit message includes architecture evidence
- [ ] GitHub Issue updated with summary
- [ ] GitHub Issue closed

### Architecture Evidence (REQUIRED in commit message)
```
Architecture: lefthook run pre-commit PASSED
  - Duration: <5000ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
  - E2E tests: OK
```

**Missing any item = NOT COMPLETE**

---

## 🎯 What's Next?

| If you want to... | Go to |
|-------------------|-------|
| Add another feature | Repeat this checklist |
| Learn advanced patterns | [`docs/01-agnostic/03-guidelines/03-patterns.md`](../01-agnostic/03-guidelines/03-patterns.md) |
| Understand DDD deeply | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](../01-agnostic/02-adrs/01-clean-architecture.md) |
| See all SOPs | [`docs/04-sops/`](../04-sops/) |

---

## 🆘 Troubleshooting

### "Domain layer has forbidden imports"
**Fix:** Move framework-specific code to Infrastructure layer
```java
// ❌ WRONG (in domain layer)
import org.springframework.data.annotation.Id;

// ✅ CORRECT (in infrastructure layer)
import org.springframework.data.annotation.Id;
```

### "Tests failing after implementation"
**Check:**
1. Did you follow TDD? (tests should fail BEFORE implementation)
2. Are you testing the right layer? (unit vs integration)
3. Are mocks configured correctly?

### "Architecture validation taking too long"
**Normal duration:** <5 seconds
**If slower:** Check if Docker containers are running (some checks need DB)

---

**Time elapsed:** ~10 minutes
**Feature complete with 100% architecture compliance!** 🎉

For next features, repeat this checklist. Patterns become faster with practice.
