package com.example.common.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Abstract base class for domain events.
 * All domain events should extend this class.
 * Immutable and thread-safe.
 */
public abstract class DomainEvent {
    private final UUID eventId;
    private final Instant occurredOn;

    protected DomainEvent() {
        this.eventId = UUID.randomUUID();
        this.occurredOn = Instant.now();
    }

    protected DomainEvent(UUID eventId, Instant occurredOn) {
        this.eventId = eventId != null ? eventId : UUID.randomUUID();
        this.occurredOn = occurredOn != null ? occurredOn : Instant.now();
    }

    public UUID getEventId() {
        return eventId;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }

    /**
     * Returns the event type name for routing/serialization.
     * Override in subclasses to provide specific event type.
     */
    public abstract String getEventType();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DomainEvent that = (DomainEvent) o;
        return Objects.equals(eventId, that.eventId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId);
    }
}
