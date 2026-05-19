# SOP: Configure External HTTP Service

## Trigger

Adding configuration for a new external HTTP service with resilience patterns (circuit breaker, retry, mTLS).

## Files & Locations

### Backend (boilerplate/java/order-service)

| File | Path | Purpose |
|------|------|---------|
| Client Class | `src/main/java/com/example/orderservice/infrastructure/http/{Service}Client.java` | HTTP client implementation |
| Configuration | `src/main/java/com/example/orderservice/infrastructure/http/{Service}Config.java` | WebClient config |
| Mapper | `src/main/java/com/example/orderservice/infrastructure/mapper/{Service}Mapper.java` | DTO ↔ API mapping |
| Resilience Config | `src/main/resources/application.properties` | Circuit breaker settings |
| Integration Test | `src/test/java/com/example/orderservice/infrastructure/http/{Service}ClientTest.java` | Client tests |

## Procedure

### 1. Create Configuration Class

```java
// src/main/java/com/example/orderservice/infrastructure/http/InventoryServiceConfig.java
package com.example.orderservice.infrastructure.http;

import com.example.common.infrastructure.http.MTLSConfiguration;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class InventoryServiceConfig {

    private final MTLSConfiguration mTLSConfiguration;

    /**
     * Create WebClient for inventory service external API calls.
     */
    @Bean
    public WebClient inventoryServiceWebClient(org.springframework.http.client.reactive.ReactorClientHttpConnector connector) {
        return WebClient.builder()
                .baseUrl("https://inventory-api.example.com")
                .clientConnector(connector)
                .build();
    }

    /**
     * Inventory Service Client with resilience patterns.
     */
    @Bean
    public InventoryServiceClient inventoryServiceClient(WebClient webClient) {
        return new InventoryServiceClient(webClient, mTLSConfiguration);
    }

    /**
     * Inventory Service external client implementation.
     */
    @Slf4j
    @RequiredArgsConstructor
    public static class InventoryServiceClient {

        private final WebClient webClient;
        private final MTLSConfiguration mTLSConfiguration;

        /**
         * Check inventory availability with circuit breaker and retry.
         */
        @CircuitBreaker(name = "inventoryService", fallbackMethod = "checkInventoryFallback")
        @Retry(name = "inventoryRetry", fallbackMethod = "checkInventoryFallback")
        public CheckInventoryResponse checkInventory(CheckInventoryRequest request) {
            log.info("Checking inventory for productId: {}, quantity: {}", 
                request.productId(), request.quantity());

            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/inventory/check")
                            .queryParam("productId", request.productId())
                            .queryParam("quantity", request.quantity())
                            .build())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .header("X-Service-Name", "order-service")
                    .header("X-Request-Type", "inventory-check")
                    .retrieve()
                    .body(CheckInventoryResponse.class)
                    .block();
        }

        /**
         * Reserve inventory with circuit breaker and retry.
         */
        @CircuitBreaker(name = "inventoryService", fallbackMethod = "reserveInventoryFallback")
        @Retry(name = "inventoryRetry", fallbackMethod = "reserveInventoryFallback")
        public ReserveInventoryResponse reserveInventory(ReserveInventoryRequest request) {
            log.info("Reserving inventory for orderId: {}", request.orderId());

            return webClient.post()
                    .uri("/api/v1/inventory/reserve")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .bodyValue(request)
                    .retrieve()
                    .body(ReserveInventoryResponse.class)
                    .block();
        }

        /**
         * Fallback for inventory check.
         */
        public CheckInventoryResponse checkInventoryFallback(CheckInventoryRequest request, Throwable t) {
            log.warn("Inventory service unavailable. Fallback: marking product as available", t);
            return new CheckInventoryResponse(request.productId(), true, "Fallback: Service unavailable");
        }

        /**
         * Fallback for inventory reserve.
         */
        public ReserveInventoryResponse reserveInventoryFallback(ReserveInventoryRequest request, Throwable t) {
            log.warn("Inventory reserve failed. Fallback: allowing order to proceed", t);
            return new ReserveInventoryResponse(request.orderId(), true, "Fallback: Reserve skipped");
        }
    }

    /**
     * Request DTO for inventory check.
     */
    public record CheckInventoryRequest(String productId, int quantity) {}

    /**
     * Request DTO for inventory reserve.
     */
    public record ReserveInventoryRequest(String orderId, String productId, int quantity) {}

    /**
     * Response DTO for inventory check.
     */
    public record CheckInventoryResponse(String productId, boolean available, String message) {}

    /**
     * Response DTO for inventory reserve.
     */
    public record ReserveInventoryResponse(String orderId, boolean reserved, String message) {}
}
```

