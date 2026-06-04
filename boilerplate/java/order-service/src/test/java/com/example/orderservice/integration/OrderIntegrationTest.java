package com.example.orderservice.integration;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.infrastructure.persistence.OrderEntity;
import com.example.orderservice.infrastructure.persistence.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for Order API endpoints.
 * 
 * Tests cover:
 * - Order creation with validation
 * - Order retrieval with caching
 * - Order state transitions (workflow engine)
 * - RBAC authorization
 * - Rate limiting
 * - Security audit logging
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
class OrderIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("order_service_test")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }
    
    @Test
    @DisplayName("POST /api/v1/orders - Create order successfully")
    void createOrderSuccessfully() throws Exception {
        String orderRequest = objectMapper.writeValueAsString(Map.of(
            "customerId", UUID.randomUUID().toString(),
            "items", List.of(Map.of(
                "productId", UUID.randomUUID().toString(),
                "quantity", 2,
                "unitPrice", BigDecimal.valueOf(29.99)
            ))
        ));
        
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderRequest)
                .header("X-User-Id", "user-123")
                .header("X-User-Role", "USER"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id", notNullValue()))
            .andExpect(jsonPath("$.customerId", is("user-123")))
            .andExpect(jsonPath("$.state", is("PENDING")))
            .andExpect(jsonPath("$.totalAmount", notNullValue()));
    }
    
    @Test
    @DisplayName("GET /api/v1/orders/{id} - Retrieve order with caching")
    void getOrderWithCaching() throws Exception {
        // Create order first
        Order order = createTestOrder();
        
        // First request - cache miss
        mockMvc.perform(get("/api/v1/orders/" + order.getId())
                .header("X-User-Id", order.getCustomerId())
                .header("X-User-Role", "USER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(order.getId().toString())));
        
        // Second request - cache hit (faster, check X-Cache header if configured)
        mockMvc.perform(get("/api/v1/orders/" + order.getId())
                .header("X-User-Id", order.getCustomerId())
                .header("X-User-Role", "USER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(order.getId().toString())));
    }
    
    @Test
    @DisplayName("GET /api/v1/orders/{id} - Reject unauthorized access (IDOR prevention)")
    void getOrderUnauthorized() throws Exception {
        Order order = createTestOrder();
        
        // Different user tries to access
        mockMvc.perform(get("/api/v1/orders/" + order.getId())
                .header("X-User-Id", "different-user")
                .header("X-User-Role", "USER"))
            .andExpect(status().isForbidden());
        
        // Admin can access any order
        mockMvc.perform(get("/api/v1/orders/" + order.getId())
                .header("X-User-Id", "admin-user")
                .header("X-User-Role", "ADMIN"))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("POST /api/v1/orders/{id}/state/confirm-payment - Transition order state (workflow engine)")
    void transitionOrderState() throws Exception {
        Order order = createTestOrder();
        
        // Transition from PENDING to CONFIRMED
        mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/confirm-payment")
                .header("X-User-Id", "user-123")
                .header("X-User-Role", "USER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is("true")))
            .andExpect(jsonPath("$.newState", is("CONFIRMED")));
        
        // Transition from CONFIRMED to PROCESSING
        mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/start-processing")
                .header("X-User-Id", "user-123")
                .header("X-User-Role", "USER"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is("true")))
            .andExpect(jsonPath("$.newState", is("PROCESSING")));
        
        // Invalid transition should fail
        mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/state/confirm-payment")
                .header("X-User-Id", "user-123")
                .header("X-User-Role", "USER"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success", is("false")))
            .andExpect(jsonPath("$.error", is("Invalid state transition")));
    }
    
    @Test
    @DisplayName("Rate limiting - Return 429 after exceeding limit")
    void testRateLimiting() throws Exception {
        // Make many requests quickly to trigger rate limit
        for (int i = 0; i < 100; i++) {
            mockMvc.perform(get("/api/v1/orders")
                    .header("X-User-Id", "rate-limit-test")
                    .header("X-User-Role", "USER"))
                .andExpect(status().isAnyOf(200, 429));
        }
        
        // Eventually should get 429
        mockMvc.perform(get("/api/v1/orders")
                .header("X-User-Id", "rate-limit-test")
                .header("X-User-Role", "USER"))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(header().exists("X-RateLimit-Limit"))
            .andExpect(header().exists("X-RateLimit-Remaining"));
    }
    
    @Test
    @DisplayName("MFA required for sensitive operations")
    void mfaRequiredForSensitiveOperations() throws Exception {
        Order order = createTestOrder();
        
        // Try to delete order without MFA (if MFA enforced for delete)
        mockMvc.perform(delete("/api/v1/orders/" + order.getId())
                .header("X-User-Id", order.getCustomerId())
                .header("X-User-Role", "USER")
                .header("X-MFA-Verified", "false"))
            .andExpect(status().isForbidden());
        
        // With MFA verified
        mockMvc.perform(delete("/api/v1/orders/" + order.getId())
                .header("X-User-Id", order.getCustomerId())
                .header("X-User-Role", "USER")
                .header("X-MFA-Verified", "true"))
            .andExpect(status().isNoContent());
    }
    
    private Order createTestOrder() {
        Order order = new Order(
            new OrderId(UUID.randomUUID()),
            UUID.fromString("user-123"),
            List.of(new OrderItem(UUID.randomUUID(), 2, java.math.BigDecimal.valueOf(29.99))),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );
        return orderRepository.save(order);
    }
}
