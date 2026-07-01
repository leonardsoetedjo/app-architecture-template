package com.example.orderservice.domain.services;

/**
 * Events that trigger order state transitions.
 *
 * Used by OrderStateMachine for saga orchestration.
 */
public enum OrderEvent {
    CONFIRM,    // PENDING → CONFIRMED, CONFIRMED → PROCESSING
    CANCEL,     // Any non-terminal state → CANCELLED
    SHIP,       // PROCESSING → SHIPPED
    DELIVER,    // SHIPPED → DELIVERED
    COMPLETE,   // DELIVERED → COMPLETED
    RETURN,     // DELIVERED → RETURNED
    REFUND      // RETURNED → REFUNDED
}