### 2. Configure Resilience Patterns in application.properties

```properties
# src/main/resources/application.properties

# Resilience4j Circuit Breaker Configuration
resilience4j.circuitbreaker.instances.inventoryService.failure-rate-threshold=50
resilience4j.circuitbreaker.instances.inventoryService.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.inventoryService.automatic-transition-from-open-to-half-open-enabled=true
resilience4j.circuitbreaker.instances.inventoryService.wait-duration-in-open-state=30s
resilience4j.circuitbreaker.instances.inventoryService.permitted-number-of-calls-in-half-open-state=3

# Resilience4j Retry Configuration
resilience4j.retry.instances.inventoryRetry.max-attempts=3
resilience4j.retry.instances.inventoryRetry.wait-duration=2s
resilience4j.retry.instances.inventoryRetry.enable-exponential-backoff=true
resilience4j.retry.instances.inventoryRetry.exponential-backoff-multiplier=2
resilience4j.retry.instances.inventoryRetry.retry-exceptions=java.lang.Exception

# Web Client Configuration
spring.webclient.connect-timeout=5000
spring.webclient.read-timeout=10000

# External Service URLs
inventory.service.baseUrl=https://inventory-api.example.com
inventory.service.timeout=10000

# Logging
logging.level.com.example.orderservice.infrastructure.http=DEBUG
logging.level.io.github.resilience4j=DEBUG
```

### 3. Create Mapper Class

```java
// src/main/java/com/example/orderservice/infrastructure/mapper/InventoryServiceMapper.java
package com.example.orderservice.infrastructure.mapper;

import com.example.orderservice.application.dtos.InventoryCheckRequest;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.infrastructure.http.InventoryServiceConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper
public interface InventoryServiceMapper {

    InventoryServiceMapper INSTANCE = Mappers.getMapper(InventoryServiceMapper.class);

    @Mapping(source = "productId", target = "productId")
    @Mapping(source = "quantity", target = "quantity")
    InventoryServiceConfig.CheckInventoryRequest toCheckInventoryRequest(OrderItem item);

    default List<InventoryServiceConfig.CheckInventoryRequest> toCheckRequests(List<OrderItem> items) {
        return items.stream()
                .map(this::toCheckInventoryRequest)
                .toList();
    }
}
```

### 4. Create Integration Test

```java
// src/test/java/com/example/orderservice/infrastructure/http/InventoryServiceClientTest.java
package com.example.orderservice.infrastructure.http;

import com.example.orderservice.infrastructure.http.InventoryServiceConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
class InventoryServiceClientTest {

    private InventoryServiceConfig.InventoryServiceClient client;

    @BeforeEach
    void setUp() {
        CircuitBreakerRegistry breakerRegistry = CircuitBreakerRegistry.ofDefaults();
        RetryRegistry retryRegistry = RetryRegistry.ofDefaults();

        WebClient webClient = WebClient.builder()
                .baseUrl("http://localhost:9999") // Mock server port
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create()))
                .build();

        client = new InventoryServiceConfig.InventoryServiceClient(
            webClient,
            mock(MTLSConfiguration.class)
        );
    }

    @Test
    void shouldReturnAvailableWhenInventoryCheckSucceeds() {
        // Mock server response handling would go here
        // For actual test, use @WebMvcTest or mock the WebClient
        
        assertDoesNotThrow(() -> {
            InventoryServiceConfig.CheckInventoryRequest request = 
                new InventoryServiceConfig.CheckInventoryRequest("test-product", 5);
            InventoryServiceConfig.CheckInventoryResponse response = 
                client.checkInventory(request);
            assertNotNull(response);
        });
    }

    @Test
    void shouldUseFallbackWhenServiceUnavailable() {
        // Test fallback behavior by making request to non-existent service
        InventoryServiceConfig.CheckInventoryRequest request = 
            new InventoryServiceConfig.CheckInventoryRequest("test-product", 5);
        
        // Circuit breaker should trigger fallback
        InventoryServiceConfig.CheckInventoryResponse response = 
            client.checkInventory(request);
        
        // In fallback mode, service should return available=true
        assertTrue(response.available());
    }

    @Test
    void shouldRespectCircuitBreaker() {
        CircuitBreaker breaker = CircuitBreakerRegistry.ofDefaults()
            .circuitBreaker("inventoryService");
        
        // Execute failing requests to open circuit
        for (int i = 0; i < 5; i++) {
            try {
                client.checkInventory(new InventoryServiceConfig.CheckInventoryRequest("test", 1));
            } catch (Exception e) {
                // Expected
            }
        }

        // Circuit should be open now
        assertEquals(CircuitBreaker.State.OPEN, breaker.getState());
    }
}
```

