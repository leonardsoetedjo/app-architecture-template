package com.example.orderservice.infrastructure.config;

import com.example.orderservice.domain.models.OrderEvent;
import com.example.orderservice.domain.models.OrderState;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.StateMachineConfigurerAdapter;
import org.springframework.statemachine.state.StateMachineStateChangeListener;
import org.springframework.statemachine.state.States;
import org.springframework.statemachine.transition.Transition;

/**
 * State machine configuration for Order lifecycle.
 * 
 * Defines:
 * - States: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED, RETURNED, REFUNDED
 * - Events: CONFIRM_PAYMENT, CANCEL_ORDER, START_PROCESSING, SHIP_ORDER, etc.
 * - Transitions: Valid state changes triggered by events
 */
@Configuration
@EnableStateMachineFactory
public class OrderStateMachineConfig 
        extends StateMachineConfigurerAdapter<OrderState, OrderEvent> {
    
    @Override
    public void configure(StateMachineStateConfigurer<OrderState, OrderEvent> states) throws Exception {
        states
            .withStates()
                .initial(OrderState.PENDING)
                .states(EnumSet.allOf(OrderState.class))
                .terminal(OrderState.COMPLETED)
                .terminal(OrderState.CANCELLED)
                .terminal(OrderState.REFUNDED);
    }
    
    @Override
    public void configure(StateMachineTransitionConfigurer<OrderState, OrderEvent> transitions) throws Exception {
        transitions
            // PENDING → CONFIRMED or CANCELLED
            .withExternal()
                .source(OrderState.PENDING).target(OrderState.CONFIRMED)
                .event(OrderEvent.CONFIRM_PAYMENT)
            .and()
            .withExternal()
                .source(OrderState.PENDING).target(OrderState.CANCELLED)
                .event(OrderEvent.CANCEL_ORDER)
            
            // CONFIRMED → PROCESSING or CANCELLED
            .withExternal()
                .source(OrderState.CONFIRMED).target(OrderState.PROCESSING)
                .event(OrderEvent.START_PROCESSING)
            .and()
            .withExternal()
                .source(OrderState.CONFIRMED).target(OrderState.CANCELLED)
                .event(OrderEvent.CANCEL_ORDER)
            
            // PROCESSING → SHIPPED or CANCELLED
            .withExternal()
                .source(OrderState.PROCESSING).target(OrderState.SHIPPED)
                .event(OrderEvent.SHIP_ORDER)
            .and()
            .withExternal()
                .source(OrderState.PROCESSING).target(OrderState.CANCELLED)
                .event(OrderEvent.CANCEL_ORDER)
            
            // SHIPPED → DELIVERED or RETURNED
            .withExternal()
                .source(OrderState.SHIPPED).target(OrderState.DELIVERED)
                .event(OrderEvent.DELIVER_ORDER)
            .and()
            .withExternal()
                .source(OrderState.SHIPPED).target(OrderState.RETURNED)
                .event(OrderEvent.INITIATE_RETURN)
            
            // DELIVERED → COMPLETED or RETURNED
            .withExternal()
                .source(OrderState.DELIVERED).target(OrderState.COMPLETED)
                .event(OrderEvent.COMPLETE_ORDER)
            .and()
            .withExternal()
                .source(OrderState.DELIVERED).target(OrderState.RETURNED)
                .event(OrderEvent.INITIATE_RETURN)
            
            // RETURNED → REFUNDED
            .withExternal()
                .source(OrderState.RETURNED).target(OrderState.REFUNDED)
                .event(OrderEvent.PROCESS_REFUND);
    }
    
    /**
     * Listener for state changes - logs all transitions.
     */
    @org.springframework.context.annotation.Bean
    public StateMachineStateChangeListener<OrderState, OrderEvent> stateChangeListener() {
        return new StateMachineStateChangeListener<>() {
            @Override
            public void onStateChanged(
                org.springframework.statemachine.state.State<OrderState, OrderEvent> state,
                Transition<OrderState, OrderEvent> transition
            ) {
                OrderState from = transition.getSource().getId();
                OrderState to = transition.getTarget().getId();
                OrderEvent event = transition.getEvent();
                
                // Log state change (integrate with audit logging)
                System.out.println("Order state changed: " + from + " → " + to + 
                                   " (Event: " + event + ")");
            }
        };
    }
}
