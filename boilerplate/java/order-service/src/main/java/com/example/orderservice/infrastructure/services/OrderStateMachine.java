package com.example.orderservice.infrastructure.services;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.services.OrderEvent;
import org.springframework.statemachine.StateMachine;

/**
 * Order state machine wrapper for saga orchestration.
 *
 * Provides a simplified interface for OrderCreationSaga to trigger
 * state transitions without direct Spring Statemachine dependency.
 *
 * Located in infrastructure to keep domain layer free of Spring dependencies.
 */
public class OrderStateMachine {

    private final StateMachine<OrderState, OrderEvent> stateMachine;

    public OrderStateMachine(StateMachine<OrderState, OrderEvent> stateMachine) {
        this.stateMachine = stateMachine;
    }

    /**
     * Load order into state machine context.
     */
    public void load(Order order) {
        stateMachine.getExtendedState().getVariables().put("order", order);
    }

    /**
     * Transition to CONFIRMED state.
     */
    public void transitionToConfirmed() {
        stateMachine.sendEvent(OrderEvent.CONFIRM);
    }

    /**
     * Transition to CANCELLED state.
     */
    public void transitionToCancelled() {
        stateMachine.sendEvent(OrderEvent.CANCEL);
    }

    /**
     * Get current state.
     */
    public OrderState getCurrentState() {
        return stateMachine.getState().getId();
    }

    /**
     * Get underlying state machine for advanced operations.
     */
    public StateMachine<OrderState, OrderEvent> getStateMachine() {
        return stateMachine;
    }
}
