package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({JpaOrderRepository.class})
@ActiveProfiles("test")
class JpaOrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderJpaRepository orderJpaRepository;

    private Order testOrder;
    private UUID customerId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        productId = UUID.randomUUID();
        
        testOrder = new Order(
            OrderId.generate(),
            customerId,
            List.of(
                new OrderItem(productId, 2, 19.99),
                new OrderItem(UUID.randomUUID(), 1, 29.99)
            ),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );
    }

    @Test
    @DisplayName("should save order and return saved order with ID")
    void shouldSaveOrderAndReturnSavedOrderWithId() {
        // Arrange
        assertNotNull(testOrder.id(), "Order ID should be generated before save");
        
        // Act
        Order savedOrder = orderRepository.save(testOrder);

        // Assert
        assertNotNull(savedOrder);
        assertNotNull(savedOrder.id());
        assertEquals(testOrder.id().value(), savedOrder.id().value());
        assertEquals(customerId, savedOrder.customerId());
        assertEquals("PENDING", savedOrder.status());
        assertNotNull(savedOrder.createdAt());
        assertEquals(2, savedOrder.items().size());
    }

    @Test
    @DisplayName("should save order and persist to database")
    void shouldSaveOrderAndPersistToDatabase() {
        // Arrange
        Order savedOrder = orderRepository.save(testOrder);

        // Act
        Optional<OrderEntity> foundEntity = orderJpaRepository.findById(savedOrder.id().value());

        // Assert
        assertTrue(foundEntity.isPresent());
        assertEquals(savedOrder.id().value(), foundEntity.get().getId());
        assertEquals(customerId, foundEntity.get().getCustomerId());
        assertEquals("PENDING", foundEntity.get().getStatus());
        assertEquals(2, foundEntity.get().getItems().size());
    }

    @Test
    @DisplayName("should save multiple orders with unique IDs")
    void shouldSaveMultipleOrdersWithUniqueIds() {
        // Arrange
        Order order1 = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(new OrderItem(UUID.randomUUID(), 1, 9.99)),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        Order order2 = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(new OrderItem(UUID.randomUUID(), 2, 19.99)),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        // Act
        Order savedOrder1 = orderRepository.save(order1);
        Order savedOrder2 = orderRepository.save(order2);

        // Assert
        assertNotNull(savedOrder1.id());
        assertNotNull(savedOrder2.id());
        assertNotEquals(savedOrder1.id(), savedOrder2.id());
    }

    @Test
    @DisplayName("should find order by ID when order exists")
    void shouldFindOrderByIdWhenOrderExists() {
        // Arrange
        Order savedOrder = orderRepository.save(testOrder);

        // Act
        Optional<Order> foundOrder = orderRepository.findById(savedOrder.id());

        // Assert
        assertTrue(foundOrder.isPresent());
        assertEquals(savedOrder.id().value(), foundOrder.get().id().value());
        assertEquals(customerId, foundOrder.get().customerId());
        assertEquals("PENDING", foundOrder.get().status());
        assertEquals(2, foundOrder.get().items().size());
    }

    @Test
    @DisplayName("should return empty Optional when order does not exist")
    void shouldReturnEmptyOptionalWhenOrderDoesNotExist() {
        // Arrange
        OrderId nonExistentId = OrderId.generate();

        // Act
        Optional<Order> foundOrder = orderRepository.findById(nonExistentId);

        // Assert
        assertFalse(foundOrder.isPresent());
    }

    @Test
    @DisplayName("should save order with single item")
    void shouldSaveOrderWithSingleItem() {
        // Arrange
        Order order = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(new OrderItem(UUID.randomUUID(), 1, 9.99)),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        // Act
        Order savedOrder = orderRepository.save(order);

        // Assert
        assertNotNull(savedOrder);
        assertEquals(1, savedOrder.items().size());
        assertEquals(1, savedOrder.items().get(0).quantity());
        assertEquals(9.99, savedOrder.items().get(0).unitPrice(), 0.001);
    }

    @Test
    @DisplayName("should save order with multiple items and preserve all data")
    void shouldSaveOrderWithMultipleItemsAndPreserveAllData() {
        // Arrange
        UUID item1Id = UUID.randomUUID();
        UUID item2Id = UUID.randomUUID();
        UUID item3Id = UUID.randomUUID();
        
        Order order = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(
                new OrderItem(item1Id, 1, 10.00),
                new OrderItem(item2Id, 2, 20.00),
                new OrderItem(item3Id, 3, 30.00)
            ),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        // Act
        Order savedOrder = orderRepository.save(order);

        // Assert
        assertEquals(3, savedOrder.items().size());
        
        // Verify items
        assertTrue(savedOrder.items().stream()
            .anyMatch(item -> item.productId().equals(item1Id) && item.quantity() == 1 && item.unitPrice() == 10.00));
        assertTrue(savedOrder.items().stream()
            .anyMatch(item -> item.productId().equals(item2Id) && item.quantity() == 2 && item.unitPrice() == 20.00));
        assertTrue(savedOrder.items().stream()
            .anyMatch(item -> item.productId().equals(item3Id) && item.quantity() == 3 && item.unitPrice() == 30.00));
    }

    @Test
    @DisplayName("should preserve order status after save")
    void shouldPreserveOrderStatusAfterSave() {
        // Arrange
        Order order = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(new OrderItem(UUID.randomUUID(), 1, 9.99)),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        // Act
        Order savedOrder = orderRepository.save(order);

        // Assert
        assertEquals("PENDING", savedOrder.status());
    }

    @Test
    @DisplayName("should preserve order items with correct data types")
    void shouldPreserveOrderItemsWithCorrectDataTypes() {
        // Arrange
        Order order = new Order(
            OrderId.generate(),
            UUID.randomUUID(),
            List.of(new OrderItem(UUID.randomUUID(), 5, 49.99)),
            java.time.OffsetDateTime.now(),
            "PENDING"
        );

        // Act
        Order savedOrder = orderRepository.save(order);

        // Assert
        assertEquals(5, savedOrder.items().get(0).quantity());
        assertEquals(49.99, savedOrder.items().get(0).unitPrice(), 0.001);
    }

    @Test
    @DisplayName("should delete order when repository delete is called")
    void shouldDeleteOrder() {
        // Arrange
        Order savedOrder = orderRepository.save(testOrder);
        UUID orderId = savedOrder.id().value();

        // Act
        assertTrue(orderJpaRepository.existsById(orderId));
        orderJpaRepository.deleteById(orderId);
        assertFalse(orderJpaRepository.existsById(orderId));
    }
}
