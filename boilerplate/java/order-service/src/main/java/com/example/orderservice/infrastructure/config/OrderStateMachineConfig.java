package com.example.orderservice.infrastructure.config;

import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.services.OrderEvent;
import com.example.orderservice.infrastructure.services.OrderStateMachine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineBuilder;

/**
 * Spring Statemachine configuration for order lifecycle.
 *
 * Defines states and transitions mirroring the OrderState enum.
 */
@Configuration
public class OrderStateMachineConfig {

    /**
     * Build and configure the order state machine.
     */
    @Bean
    public StateMachine<OrderState, OrderEvent> orderStateMachine() throws Exception {
        StateMachineBuilder.Builder<OrderState, OrderEvent> builder = StateMachineBuilder.builder();

        builder.configureConfiguration()
            .withConfiguration()
                .autoStartup(true);

        builder.configureStates()
            .withStates()
                .initial(OrderState.PENDING)
                .states(java.util.EnumSet.allOf(OrderState.class));

        builder.configureTransitions()
            .withExternal()
                .source(OrderState.PENDING).target(OrderState.CONFIRMED).event(OrderEvent.CONFIRM)
            .and()
            .withExternal()
                .source(OrderState.PENDING).target(OrderState.CANCELLED).event(OrderEvent.CANCEL)
            .and()
            .withExternal()
                .source(OrderState.CONFIRMED).target(OrderState.PROCESSING).event(OrderEvent.CONFIRM)
            .and()
            .withExternal()
                .source(OrderState.CONFIRMED).target(OrderState.CANCELLED).event(OrderEvent.CANCEL)
            .and()
            .withExternal()
                .source(OrderState.PROCESSING).target(OrderState.SHIPPED).event(OrderEvent.SHIP)
            .and()
            .withExternal()
                .source(OrderState.PROCESSING).target(OrderState.CANCELLED).event(OrderEvent.CANCEL)
            .and()
            .withExternal()
                .source(OrderState.SHIPPED).target(OrderState.DELIVERED).event(OrderEvent.DELIVER)
            .and()
            .withExternal()
                .source(OrderState.DELIVERED).target(OrderState.COMPLETED).event(OrderEvent.COMPLETE)
            .and()
            .withExternal()
                .source(OrderState.DELIVERED).target(OrderState.RETURNED).event(OrderEvent.RETURN)
            .and()
            .withExternal()
                .source(OrderState.RETURNED).target(OrderState.REFUNDED).event(OrderEvent.REFUND);

        return builder.build();
    }

    /**
     * Factory bean for creating OrderStateMachine wrappers.
     */
    @Bean
    public java.util.function.Supplier<OrderStateMachine> orderStateMachineFactory(
            StateMachine<OrderState, OrderEvent> stateMachine) {
        return () -> new OrderStateMachine(stateMachine);
    }
}
