package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrderTest {

    @Nested
    @DisplayName("Order record creation")
    class Creation {

        @Test
        @DisplayName("should create order with valid items")
        void shouldCreateOrderWithValidItems() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            List<OrderItem> items = List.of(
                new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(19.99)),
                new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(29.99))
            );

            // Act
            Order order = Order.create(customerId, items);

            // Assert
            assertNotNull(order);
            assertNotNull(order.getId());
            assertEquals(customerId, order.getCustomerId());
            assertEquals(2, order.getItems().size());
            assertEquals("PENDING", order.getStatus());
            assertNotNull(order.getCreatedAt());
        }

        @Test
        @DisplayName("should have unique order IDs")
        void shouldHaveUniqueOrderIds() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            List<OrderItem> items = List.of(
                new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(9.99))
            );

            // Act
            Order order1 = Order.create(customerId, items);
            Order order2 = Order.create(customerId, items);

            // Assert
            assertNotEquals(order1.getId(), order2.getId());
        }
    }

    @Nested
    @DisplayName("Order validation")
    class Validation {

        @Test
        @DisplayName("should throw exception for null items")
        void shouldThrowExceptionForNullItems() {
            // Arrange
            UUID customerId = UUID.randomUUID();

            // Act & Assert
            InvalidOrderException exception = assertThrows(
                InvalidOrderException.class,
                () -> Order.create(customerId, null)
            );
            assertEquals("Order must have at least one item", exception.getMessage());
        }

        @Test
        @DisplayName("should throw exception for empty items")
        void shouldThrowExceptionForEmptyItems() {
            // Arrange
            UUID customerId = UUID.randomUUID();

            // Act & Assert
            InvalidOrderException exception = assertThrows(
                InvalidOrderException.class,
                () -> Order.create(customerId, List.of())
            );
            assertEquals("Order must have at least one item", exception.getMessage());
        }

        @Test
        @DisplayName("should throw exception for null item list due to record constructor validation")
        void shouldThrowExceptionForNullItemList() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            List<OrderItem> items = null;

            // Act & Assert
            assertThrows(InvalidOrderException.class, () -> Order.create(customerId, items));
        }
    }

    @Nested
    @DisplayName("OrderItem record")
    class OrderItemTests {

        @Test
        @DisplayName("should create order item with valid data")
        void shouldCreateOrderItem() {
            // Arrange
            UUID productId = UUID.randomUUID();

            // Act
            OrderItem item = new OrderItem(productId, 5, BigDecimal.valueOf(10.99));

            // Assert
            assertEquals(productId, item.getProductId());
            assertEquals(5, item.getQuantity());
            assertEquals(BigDecimal.valueOf(10.99), item.getUnitPrice());
        }
    }

    @Nested
    @DisplayName("OrderId record")
    class OrderIdTests {

        @Test
        @DisplayName("should generate unique order IDs")
        void shouldGenerateUniqueId() {
            // Act
            OrderId id1 = OrderId.generate();
            OrderId id2 = OrderId.generate();

            // Assert
            assertNotNull(id1);
            assertNotNull(id2);
            assertNotEquals(id1, id2);
        }

        @Test
        @DisplayName("should create OrderId from UUID value")
        void shouldCreateOrderIdFromValue() {
            // Arrange
            UUID value = UUID.randomUUID();

            // Act
            OrderId orderId = new OrderId(value);

            // Assert
            assertEquals(value, orderId.getValue());
        }
    }

    @Nested
    @DisplayName("Exception classes")
    class ExceptionTests {

        @Test
        @DisplayName("should create InvalidOrderException with message")
        void shouldCreateInvalidOrderException() {
            // Act
            InvalidOrderException exception = new InvalidOrderException("Test message");

            // Assert
            assertEquals("Test message", exception.getMessage());
        }

        @Test
        @DisplayName("should create DomainException with message")
        void shouldCreateDomainException() {
            // Act
            DomainException exception = new DomainException("Test domain error");

            // Assert
            assertEquals("Test domain error", exception.getMessage());
        }
    }
}
