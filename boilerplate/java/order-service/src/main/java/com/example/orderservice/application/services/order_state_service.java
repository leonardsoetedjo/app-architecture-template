package com.example.orderservice.application.services;

import com.example.orderservice.domain.models.OrderEvent;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.order_id.OrderId;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.persist.StateMachineRuntimePersister;
import org.springframework.stereotype.Service;
import org.springframework.messaging.support.MessageBuilder;

/**
 * Service for managing order state machine.
 * 
 * Provides methods to:
 * - Get current state
 * - Trigger state transitions
 * - Persist state changes
 */
@Service
public class OrderStateService {
    
    private final StateMachine<OrderState, OrderEvent> stateMachine;
    private final StateMachineRuntimePersister<OrderState, OrderEvent, String> stateMachinePersister;
    
    public OrderStateService(
        StateMachine<OrderState, OrderEvent> stateMachine,
        StateMachineRuntimePersister<OrderState, OrderEvent, String> stateMachinePersister
    ) {
        this.stateMachine = stateMachine;
        this.stateMachinePersister = stateMachinePersister;
    }
    
    /**
     * Get current state of order.
     * 
     * @param orderId Order ID
     * @return Current state
     */
    public OrderState getCurrentState(OrderId orderId) {
        // Initialize state machine for this order
        initStateMachine(orderId);
        return stateMachine.getState().getId();
    }
    
    /**
     * Trigger state transition.
     * 
     * @param orderId Order ID
     * @param event Event to trigger
     * @return true if transition successful
     */
    public boolean triggerEvent(OrderId orderId, OrderEvent event) {
        initStateMachine(orderId);
        
        var message = MessageBuilder
            .withPayload(event)
            .setHeader("order_id", orderId.getValue())
            .build();
        
        boolean accepted = stateMachine.sendEvent(message);
        
        if (accepted) {
            // Persist new state
            stateMachinePersister.persist(stateMachine, orderId.getValue());
        }
        
        return accepted;
    }
    
    /**
     * Check if transition is allowed.
     * 
     * @param orderId Order ID
     * @param event Event to check
     * @return true if transition allowed
     */
    public boolean canTransition(OrderId orderId, OrderEvent event) {
        initStateMachine(orderId);
        return stateMachine.getTransitioner().canTrigger(event, null);
    }
    
    /**
     * Initialize state machine for order.
     */
    private void initStateMachine(OrderId orderId) {
        if (!stateMachine.getId().equals(orderId.getValue())) {
            // Restore state from persistence or start new
            try {
                stateMachinePersister.restore(stateMachine, orderId.getValue());
            } catch (Exception e) {
                // No persisted state - start fresh
                stateMachine.start();
            }
        }
    }
}
