package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.events.DomainEvent;

/**
 * Port for publishing domain events.
 * 
 * Defined in domain layer to maintain dependency rule.
 * Infrastructure provides concrete implementations.
 * 
 * @see DomainEvent
 */
public interface EventPublisher {
    
    /**
     * Publish a domain event to all subscribed listeners.
     * 
     * @param event the domain event to publish
     * @throws EventPublishException if publishing fails
     */
    void publish(DomainEvent event);
    
    /**
     * Publish multiple domain events atomically.
     * 
     * @param events the domain events to publish
     * @throws EventPublishException if publishing fails
     */
    void publishAll(Iterable<? extends DomainEvent> events);
}
