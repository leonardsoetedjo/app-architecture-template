package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;

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
                new OrderItem(UUID.randomUUID(), 2, 19.99),
                new OrderItem(UUID.randomUUID(), 1, 29.99)
            );

            // Act
            Order order = Order.create(customerId, items);

            // Assert
            assertNotNull(order);
            assertNotNull(order.id());
            assertEquals(customerId, order.customerId());
            assertEquals(2, order.items().size());
            assertEquals("PENDING", order.status());
            assertNotNull(order.createdAt());
        }

        @Test
        @DisplayName("should have unique order IDs")
        void shouldHaveUniqueOrderIds() {
            // Arrange
            UUID customerId = UUID.randomUUID();
            List<OrderItem> items = List.of(
                new OrderItem(UUID.randomUUID(), 1, 9.99)
            );

            // Act
            Order order1 = Order.create(customerId, items);
            Order order2 = Order.create(customerId, items);

            // Assert
            assertNotEquals(order1.id(), order2.id());
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
            OrderItem item = new OrderItem(productId, 5, 10.99);

            // Assert
            assertEquals(productId, item.productId());
            assertEquals(5, item.quantity());
            assertEquals(10.99, item.unitPrice(), 0.001);
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
            assertEquals(value, orderId.value());
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
