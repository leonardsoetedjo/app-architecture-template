package com.example.orderservice.domain.models;

/**
 * Order lifecycle states with validated transitions.
 *
 * State transitions:
 * PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
 *    ↓         ↓           ↓           ↓          ↓
 * CANCELLED  CANCELLED  CANCELLED   RETURNED  RETURNED
 *                                      ↓
 *                                   REFUNDED
 *
 * Terminal states: COMPLETED, CANCELLED, REFUNDED
 * Only PENDING, CONFIRMED, PROCESSING, SHIPPED can be cancelled.
 */
public enum OrderState {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    RETURNED,
    REFUNDED;

    /**
     * Checks if a transition from this state to the target is valid.
     */
    public boolean canTransitionTo(OrderState target) {
        return switch (this) {
            case PENDING -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == PROCESSING || target == CANCELLED;
            case PROCESSING -> target == SHIPPED || target == CANCELLED;
            case SHIPPED -> target == DELIVERED;
            case DELIVERED -> target == COMPLETED || target == RETURNED;
            case RETURNED -> target == REFUNDED;
            default -> false;
        };
    }

    /**
     * Whether this state can be cancelled.
     */
    public boolean canBeCancelled() {
        return this == PENDING || this == CONFIRMED || this == PROCESSING || this == SHIPPED;
    }
}
