---
name: "Database Persistence Best Practices (JPA & Hibernate)"
type: "Guideline"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Database Persistence Best Practices (JPA & Hibernate)

This document summarizes critical best practices for database persistence, specifically when using JPA and Hibernate, to avoid common performance pitfalls, concurrency issues, and architectural leakage.

## 1. Relationship Management & Persistence

### ❌ Bad Practice: Extensive use of `cascade` and `orphanRemoval`
Using `cascade = CascadeType.ALL` or `orphanRemoval = true` creates a tight coupling between the service layer and the JPA API. This "abstraction leakage" makes it difficult to change persistence strategies or move away from ORM.

**Mitigation**: Explicitly call repository methods in the service layer to persist, update, or delete related entities. This ensures atomicity via `@Transactional` while maintaining a clean separation between business logic and persistence mechanics.

**Boilerplate (Recommended)**:
```java
@Service
public class OrderService {
    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;

    @Transactional
    public void createOrder(OrderRequest request) {
        // 1. Persist Parent
        Order order = orderRepo.save(new Order(request.getCustomerId()));
        
        // 2. Map and Persist Children explicitly
        List<OrderItem> items = request.getItems().stream()
            .map(item -> new OrderItem(order.getId(), item.getProductId(), item.getQty()))
            .toList();
        
        itemRepo.saveAll(items); // Explicit save instead of cascade
    }
}
```

### ❌ Bad Practice: Using `@ManyToMany` directly
Modeling a many-to-many relationship using `@ManyToMany` is inflexible. Real-world join tables almost always need extra fields (e.g., `created_at`, `status`).

**Mitigation**: Create an explicit join entity with two `@OneToMany` relationships. Use a single primary key for the join entity instead of a composite key.

**Boilerplate (Recommended)**:
```java
@Entity
public class StudentCourse {
    @Id @GeneratedValue
    private Long id; // Single PK for simplicity

    @ManyToOne
    private Student student;

    @ManyToOne
    private Course course;

    private LocalDate enrollmentDate; // Extra field possible
}
```

---

## 2. Data Fetching & Performance

### ❌ Bad Practice: Lazy Loading without Fetch Joins (N+1 Problem)
Accessing lazy-loaded collections in a loop triggers N additional queries, devastating performance.

**Mitigation**: Use `JOIN FETCH` in JPQL/HQL to load associations in a single SQL query.

**Boilerplate (Recommended)**:
```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
```

### ❌ Bad Practice: Using `OpenSessionInView` (OSIV)
OSIV hides `LazyInitializationException` but leads to unpredictable N+1 issues in production and keeps database connections open too long.

**Mitigation**: Disable OSIV (`spring.jpa.open-in-view=false`). Use `LazyInitializationException` in development to identify missing fetch joins.

---

## 3. Concurrency & Integrity

### ❌ Bad Practice: Default Updates without Concurrency Control (Lost Updates)
Concurrent transactions updating the same entity without locking will result in the "Last Commit Wins" scenario, where data is silently lost.

**Mitigation**: Implement **Optimistic Locking** using the `@Version` annotation.

**Boilerplate (Recommended)**:
```java
@Entity
public class Inventory {
    @Id
    private Long id;

    @Version
    private Integer version; // Hibernate uses this for optimistic locking

    private Integer stockCount;
}

@Service
public class InventoryService {
    @Transactional
    public void updateStock(Long id, int quantity) {
        int retries = 3;
        while (retries > 0) {
            try {
                Inventory inv = repo.findById(id).orElseThrow();
                inv.setStockCount(inv.getStockCount() - quantity);
                repo.save(inv);
                return;
            } catch (OptimisticLockException e) {
                retries--;
                if (retries == 0) throw e;
                // Exponential backoff here
            }
        }
    }
}
```

---

## 4. Entity Design

### ❌ Bad Practice: ID-based `equals()` and `hashCode()`
Using the primary key in these methods is inconsistent for unsaved entities (where ID is null).

**Mitigation**: Use a stable **Business Key** (e.g., UUID, email, natural key) that is unique and present before saving. Always use getter methods to avoid proxy issues.

**Boilerplate (Recommended)**:
```java
@Entity
public class User {
    @Id @GeneratedValue
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email; // Business Key

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return Objects.equals(getEmail(), user.getEmail()); // Use getter
    }

    @Override
    public int hashCode() {
        return Objects.hash(getEmail()); // Use getter
    }
}
```

---

## Citations
- [How to save parent and children at once (JPA and Hibernate)](https://medium.com/@umeshcapg/how-to-save-parent-and-children-at-once-jpa-and-hibernate-in-springboot-with-examples-09d3276903d9)
- [Hibernate Best Practices](https://medium.com/@sabri.mutlucag/hibernate-best-practices-db78a86889e8)
- [Managing Concurrent Updates in Retail Systems](https://medium.com/@stefanalexandruioan/managing-concurrent-updates-in-retail-systems-with-java-hibernate-and-mysql-solution-2-with-a5f7749bf623)
