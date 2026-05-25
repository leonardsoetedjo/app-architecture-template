package com.example.orderservice.infrastructure.config;

import com.example.orderservice.domain.models.OrderEvent;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.order_id.OrderId;
import com.example.orderservice.application.services.OrderStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineFactory;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Order State Machine.
 */
@SpringBootTest
class OrderStateMachineIntegrationTest {
    
    @Autowired
    private StateMachineFactory<OrderState, OrderEvent> stateMachineFactory;
    
    @Autowired
    private OrderStateService orderStateService;
    
    private StateMachine<OrderState, OrderEvent> stateMachine;
    private OrderId orderId;
    
    @BeforeEach
    void setUp() {
        orderId = OrderId.from(UUID.randomUUID());
        stateMachine = stateMachineFactory.getStateMachine("test-" + orderId.getValue());
        stateMachine.start();
    }
    
    @Test
    @DisplayName("Should start in PENDING state")
    void shouldStartInPendingState() {
        // Assert
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.PENDING);
    }
    
    @Test
    @DisplayName("Should transition from PENDING to CONFIRMED on CONFIRM_PAYMENT")
    void shouldTransitionFromPendingToConfirmed() {
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.CONFIRMED);
    }
    
    @Test
    @DisplayName("Should transition from CONFIRMED to PROCESSING on START_PROCESSING")
    void shouldTransitionFromConfirmedToProcessing() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.PROCESSING);
    }
    
    @Test
    @DisplayName("Should transition from PROCESSING to SHIPPED on SHIP_ORDER")
    void shouldTransitionFromProcessingToShipped() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.SHIPPED);
    }
    
    @Test
    @DisplayName("Should transition from SHIPPED to DELIVERED on DELIVER_ORDER")
    void shouldTransitionFromShippedToDelivered() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.DELIVER_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.DELIVERED);
    }
    
    @Test
    @DisplayName("Should transition from DELIVERED to COMPLETED on COMPLETE_ORDER")
    void shouldTransitionFromDeliveredToCompleted() {
        // Arrange
        completeOrderToDelivered();
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.COMPLETE_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.COMPLETED);
    }
    
    @Test
    @DisplayName("Should not allow transition from COMPLETED (terminal state)")
    void shouldNotAllowTransitionFromCompleted() {
        // Arrange
        completeOrderToDelivered();
        stateMachine.sendEvent(OrderEvent.COMPLETE_ORDER);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.INITIATE_RETURN);
        
        // Assert
        assertThat(accepted).isFalse();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.COMPLETED);
    }
    
    @Test
    @DisplayName("Should allow cancellation from PENDING")
    void shouldAllowCancellationFromPending() {
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CANCEL_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.CANCELLED);
    }
    
    @Test
    @DisplayName("Should allow cancellation from CONFIRMED")
    void shouldAllowCancellationFromConfirmed() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CANCEL_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.CANCELLED);
    }
    
    @Test
    @DisplayName("Should allow cancellation from PROCESSING")
    void shouldAllowCancellationFromProcessing() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CANCEL_ORDER);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.CANCELLED);
    }
    
    @Test
    @DisplayName("Should not allow cancellation from SHIPPED")
    void shouldNotAllowCancellationFromShipped() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CANCEL_ORDER);
        
        // Assert
        assertThat(accepted).isFalse();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.SHIPPED);
    }
    
    @Test
    @DisplayName("Should transition from SHIPPED to RETURNED on INITIATE_RETURN")
    void shouldTransitionFromShippedToReturned() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.INITIATE_RETURN);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.RETURNED);
    }
    
    @Test
    @DisplayName("Should transition from RETURNED to REFUNDED on PROCESS_REFUND")
    void shouldTransitionFromReturnedToRefunded() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        stateMachine.sendEvent(OrderEvent.INITIATE_RETURN);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.PROCESS_REFUND);
        
        // Assert
        assertThat(accepted).isTrue();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.REFUNDED);
    }
    
    @Test
    @DisplayName("Should not allow transition from CANCELLED (terminal state)")
    void shouldNotAllowTransitionFromCancelled() {
        // Arrange
        stateMachine.sendEvent(OrderEvent.CANCEL_ORDER);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        
        // Assert
        assertThat(accepted).isFalse();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.CANCELLED);
    }
    
    @Test
    @DisplayName("Should not allow transition from REFUNDED (terminal state)")
    void shouldNotAllowTransitionFromRefunded() {
        // Arrange
        completeOrderToDelivered();
        stateMachine.sendEvent(OrderEvent.INITIATE_RETURN);
        stateMachine.sendEvent(OrderEvent.PROCESS_REFUND);
        
        // Act
        boolean accepted = stateMachine.sendEvent(OrderEvent.COMPLETE_ORDER);
        
        // Assert
        assertThat(accepted).isFalse();
        assertThat(stateMachine.getState().getId()).isEqualTo(OrderState.REFUNDED);
    }
    
    private void completeOrderToDelivered() {
        stateMachine.sendEvent(OrderEvent.CONFIRM_PAYMENT);
        stateMachine.sendEvent(OrderEvent.START_PROCESSING);
        stateMachine.sendEvent(OrderEvent.SHIP_ORDER);
        stateMachine.sendEvent(OrderEvent.DELIVER_ORDER);
    }
}
