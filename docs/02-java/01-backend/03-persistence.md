---
name: "JPA/Hibernate Best Practices"
type: "Guideline"
version: "1.0"
---

# Persistence & JPA/Hibernate Best Practices

This document consolidates JPA and Hibernate patterns distilled from production experience. It focuses on the *anti-patterns that cause real issues*, how to detect them, and the boilerplate that prevents them. Follow these practices to keep the persistence layer predictable, performant, and debuggable.

**References**

- [^1] Sabri Mutluçak, "Hibernate Best Practices", Medium, 2025 — [https://medium.com/@sabri.mutlucag/hibernate-best-practices-db78a86889e8](https://medium.com/@sabri.mutlucag/hibernate-best-practices-db78a86889e8)
- [^2] Umesh Kumar Yadav, "How to save parent and children at once (JPA and Hibernate) in Spring Boot", Medium, 2025 — [https://medium.com/@umeshcapg/how-to-save-parent-and-children-at-once-jpa-and-hibernate-in-springboot-with-examples-09d3276903d9](https://medium.com/@umeshcapg/how-to-save-parent-and-children-at-once-jpa-and-hibernate-in-springboot-with-examples-09d3276903d9)
- [^3] Stefan Alex, "Managing Concurrent Updates in Retail Systems with Java, Hibernate, and MySQL", Medium, 2024 — [https://medium.com/@stefanalexandruioan/managing-concurrent-updates-in-retail-systems-with-java-hibernate-and-mysql-solution-2-with-a5f7749bf623](https://medium.com/@stefanalexandruioan/managing-concurrent-updates-in-retail-systems-with-java-hibernate-and-mysql-solution-2-with-a5f7749bf623)

---

## 1. Cascading: Avoid `CascadeType.ALL`

**Issue**: `CascadeType.ALL` (or even `PERSIST`) makes a single `save()` on a parent silently trigger inserts, updates, or deletes on every child. In a production system, this leads to data loss, phantom writes, and unpredictable persistence behavior.

**Mitigation**:
- Do **not** use `CascadeType.ALL` by default.
- If cascading is truly needed (e.g., an `Order` and its `OrderLineItems`), use `CascadeType.PERSIST` and `CascadeType.MERGE` explicitly and document the behavior in code comments.
- Keep `orphanRemoval` disabled unless you explicitly intend to delete child rows when removed from a collection.
- Save parent and children separately in the application service layer to maintain explicit control.

**Boilerplate — Explicit Save**:
```java
@Service
@RequiredArgsConstructor
public class OrderPlacementService {
    private final OrderRepository orderRepository;
    private final OrderLineItemRepository lineItemRepository;

    @Transactional
    public OrderId placeOrder(PlaceOrderCommand cmd) {
        OrderEntity order = OrderEntity.builder()
            .customerId(cmd.customerId())
            .status(OrderStatus.PENDING)
            .build();
        orderRepository.save(order);

        for (OrderLineItem item : cmd.items()) {
            OrderLineItemEntity line = OrderLineItemEntity.builder()
                .orderId(order.getId())
                .productId(item.productId())
                .quantity(item.quantity())
                .build();
            lineItemRepository.save(line);
        }
        return order.getId();
    }
}
```

---

## 2. Prefer Lazy Loading as the Default

**Issue**: `FetchType.EAGER` on `@OneToMany` or `@ManyToMany` causes the database to load every related row even when the collection is never accessed in the business flow. This increases memory pressure and query time, especially when the entity graph is deep.

**Mitigation**:
- Set `FetchType.LAZY` on all `@OneToMany`, `@ManyToMany`, `@ManyToOne`, and `@OneToOne` relationships by default.
- When you need related data for a specific use case, fetch it explicitly using `JOIN FETCH` or `@EntityGraph`.
- Profile queries with Hibernate statistics (`hibernate.generate_statistics=true`) before making any relationship eager.

**Boilerplate — Explicit Fetch**:
```java
// JPQL with explicit join fetch
@Query("SELECT o FROM OrderEntity o JOIN FETCH o.lineItems WHERE o.id = :id")
Optional<OrderEntity> findByIdWithItems(@Param("id") UUID id);

// Named entity graph
@Entity
@Table(name = "orders")
@NamedEntityGraph(
    name = "Order.withItems",
    attributeNodes = @NamedAttributeNode("lineItems")
)
public class OrderEntity { ... }
```

---

## 3. Avoid SELECT * on Wide Tables

**Issue**: Hibernate maps every column by default. For tables with many columns, large text fields, or binary blobs, this wastes memory and increases query latency.

**Mitigation**:
- Use DTO projections (constructor expressions) in JPQL for read-only scenarios.
- For very large columns, use `@Basic(fetch = FetchType.LAZY)` — this requires bytecode enhancement.
- Consider splitting wide tables into logical sub-entities if the data is not accessed together.

**Boilerplate — DTO Projection**:
```java
@Query("SELECT new com.example.OrderSummaryDTO(o.id, o.status, o.totalAmount, o.createdDate) " +
       "FROM OrderEntity o WHERE o.customerId = :customerId")
List<OrderSummaryDTO> findSummariesByCustomer(@Param("customerId") UUID customerId);
```

---

## 4. Use @Transactional Properly

**Issue**: Misplaced or misconfigured transactions cause:
- Long-lived transactions that hold locks and connections, reducing throughput.
- Unintended dirty writes because read operations were not marked read-only.
- External service calls inside a transaction extending lock duration.

**Mitigation**:
- Place `@Transactional` only on the application / use-case service layer. Never on controllers or repositories.
- Annotate read-only flows with `@Transactional(readOnly = true)` to skip dirty checking and unnecessary flushes.
- Keep transactions short. Never call external HTTP or messaging services inside a write transaction.
- Use explicit propagation when needed: `REQUIRES_NEW` for independent writes, `SUPPORTS` for optional transactions.

**Boilerplate — Transaction Scoping**:
```java
@Service
@RequiredArgsConstructor
public class OrderService {

    @Transactional(readOnly = true)
    public OrderDTO getOrder(UUID orderId) {
        // Read-only: no version increment, no flush
        return orderRepository.findById(orderId)
            .map(orderMapper::toDTO)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    @Transactional
    public OrderId createOrder(CreateOrderCommand cmd) {
        // Short write transaction: validate, persist, commit
        OrderEntity order = orderMapper.toEntity(cmd);
        orderRepository.save(order);
        return order.getId();
    }
}
```

---

## 5. First-Level Cache Management

**Issue**: Hibernate's persistence context (first-level cache) holds every loaded entity in the current session. For batch jobs or large imports, this causes memory bloat and can exhaust the heap.

**Mitigation**:
- After every batch chunk in a loop, call `entityManager.flush()` followed by `entityManager.clear()` to release memory.
- Use pagination (`Pageable`) for large result sets instead of loading everything.
- For massive bulk inserts or updates, use `StatelessSession` to bypass the first-level cache entirely.
- For reporting or analytical queries that only read data, consider native SQL or a separate read-only data source.

**Boilerplate — Batch Loop**:
```java
@Transactional
public void importProducts(List<ImportProductDTO> dtos) {
    for (int i = 0; i < dtos.size(); i++) {
        ProductEntity p = productMapper.toEntity(dtos.get(i));
        entityManager.persist(p);
        if (i % 50 == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }
}
```

---

## 6. Prevent N+1 Query Problems

**Issue**: Loading N parent entities and then lazily accessing their collections triggers N additional SELECT statements, multiplying query count linearly with the number of parents.

**Mitigation**:
- Enable SQL logging (`spring.jpa.show-sql=true`) during development and inspect query counts.
- Use `JOIN FETCH` for collections that are always needed in the same query.
- Use `BatchSize` on collections when the number of parents is variable but the total dataset is still bounded.
- Use DTO projections for read-only flows to avoid loading the entity graph entirely.

**Boilerplate — Batch Fetching**:
```java
@Entity
@Table(name = "orders")
public class OrderEntity {
    @OneToMany(mappedBy = "orderId", fetch = FetchType.LAZY)
    @BatchSize(size = 25)
    private List<OrderLineItemEntity> lineItems;
}
```

---

## 7. Read Models: Use DTOs for Queries

**Issue**: Loading full entities for read-only screens triggers dirty checking, unnecessary version checks, and large object graph loading.

**Mitigation**:
- Every read-heavy endpoint should return DTOs, not entities.
- Use interface-based or class-based projections in Spring Data.
- For complex reports, use native SQL with a thin mapping layer or a CQRS read model.

**Boilerplate — Interface Projection**:
```java
public interface OrderSummaryProjection {
    UUID getId();
    String getStatus();
    BigDecimal getTotalAmount();
    Instant getCreatedDate();
}

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderSummaryProjection> findByCustomerId(UUID customerId);
}
```

---

## 8. StatelessSession for Bulk Operations

**Issue**: The standard `Session` caches every persisted entity, causing OOM on large imports or batch updates.

**Mitigation**:
- Use `StatelessSession` for any operation that inserts or updates more than a few hundred rows in one run.
- Manually manage transactions around the stateless session.
- Do not use cascading or lazy loading with a stateless session — they are unsupported.

**Boilerplate — StatelessSession**:
```java
@Service
@RequiredArgsConstructor
public class ProductImportService {
    private final SessionFactory sessionFactory;

    @Transactional(readOnly = false)
    public void bulkImport(List<ProductEntity> products) {
        StatelessSession session = sessionFactory.openStatelessSession();
        Transaction tx = session.beginTransaction();
        try {
            for (ProductEntity p : products) {
                session.insert(p);
            }
            tx.commit();
        } catch (Exception e) {
            tx.rollback();
            throw e;
        } finally {
            session.close();
        }
    }
}
```

---

## 9. Avoid JPA for Complex Reporting

**Issue**: JPQL lacks window functions, CTEs, and complex analytical operations. Trying to express these in JPQL results in inefficient queries or excessive application-side processing.

**Mitigation**:
- For aggregation, grouping, windowing, or cross-database reports, use native SQL.
- Maintain a separate read database or materialized view populated by domain events for heavy reporting.
- Keep JPA for transactional CRUD and simple lookups only.

---

## 10. Unidirectional Relationships by Default

**Issue**: Bidirectional associations require manual synchronization on both sides. They are a common source of:
- Infinite recursion in `toString()` and JSON serialization.
- `StackOverflowError` in `equals()` and `hashCode()`.
- Inconsistent object graphs when only one side is updated.

**Mitigation**:
- Start every relationship as unidirectional.
- Only add the reverse side when there is a clear query or traversal need.
- If bidirectional is necessary, use a helper method that updates both sides atomically.
- Break circular references in `toString()`, `equals()`, and `hashCode()` using the business key only.

**Boilerplate — Safe Helper Method**:
```java
@Entity
public class OrderEntity {
    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST, orphanRemoval = false)
    private List<OrderLineItemEntity> lineItems = new ArrayList<>();

    public void addLineItem(OrderLineItemEntity item) {
        lineItems.add(item);
        item.setOrder(this); // keep both sides in sync
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderEntity)) return false;
        return id != null && id.equals(((OrderEntity) o).id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

---

## 11. equals() and hashCode() Based on Immutable Business Keys

**Issue**: Using auto-generated database IDs in `equals()` and `hashCode()` causes lookup failures when entities are placed in `Set` or `Map` before being persisted. The hash code changes after the ID is assigned, violating the `hashCode()` contract.

**Mitigation**:
- Base `equals()` and `hashCode()` on an immutable business key (e.g., order number, SKU, email).
- For entities without natural keys, assign a UUID at construction time and use that as the key.
- Never use `@GeneratedValue` IDs in these methods.

**Boilerplate — Business-Key Identity**:
```java
@Entity
public class ProductEntity {
    @Id private UUID id; // assigned at construction, not generated
    @Column(unique = true, nullable = false)
    private String sku;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductEntity)) return false;
        return sku != null && sku.equals(((ProductEntity) o).sku);
    }

    @Override
    public int hashCode() {
        return sku != null ? sku.hashCode() : getClass().hashCode();
    }
}
```

---

## 12. Map Enums as Strings

**Issue**: `@Enumerated(EnumType.ORDINAL)` stores integer values. If enum constants are reordered, existing database rows become semantically invalid.

**Mitigation**:
- Always use `@Enumerated(EnumType.STRING)` so the database stores the enum name, making the column self-describing and immune to reordering.

**Boilerplate**:
```java
public enum OrderStatus { PENDING, CONFIRMED, SHIPPED, CANCELLED }

