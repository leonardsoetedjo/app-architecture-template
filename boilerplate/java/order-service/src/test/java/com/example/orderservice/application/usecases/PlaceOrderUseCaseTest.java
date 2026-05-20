package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CreateOrderCommand;
import com.example.orderservice.application.dtos.OrderItemDTO;
import com.example.orderservice.application.dtos.OrderResult;
import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.services.OrderPlacementService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

class PlaceOrderUseCaseTest {

    private final List<Order> savedOrders = new ArrayList<>();
    private OrderPlacementService orderPlacementService;
    private PlaceOrderUseCase placeOrderUseCase;

    @BeforeEach
    void setUp() {
        OrderRepository fakeRepo = new OrderRepository() {
            @Override
            public Order save(Order order) {
                savedOrders.add(order);
                return order;
            }

            @Override
            public java.util.Optional<Order> findById(com.example.orderservice.domain.models.OrderId id) {
                return savedOrders.stream()
                    .filter(o -> o.getId().getValue().equals(id.getValue()))
                    .findFirst();
            }

            @Override
            public List<Order> findAll() {
                return new ArrayList<>(savedOrders);
            }

            @Override
            public List<Order> findByCustomerId(UUID customerId) {
                return savedOrders.stream()
                    .filter(o -> o.getCustomerId().equals(customerId))
                    .toList();
            }

            @Override
            public void deleteById(com.example.orderservice.domain.models.OrderId id) {
                savedOrders.removeIf(o -> o.getId().getValue().equals(id.getValue()));
            }

            @Override
            public long count() {
                return savedOrders.size();
            }

            @Override
            public boolean existsById(com.example.orderservice.domain.models.OrderId id) {
                return savedOrders.stream().anyMatch(o -> o.getId().getValue().equals(id.getValue()));
            }
        };
        orderPlacementService = new OrderPlacementService(fakeRepo);
        placeOrderUseCase = new PlaceOrderUseCaseImpl(orderPlacementService);
        savedOrders.clear();
    }

    @Nested
    @DisplayName("Execute method")
    class Execute {

        @Test
        @DisplayName("should execute use case and return order result")
        void shouldExecuteUseCaseAndReturnOrderResult() {
            UUID customerId = UUID.randomUUID();
            UUID productId = UUID.randomUUID();
            
            CreateOrderCommand command = new CreateOrderCommand(
                customerId,
                List.of(new OrderItemDTO(productId, 2, 19.99))
            );

            OrderResult result = placeOrderUseCase.execute(command);

            assertNotNull(result);
            assertNotNull(result.orderId());
            assertEquals("PENDING", result.status());
            assertNotNull(result.createdAt());
            assertEquals(1, savedOrders.size());
        }

        @Test
        @DisplayName("should delegate to OrderPlacementService with correct parameters")
        void shouldDelegateToOrderPlacementService() {
            UUID customerId = UUID.randomUUID();
            UUID productId = UUID.randomUUID();
            
            CreateOrderCommand command = new CreateOrderCommand(
                customerId,
                List.of(
                    new OrderItemDTO(productId, 3, 29.99),
                    new OrderItemDTO(UUID.randomUUID(), 1, 9.99)
                )
            );

            placeOrderUseCase.execute(command);

            assertEquals(1, savedOrders.size());
            Order saved = savedOrders.get(0);
            assertEquals(customerId, saved.getCustomerId());
            assertEquals(2, saved.getItems().size());
        }

        @Test
        @DisplayName("should return correct order result structure")
        void shouldReturnCorrectOrderResultStructure() {
            UUID customerId = UUID.randomUUID();
            
            CreateOrderCommand command = new CreateOrderCommand(
                customerId,
                List.of(new OrderItemDTO(UUID.randomUUID(), 1, 10.00))
            );

            OrderResult result = placeOrderUseCase.execute(command);

            assertNotNull(result.orderId());
            assertEquals("PENDING", result.status());
            assertNotNull(result.createdAt());
        }

        @Test
        @DisplayName("should handle multiple order items")
        void shouldHandleMultipleOrderItems() {
            UUID customerId = UUID.randomUUID();
            UUID productId1 = UUID.randomUUID();
            UUID productId2 = UUID.randomUUID();
            UUID productId3 = UUID.randomUUID();
            
            CreateOrderCommand command = new CreateOrderCommand(
                customerId,
                List.of(
                    new OrderItemDTO(productId1, 2, 10.00),
                    new OrderItemDTO(productId2, 1, 20.00),
                    new OrderItemDTO(productId3, 3, 15.00)
                )
            );

            OrderResult result = placeOrderUseCase.execute(command);

            assertNotNull(result);
            assertEquals(1, savedOrders.size());
            assertEquals(3, savedOrders.get(0).getItems().size());
        }

        @Test
        @DisplayName("should throw IllegalArgumentException when command is null")
        void shouldThrowExceptionWhenCommandIsNull() {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> placeOrderUseCase.execute(null)
            );
            assertTrue(exception.getMessage().contains("command"));
        }
    }
}
