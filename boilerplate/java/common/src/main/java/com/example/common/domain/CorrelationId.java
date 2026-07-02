package com.example.common.domain;

import java.util.Objects;
import java.util.UUID;

/**
 * Value object representing a correlation ID.
 * Used for tracing requests across service boundaries.
 * Immutable and thread-safe.
 */
public final class CorrelationId {
    private final String value;

    public CorrelationId(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Correlation ID must not be null or empty");
        }
        this.value = value.trim();
    }

    public CorrelationId() {
        this(UUID.randomUUID().toString());
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CorrelationId that = (CorrelationId) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value;
    }

    public static CorrelationId generate() {
        return new CorrelationId();
    }
}
