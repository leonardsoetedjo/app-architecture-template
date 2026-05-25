---
name: "SOP: Add New Aggregate Root"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: Add New Aggregate Root

## Trigger

Adding a new domain entity (e.g., Product, Customer, Shipment) with its value objects, domain events, and repository pattern.

## Files & Locations

### Backend (boilerplate/java/order-service)

| File | Path | Purpose |
|------|------|---------|
| Aggregate Root | `src/main/java/com/example/orderservice/domain/models/{Name}.java` | Domain entity with value objects |
| Repository Port | `src/main/java/com/example/orderservice/domain/ports/{Name}Repository.java` | Interface for persistence |
| Domain Test | `src/test/java/com/example/orderservice/domain/models/{Name}Test.java` | Unit tests |
| Persistence Entity | `src/main/java/com/example/orderservice/infrastructure/persistence/{Name}Entity.java` | JPA entity |
| Persistence Repository | `src/main/java/com/example/orderservice/infrastructure/persistence/{Name}JpaRepository.java` | Spring Data JPA |
| Persistence Adapter | `src/main/java/com/example/orderservice/infrastructure/persistence/Jpa{Name}Repository.java` | Repository implementation |

### Frontend (boilerplate/frontend)

| File | Path | Purpose |
|------|------|---------|
| TypeScript Type | `src/types/{Name}.ts` | Interface definitions |
| API Service | `src/services/{name}.ts` | API client methods |
| Hook | `src/hooks/use{Name}s.ts` | React hook for data fetching |
| Component | `src/components/{Name}List.tsx` | Presentational component |
| Page | `src/pages/{Name}sPage.tsx` | Route-level page |
| Test | `src/tests/{name}.test.ts` | Unit/integration tests |

## Procedure

### 1. Create Aggregate Root & Value Objects

```java
// src/main/java/com/example/orderservice/domain/models/ProductName.java
package com.example.orderservice.domain.models;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductNameId(UUID value) {
    public static ProductNameId generate() {
        return new ProductNameId(UUID.randomUUID());
    }
}

public record ProductName(String value) {
    public ProductName {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
    }
}

public record ProductDescription(String value) {
    public ProductDescription {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be null or empty");
        }
    }
}

public record ProductName(
    ProductNameId id,
    ProductName name,
    ProductDescription description,
    OffsetDateTime createdAt
) {
    public ProductName {
        if (name == null || description == null) {
            throw new IllegalArgumentException("Name and description are required");
        }
    }

    public static ProductName create(ProductName name, ProductDescription description) {
        return new ProductName(
            ProductNameId.generate(),
            name,
            description,
            OffsetDateTime.now(ZoneOffset.UTC)
        );
    }
}
```

### 2. Create Repository Port

```java
// src/main/java/com/example/orderservice/domain/ports/ProductNameRepository.java
package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.ProductName;
import com.example.orderservice.domain.models.ProductNameId;
import java.util.Optional;

public interface ProductNameRepository {
    Optional<ProductName> findById(ProductNameId id);
    ProductName save(ProductName productName);
}
```

### 3. Create Domain Event (if applicable)

```java
// src/main/java/com/example/orderservice/domain/models/events/ProductNameCreated.java
package com.example.orderservice.domain.models.events;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductNameCreated(
    UUID id,
    ProductNameId productNameId,
    OffsetDateTime createdAt
) {}
```

### 4. Create Persistence Entity

```java
// src/main/java/com/example/orderservice/infrastructure/persistence/ProductNameEntity.java
package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.OffsetDateTime;

@Entity
@Table(name = "product_names")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductNameEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
```

### 5. Create JPA Repository

```java
// src/main/java/com/example/orderservice/infrastructure/persistence/ProductNameJpaRepository.java
package com.example.orderservice.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProductNameJpaRepository extends JpaRepository<ProductNameEntity, UUID> {
}
```

### 6. Create Persistence Adapter

```java
// src/main/java/com/example/orderservice/infrastructure/persistence/JpaProductNameRepository.java
package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.ProductName;
import com.example.orderservice.domain.models.ProductNameId;
import com.example.orderservice.domain.ports.ProductNameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class JpaProductNameRepository implements ProductNameRepository {
    private final ProductNameJpaRepository jpaRepository;

    @Override
    public ProductName save(ProductName productName) {
        ProductNameEntity entity = ProductNameEntity.builder()
            .id(productName.id().value())
            .name(productName.name().value())
            .description(productName.description().value())
            .createdAt(productName.createdAt())
            .build();

        ProductNameEntity saved = jpaRepository.save(entity);

        return new ProductName(
            new ProductNameId(saved.getId()),
            new ProductName(saved.getName()),
            new ProductDescription(saved.getDescription()),
            saved.getCreatedAt()
        );
    }

    @Override
    public Optional<ProductName> findById(ProductNameId id) {
        return jpaRepository.findById(id.value())
            .map(entity -> new ProductName(
                new ProductNameId(entity.getId()),
                new ProductName(entity.getName()),
                new ProductDescription(entity.getDescription()),
                entity.getCreatedAt()
            ));
    }
}
```

### 7. Create Domain Test

```java
// src/test/java/com/example/orderservice/domain/models/ProductNameTest.java
package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ProductNameTest {

    @Test
    void shouldCreateProductNameSuccessfully() {
        ProductName name = new ProductName("Test Name");
        ProductDescription desc = new ProductDescription("Test Description");

        ProductName result = ProductName.create(name, desc);

        assertNotNull(result.id());
        assertEquals("Test Name", result.name().value());
        assertEquals("Test Description", result.description().value());
    }

    @Test
    void shouldThrowExceptionForEmptyName() {
        assertThrows(IllegalArgumentException.class, () -> 
            new ProductName("")
        );
    }

    @Test
    void shouldThrowExceptionForNullName() {
        assertThrows(IllegalArgumentException.class, () -> 
            new ProductName(null)
        );
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run domain tests**: `./mvnw test -Dtest=ProductNameTest -f services/order-service/pom.xml`
3. **Verify class files**: Check `target/classes/com/example/orderservice/domain/models/` contains compiled classes
4. **Check persistence**: Verify JPA entity table exists in database
5. **Frontend test**: `cd frontend && npm test -- {name}.test.ts`

## Notes

- All domain objects must be immutable records
- Value objects validate in constructor
- Never use `null` in domain - use `Optional` or null objects
- Domain events use past tense naming
