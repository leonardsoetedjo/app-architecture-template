package com.example.orderservice.domain.ports;

/**
 * Exception thrown when event publishing fails.
 */
public class EventPublishException extends RuntimeException {
    
    public EventPublishException(String message) {
        super(message);
    }
    
    public EventPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}
