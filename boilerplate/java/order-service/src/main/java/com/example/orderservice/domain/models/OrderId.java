package com.example.orderservice.domain.models;

import java.util.UUID;

public record OrderId(UUID value) {
    public OrderId {
        if (value == null) {
            throw new IllegalArgumentException("OrderId value cannot be null");
        }
    }

    public static OrderId generate() {
        return new OrderId(UUID.randomUUID());
    }
}