@Entity
public class OrderEntity {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
}
```

---

## 13. Be Careful with @ElementCollection

**Issue**: `@ElementCollection` stores simple values (e.g., tags, phone numbers) in a separate table. It lacks an independent identity and is fully loaded with the parent. Some Hibernate versions delete and re-insert all elements on every update.

**Mitigation**:
- Only use `@ElementCollection` for truly embedded, immutable, simple value types.
- If the collection needs independent lifecycle, querying, or complex attributes, promote it to a full `@OneToMany` entity.

**Boilerplate**:
```java
@Entity
public class UserEntity {
    @ElementCollection
    @CollectionTable(name = "user_tags", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "tag")
    private List<String> tags; // simple, immutable tags only
}
```

---

## 14. Use Entity Graphs Instead of Eager Mapping

**Issue**: Changing the fetch type in the entity mapping to `EAGER` pollutes the model for all use cases — even those that don't need the related data.

**Mitigation**:
- Keep the mapping default as `LAZY`.
- Use `@NamedEntityGraph` for per-query eager fetching.
- In Spring Data, annotate repository methods with `@EntityGraph` to load the graph on demand.

**Boilerplate — Named Entity Graph**:
```java
@Entity
@NamedEntityGraph(
    name = "Order.withItemsAndProducts",
    attributeNodes = {
        @NamedAttributeNode(value = "lineItems", subgraph = "itemProducts")
    },
    subgraphs = @NamedSubgraph(
        name = "itemProducts",
        attributeNodes = @NamedAttributeNode("product")
    )
)
public class OrderEntity { ... }

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    @EntityGraph(value = "Order.withItemsAndProducts", type = EntityGraph.EntityGraphType.LOAD)
    Optional<OrderEntity> findById(UUID id);
}
```

---

## 15. QueryDSL for Dynamic Queries

**Issue**: String-based JPQL or Criteria API is verbose, error-prone, and type-unsafe when building dynamic WHERE clauses.

**Mitigation**:
- Use **QueryDSL** for all dynamically constructed queries.
- Generate Q-classes from entities at build time.
- Use `JPAQueryFactory` to compose predicates fluently.

**Boilerplate — QueryDSL Predicate**:
```java
@Service
@RequiredArgsConstructor
public class OrderQueryService {
    private final JPAQueryFactory queryFactory;

