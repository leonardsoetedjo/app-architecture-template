package com.example.orderservice.domain.models;

import java.util.UUID;

public class OrderId {
    private final UUID value;

    public OrderId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("OrderId value cannot be null");
        }
        this.value = value;
    }

    public static OrderId from(UUID value) {
        return new OrderId(value);
    }

    public static OrderId generate() {
        return new OrderId(UUID.randomUUID());
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderId orderId = (OrderId) o;
        return value.equals(orderId.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
