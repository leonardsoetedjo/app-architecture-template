package com.example.orderservice.domain.models;

/**
 * Order state machine events.
 * 
 * These events trigger state transitions.
 */
public enum OrderEvent {
    /** Confirm payment received */
    CONFIRM_PAYMENT,
    
    /** Cancel order */
    CANCEL_ORDER,
    
    /** Start processing (pick/pack) */
    START_PROCESSING,
    
    /** Ship order to customer */
    SHIP_ORDER,
    
    /** Confirm delivery */
    DELIVER_ORDER,
    
    /** Mark order as completed */
    COMPLETE_ORDER,
    
    /** Initiate return process */
    INITIATE_RETURN,
    
    /** Process refund for returned order */
    PROCESS_REFUND
}
