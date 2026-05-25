package com.example.orderservice.domain.models;

/**
 * Order lifecycle states.
 * 
 * State transitions:
 * PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
 *    ↓         ↓           ↓           ↓          ↓
 * CANCELLED  CANCELLED  CANCELLED   RETURNED  RETURNED
 *                                      ↓
 *                                   REFUNDED
 * 
 * Terminal states: COMPLETED, CANCELLED, REFUNDED
 */
public enum OrderState {
    /** Initial state - order created, awaiting payment */
    PENDING,
    
    /** Payment confirmed, order validated */
    CONFIRMED,
    
    /** Being prepared/picked in warehouse */
    PROCESSING,
    
    /** Shipped to customer */
    SHIPPED,
    
    /** Delivered to customer */
    DELIVERED,
    
    /** Order completed successfully (return window expired) */
    COMPLETED,
    
    /** Order cancelled (terminal state) */
    CANCELLED,
    
    /** Item returned by customer */
    RETURNED,
    
    /** Refund processed (terminal state) */
    REFUNDED
}
