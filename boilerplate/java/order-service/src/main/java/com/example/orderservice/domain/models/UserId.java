package com.example.orderservice.domain.models;

import java.util.UUID;

public class UserId {
    private final UUID value;

    public UserId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("UserId value cannot be null");
        }
        this.value = value;
    }

    public static UserId from(UUID value) {
        return new UserId(value);
    }

    public static UserId generate() {
        return new UserId(UUID.randomUUID());
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserId userId = (UserId) o;
        return value.equals(userId.value);
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
