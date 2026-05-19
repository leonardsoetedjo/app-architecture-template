package com.example.orderservice.domain.models;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record Order(
    OrderId id,
    UUID customerId,
    List<OrderItem> items,
    OffsetDateTime createdAt,
    String status
) {
    public static Order create(UUID customerId, List<OrderItem> items) {
        return new Order(
            new OrderId(UUID.randomUUID()),
            customerId,
            items,
            OffsetDateTime.now(),
            "PENDING"
        );
    }

    public Order {
        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID cannot be null");
        }
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }
    }
}