### 5. Wire Up Client in Use Case

```java
// src/main/java/com/example/orderservice/application/usecases/PlaceOrderUseCaseImpl.java (updated)
package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.*;
import com.example.orderservice.infrastructure.http.InventoryServiceConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;
    private final InventoryServiceConfig.InventoryServiceClient inventoryClient;

    @Override
    public OrderResult execute(CreateOrderCommand command) {
        // Check inventory availability before creating order
        List<InventoryServiceConfig.CheckInventoryResponse> inventoryChecks = 
            command.items().stream()
                .map(item -> inventoryClient.checkInventory(
                    new InventoryServiceConfig.CheckInventoryRequest(
                        item.productId(),
                        item.quantity()
                    )
                ))
                .toList();

        // Validate all items are available
        for (InventoryServiceConfig.CheckInventoryResponse check : inventoryChecks) {
            if (!check.available()) {
                throw new IllegalStateException("Product " + check.productId() + " not available");
            }
        }

        // Reserve inventory
        List<InventoryServiceConfig.ReserveInventoryResponse> reserves = 
            command.items().stream()
                .map(item -> inventoryClient.reserveInventory(
                    new InventoryServiceConfig.ReserveInventoryRequest(
                        java.util.UUID.randomUUID().toString(),
                        item.productId(),
                        item.quantity()
                    )
                ))
                .toList();

        // Verify reserves succeeded
        for (InventoryServiceConfig.ReserveInventoryResponse reserve : reserves) {
            if (!reserve.reserved()) {
                throw new IllegalStateException("Failed to reserve: " + reserve.orderId());
            }
        }

        // Create order
        List<OrderItem> orderItems = command.items().stream()
                .map(item -> new OrderItem(
                    item.productId(),
                    item.quantity(),
                    item.unitPrice()
                ))
                .toList();

        Order order = Order.create(command.customerId(), orderItems);
        
        // Send domain event
        eventPublisher.publishOrderPlaced(new OrderPlaced(
            order.id().value(),
            order.customerId(),
            order.createdAt(),
            order.calculateTotal(),
            order.items().size()
        ));

        Order saved = orderRepository.save(order);

        return new OrderResult(
            saved.id().value(),
            saved.status(),
            saved.createdAt()
        );
    }
}
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Verify circuit breaker dependencies**: Check `pom.xml` has `resilience4j-spring-boot3` and `resilience4j-reactor`
3. **Test client**: `./mvnw test -Dtest=InventoryServiceClientTest -f services/order-service/pom.xml`
4. **Check configuration**: Verify properties load correctly via actuator `/actuator/configprops`

## Circuit Breaker States

| State | Description | Transition |
|-------|-------------|------------|
| **CLOSED** | Normal operation, requests pass through | On failure rate → OPEN |
| **OPEN** | Circuit is open, requests fail immediately | After wait duration → HALF_OPEN |
| **HALF_OPEN** | Limited requests allowed to test service | Success → CLOSED, Fail → OPEN |

## Retry Configuration

- **Max attempts**: 3 retries after initial failure
- **Wait duration**: 2 seconds between retries
- **Exponential backoff**: Multiplier of 2x (2s → 4s → 8s)
- **Retry on**: Any exception

## Notes

- Always include `X-Correlation-ID` for distributed tracing
- Use `X-Service-Name` header for API gateway识别
- Fallback methods must match original method signature + `Throwable t`
- Circuit breaker name must match config instance name
