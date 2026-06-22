package com.example.orderservice.domain.events;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Base class for all domain events.
 * 
 * Domain events represent something significant that happened in the domain.
 * They are immutable, named in past tense, and include metadata.
 * 
 * @see com.example.orderservice.domain.ports.EventPublisher
 */
public abstract class DomainEvent {
    
    private final UUID id;
    private final OffsetDateTime occurredOn;
    private final String eventType;
    
    protected DomainEvent(String eventType) {
        this.id = UUID.randomUUID();
        this.occurredOn = OffsetDateTime.now(ZoneOffset.UTC);
        this.eventType = eventType;
    }
    
    /**
     * Unique identifier for this event instance.
     */
    public UUID getId() {
        return id;
    }
    
    /**
     * Timestamp when the event occurred.
     */
    public OffsetDateTime getOccurredOn() {
        return occurredOn;
    }
    
    /**
     * Type of the event (typically the class name).
     */
    public String getEventType() {
        return eventType;
    }
    
    /**
     * Get the aggregate ID that this event relates to.
     * Used for event sourcing and correlation.
     */
    public abstract UUID getAggregateId();
}