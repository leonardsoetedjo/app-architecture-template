package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.CreateOrderCommand;
import com.example.orderservice.application.dtos.OrderItemDTO;
import com.example.orderservice.application.dtos.OrderResult;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import com.example.orderservice.application.usecases.ListOrdersUseCase;
import com.example.orderservice.application.usecases.GetOrderUseCaseImpl;
import com.example.orderservice.application.usecases.UpdateOrderStatusUseCaseImpl;
import com.example.orderservice.application.usecases.SoftDeleteOrderUseCaseImpl;
import com.example.orderservice.domain.ports.TokenParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.test.context.support.WithMockUser;

@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlaceOrderUseCase placeOrderUseCase;

    @MockBean
    private ListOrdersUseCase listOrdersUseCase;

    @MockBean
    private GetOrderUseCaseImpl getOrderUseCase;

    @MockBean
    private UpdateOrderStatusUseCaseImpl updateOrderStatusUseCase;

    @MockBean
    private SoftDeleteOrderUseCaseImpl softDeleteOrderUseCase;

    @MockBean
    private TokenParser tokenParser;

    private CreateOrderCommand createOrderCommand;

    @BeforeEach
    void setUp() {
        UUID productId = UUID.randomUUID();
        createOrderCommand = new CreateOrderCommand(
            List.of(new OrderItemDTO(productId, 2, java.math.BigDecimal.valueOf(19.99)))
        );
    }

    @Test
    @DisplayName("should create order successfully")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldCreateOrderSuccessfully() throws Exception {
        // Arrange
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "PENDING",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"productId\":\"" + createOrderCommand.items().get(0).productId() + "\","
                    + "\"quantity\":" + createOrderCommand.items().get(0).quantity() + ","
                    + "\"unitPrice\":" + createOrderCommand.items().get(0).unitPrice() + "}]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderId").value(expectedResult.orderId().toString()))
            .andExpect(jsonPath("$.status").value(expectedResult.status()))
            .andExpect(jsonPath("$.createdAt").isNotEmpty());

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
        verifyNoMoreInteractions(placeOrderUseCase);
    }

    @Test
    @DisplayName("should return 201 CREATED when order is created")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldReturnCreatedStatus() throws Exception {
        // Arrange
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "PENDING",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"productId\":\"" + createOrderCommand.items().get(0).productId() + "\","
                    + "\"quantity\":1,\"unitPrice\":9.99}]}"))
            .andExpect(status().isCreated());

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
    }

    @Test
    @DisplayName("should return 200 OK with order result")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldReturnOkWithOrderResult() throws Exception {
        // Arrange
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "CONFIRMED",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"productId\":\"" + createOrderCommand.items().get(0).productId() + "\","
                    + "\"quantity\":1,\"unitPrice\":9.99}]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderId").isNotEmpty())
            .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
    }

    @Test
    @DisplayName("should handle validation error for invalid request")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldHandleValidationError() throws Exception {
        // Act & Assert - Invalid JSON should result in 400
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"invalid\": \"json\"}"))
            .andExpect(status().is4xxClientError());

        verifyNoInteractions(placeOrderUseCase);
    }

    @Test
    @DisplayName("should handle missing request body")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldHandleMissingRequestBody() throws Exception {
        // Act & Assert - Empty body should result in 400 or 422
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().is4xxClientError());

        verifyNoInteractions(placeOrderUseCase);
    }

    @Test
    @DisplayName("should handle invalid JSON content type")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldHandleInvalidContentType() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.TEXT_PLAIN)
                .content("plain text"))
            .andExpect(status().is4xxClientError());

        verifyNoInteractions(placeOrderUseCase);
    }

    @Test
    @DisplayName("should handle multiple order items")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldHandleMultipleOrderItems() throws Exception {
        // Arrange
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "PENDING",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":["
                    + "{\"productId\":\"" + createOrderCommand.items().get(0).productId() + "\","
                    + "\"quantity\":1,\"unitPrice\":9.99},"
                    + "{\"productId\":\"" + UUID.randomUUID() + "\","
                    + "\"quantity\":2,\"unitPrice\":19.99}"
                    + "]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderId").isNotEmpty());

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
    }

    @Test
    @DisplayName("should pass command to use case with correct parameters")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldPassCommandToUseCase() throws Exception {
        // Arrange
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "PENDING",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        String requestJson = "{\"items\":[{\"productId\":\"" + productId + "\","
            + "\"quantity\":3,\"unitPrice\":29.99}]}";
        
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
            .andExpect(status().isCreated());

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
    }

    @Test
    @DisplayName("should return correct order status in response")
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldReturnCorrectOrderStatus() throws Exception {
        // Arrange
        OrderResult expectedResult = new OrderResult(
            UUID.randomUUID(),
            "PENDING",
            java.time.OffsetDateTime.now()
        );

        when(placeOrderUseCase.execute(any(UUID.class), any(CreateOrderCommand.class)))
            .thenReturn(expectedResult);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[{\"productId\":\"" + createOrderCommand.items().get(0).productId() + "\","
                    + "\"quantity\":1,\"unitPrice\":9.99}]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"));

        verify(placeOrderUseCase, times(1)).execute(any(UUID.class), any(CreateOrderCommand.class));
    }
}
