package com.example.orderservice.domain.models;

import java.util.*;
import java.time.*;

public record OrderId(UUID value) {
    public static OrderId generate() {
        return new OrderId(UUID.randomUUID());
    }
}

public record OrderItem(UUID productId, int quantity, double unitPrice) {}

public record Order(
    OrderId id,
    UUID customerId,
    List<OrderItem> items,
    OffsetDateTime createdAt,
    String status
) {
    public Order {
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }
    }

    public static Order create(UUID customerId, List<OrderItem> items) {
        return new Order(
            OrderId.generate(),
            customerId,
            items,
            OffsetDateTime.now(ZoneOffset.UTC),
            "PENDING"
        );
    }
}

public class InvalidOrderException extends RuntimeException {
    public InvalidOrderException(String message) {
        super(message);
    }
}

public class DomainException extends RuntimeException {
    public DomainException(String message) {
        super(message);
    }
}
