# SOP: Add New REST Endpoint

## Trigger

Adding a new REST API endpoint for a domain operation (create, update, delete, query).

## Files & Locations

### Backend (boilerplate/java/order-service)

| File | Path | Purpose |
|------|------|---------|
| Controller | `src/main/java/com/example/orderservice/infrastructure/api/{Name}Controller.java` | REST endpoints |
| Use Case Interface | `src/main/java/com/example/orderservice/application/usecases/{Name}UseCase.java` | Domain operation contract |
| Use Case Implementation | `src/main/java/com/example/orderservice/application/usecases/{Name}UseCaseImpl.java` | Business logic |
| Request DTO | `src/main/java/com/example/orderservice/application/dtos/{Name}Request.java` | Input validation |
| Response DTO | `src/main/java/com/example/orderservice/application/dtos/{Name}Response.java` | Output payload |
| Persistence Adapter | `src/main/java/com/example/orderservice/infrastructure/persistence/Jpa{Name}Repository.java` | DB access |
| Integration Test | `src/test/java/com/example/orderservice/infrastructure/api/{Name}ControllerTest.java` | Endpoint tests |
| Flyway Migration | `src/main/resources/db/migration/V{version}__{name}.sql` | Schema changes |

### Frontend (boilerplate/frontend)

| File | Path | Purpose |
|------|------|---------|
| API Service | `src/services/{name}.ts` | HTTP client calls |
| Hook | `src/hooks/use{Name}.ts` | React hook for resource |
| Component | `src/components/{Name}Form.tsx` | Form component |
| Page | `src/pages/{Name}sPage.tsx` | List/create page |
| Route Config | `src/App.tsx` | Add route |

## Procedure

### 1. Create Request DTO

```java
// src/main/java/com/example/orderservice/application/dtos/CreateProductNameRequest.java
package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProductNameRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 255, message = "Name must be 1-255 characters")
    String name,

    @NotBlank(message = "Description is required")
    @Size(min = 1, max = 1000, message = "Description must be 1-1000 characters")
    String description
) {}
```

### 2. Create Response DTO

```java
// src/main/java/com/example/orderservice/application/dtos/ProductNameResponse.java
package com.example.orderservice.application.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductNameResponse(
    UUID id,
    String name,
    String description,
    OffsetDateTime createdAt
) {}
```

### 3. Create Use Case Interface

```java
// src/main/java/com/example/orderservice/application/usecases/CreateProductNameUseCase.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CreateProductNameRequest;
import com.example.orderservice.application.dtos.ProductNameResponse;

public interface CreateProductNameUseCase {
    ProductNameResponse execute(CreateProductNameRequest request);
}
```

### 4. Create Use Case Implementation

```java
// src/main/java/com/example/orderservice/application/usecases/CreateProductNameUseCaseImpl.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CreateProductNameRequest;
import com.example.orderservice.application.dtos.ProductNameResponse;
import com.example.orderservice.domain.models.ProductName;
import com.example.orderservice.domain.models.ProductNameId;
import com.example.orderservice.domain.ports.ProductNameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CreateProductNameUseCaseImpl implements CreateProductNameUseCase {
    private final ProductNameRepository productNameRepository;

    @Override
    public ProductNameResponse execute(CreateProductNameRequest request) {
        ProductName productName = ProductName.create(
            new ProductName(request.name()),
            new ProductDescription(request.description())
        );

        ProductName saved = productNameRepository.save(productName);

        return new ProductNameResponse(
            saved.id().value(),
            saved.name().value(),
            saved.description().value(),
            saved.createdAt()
        );
    }
}
```

### 5. Create Controller

```java
// src/main/java/com/example/orderservice/infrastructure/api/ProductNameController.java
package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.CreateProductNameUseCase;
import com.example.orderservice.application.usecases.GetProductNameUseCase;
import com.example.orderservice.application.usecases.ListProductNameUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/product-names")
@RequiredArgsConstructor
public class ProductNameController {

    private final CreateProductNameUseCase createProductNameUseCase;
    private final GetProductNameUseCase getProductNameUseCase;
    private final ListProductNameUseCase listProductNameUseCase;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductNameResponse> createProductName(@Valid @RequestBody CreateProductNameRequest request) {
        ProductNameResponse response = createProductNameUseCase.execute(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductNameResponse> getProductName(@PathVariable UUID id) {
        ProductNameResponse response = getProductNameUseCase.execute(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductNameResponse>> listProductNames() {
        List<ProductNameResponse> responses = listProductNameUseCase.execute();
        return ResponseEntity.ok(responses);
    }
}
```

### 6. Create Flyway Migration

```sql
-- src/main/resources/db/migration/V2__create_product_names_table.sql
-- Version: 2
-- Description: Create product_names table

CREATE TABLE IF NOT EXISTS product_names (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version BIGINT DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_names_name ON product_names(name);
CREATE INDEX IF NOT EXISTS idx_product_names_created_at ON product_names(created_at);
```

### 7. Create Integration Test

```java
// src/test/java/com/example/orderservice/infrastructure/api/ProductNameControllerTest.java
package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.CreateProductNameRequest;
import com.example.orderservice.application.dtos.ProductNameResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductNameControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateProductName() throws Exception {
        CreateProductNameRequest request = new CreateProductNameRequest(
            "Test Product",
            "Test Description"
        );

        mockMvc.perform(post("/api/v1/product-names")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test Product\",\"description\":\"Test Description\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Test Product"))
            .andExpect(jsonPath("$.description").value("Test Description"));
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run integration tests**: `./mvnw test -Dtest=ProductNameControllerTest -f services/order-service/pom.xml`
3. **Start service**: `./mvnw spring-boot:run -f services/order-service/pom.xml`
4. **Test endpoint**: `curl -X POST http://localhost:8080/api/v1/product-names -H "Content-Type: application/json" -d '{"name":"Test","description":"Test-desc"}'`
5. **Verify DB**: `psql -c "SELECT * FROM product_names;"`

## Notes

- Use constructor injection only (no `@Autowired` on fields)
- Validate at DTO level with `jakarta.validation` annotations
- Return specific HTTP status codes (201 for create, 400 for validation, etc.)
- Always include `@Transactional` for write operations