    public List<OrderEntity> search(OrderSearchCriteria criteria) {
        QOrderEntity order = QOrderEntity.orderEntity;
        BooleanBuilder builder = new BooleanBuilder();

        if (criteria.status() != null) {
            builder.and(order.status.eq(criteria.status()));
        }
        if (criteria.fromDate() != null) {
            builder.and(order.createdDate.goe(criteria.fromDate()));
        }

        return queryFactory.selectFrom(order)
            .where(builder)
            .orderBy(order.createdDate.desc())
            .fetch();
    }
}
```

---

## 16. Separate Read and Write Models (CQRS)

**Issue**: Using the same entity model for reads and writes causes compromise: read queries load business logic and validation they don't need; write operations load display graphs they don't use.

**Mitigation**:
- Create flat, denormalized DTOs or views for read operations.
- Keep the write model focused on domain invariants and validation.
- For complex read models, use event-sourced projections or a separate read database populated by domain events.
- This is already standard in the project: domain entities are pure Java; persistence entities are JPA-mapped; DTOs cross layer boundaries.

---

## 17. Optimistic Locking Summary

Concurrent updates are covered in detail in [`01-database.md`](./01-database.md) §2.4. The short version:

- Add `@Version Long version` to every updatable entity.
- Wrap write operations in Resilience4j `@Retry` with exponential backoff.
- Use pessimistic locking (`LockModeType.PESSIMISTIC_WRITE`) only for hotspots.
- Keep transaction scope minimal — no external I/O inside write transactions.

---

## 18. Audit Checklist — Persistence Anti-Patterns

| Anti-Pattern | Detection | Resolution |
|-------------|-----------|------------|
| `CascadeType.ALL` on entity mappings | Search codebase for `CascadeType.ALL` or `CascadeType.PERSIST` without explicit justification comment | Replace with explicit per-entity saves or limit to `PERSIST` + `MERGE` with documentation |
| `FetchType.EAGER` on collections | Search for `FetchType.EAGER` in `@OneToMany`, `@ManyToMany`, `@ManyToOne` | Replace with `LAZY` + explicit `JOIN FETCH` or `@EntityGraph` |
| Wide-table `SELECT *` on entities used only for display | Profile queries; check for entity loads without subsequent state changes | Use DTO projections or interface projections |
| Long transactions with external I/O | Search for `@Transactional` methods that call HTTP clients or file I/O | Split into read-then-execute; externalize I/O outside the transaction |
| Missing `@Version` on mutable entities | Check all `@Entity` classes for the absence of `@Version` | Add `Long version` + `@Version` |
| `equals()` / `hashCode()` using generated ID | Search `hashCode()` implementations that reference `getId()` or `id` | Re-implement using immutable business key or UUID assigned at construction |
| `@Enumerated(EnumType.ORDINAL)` | Search for `ORDINAL` in enum mappings | Replace with `STRING` |
| `@ElementCollection` with mutable complex types | Search for `@ElementCollection` on non-primitive collections | Promote to `@OneToMany` entity if mutation or querying is needed |
| `StatelessSession` not used for bulk > 100 rows | Check batch import / bulk update code for standard `EntityManager` usage | Switch to `StatelessSession` with manual transaction management |
| N+1 query in production | Enable Hibernate statistics; look for repeated similar SELECTs | Add `JOIN FETCH`, `@BatchSize`, or DTO projections |
| Missing `flush()` / `clear()` in batch loops | Search for loops that persist without periodic flush/clear | Add flush/clear every N iterations (N ≤ 50) |
| Read-write model conflation | Check if domain entities are returned directly from REST endpoints | Introduce DTO layer; separate read model for complex queries |
