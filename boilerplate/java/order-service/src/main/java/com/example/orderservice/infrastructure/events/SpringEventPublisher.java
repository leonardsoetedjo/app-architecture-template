package com.example.orderservice.infrastructure.events;

import com.example.orderservice.domain.events.DomainEvent;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.EventPublishException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Infrastructure adapter for publishing domain events.
 * 
 * Currently implements a simple in-memory event bus.
 * In production, replace with Kafka, RabbitMQ, or other message broker.
 */
@Component
public class SpringEventPublisher implements EventPublisher {
    
    private static final Logger log = LoggerFactory.getLogger(SpringEventPublisher.class);
    
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    
    public SpringEventPublisher(org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }
    
    @Override
    public void publish(DomainEvent event) {
        try {
            log.debug("Publishing domain event: {} [id={}, aggregateId={}]", 
                event.getEventType(), event.getId(), event.getAggregateId());
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            throw new EventPublishException(
                "Failed to publish event: " + event.getEventType(), e);
        }
    }
    
    @Override
    public void publishAll(Iterable<? extends DomainEvent> events) {
        for (DomainEvent event : events) {
            publish(event);
        }
    }
}
