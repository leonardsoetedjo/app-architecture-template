"""
Integration tests for Order State Machine.
"""

import pytest
from uuid import uuid4

from domain.services.order_state_machine import OrderStateMachine, OrderState, OrderEvent


class TestOrderStateMachine:
    """Test order state machine transitions."""
    
    def test_initial_state_is_pending(self):
        """Should start in PENDING state."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Assert
        assert state_machine.state == "PENDING"
        assert state_machine.get_current_state() == OrderState.PENDING
    
    def test_pending_to_confirmed_on_confirm_payment(self):
        """Should transition from PENDING to CONFIRMED on CONFIRM_PAYMENT."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Act
        state_machine.confirm_payment()
        
        # Assert
        assert state_machine.state == "CONFIRMED"
    
    def test_confirmed_to_processing_on_start_processing(self):
        """Should transition from CONFIRMED to PROCESSING on START_PROCESSING."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        
        # Act
        state_machine.start_processing()
        
        # Assert
        assert state_machine.state == "PROCESSING"
    
    def test_processing_to_shipped_on_ship_order(self):
        """Should transition from PROCESSING to SHIPPED on SHIP_ORDER."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        
        # Act
        state_machine.ship_order()
        
        # Assert
        assert state_machine.state == "SHIPPED"
    
    def test_shipped_to_delivered_on_deliver_order(self):
        """Should transition from SHIPPED to DELIVERED on DELIVER_ORDER."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        
        # Act
        state_machine.deliver_order()
        
        # Assert
        assert state_machine.state == "DELIVERED"
    
    def test_delivered_to_completed_on_complete_order(self):
        """Should transition from DELIVERED to COMPLETED on COMPLETE_ORDER."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        state_machine.deliver_order()
        
        # Act
        state_machine.complete_order()
        
        # Assert
        assert state_machine.state == "COMPLETED"
        assert state_machine.is_terminal_state()
    
    def test_cancellation_from_pending(self):
        """Should allow cancellation from PENDING."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Act
        state_machine.cancel()
        
        # Assert
        assert state_machine.state == "CANCELLED"
        assert state_machine.is_terminal_state()
    
    def test_cancellation_from_confirmed(self):
        """Should allow cancellation from CONFIRMED."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        
        # Act
        state_machine.cancel()
        
        # Assert
        assert state_machine.state == "CANCELLED"
    
    def test_cancellation_from_processing(self):
        """Should allow cancellation from PROCESSING."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        
        # Act
        state_machine.cancel()
        
        # Assert
        assert state_machine.state == "CANCELLED"
    
    def test_cancellation_not_allowed_from_shipped(self):
        """Should not allow cancellation from SHIPPED."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        
        # Act & Assert
        with pytest.raises(Exception):  # MachineError
            state_machine.cancel()
        
        assert state_machine.state == "SHIPPED"
    
    def test_return_from_shipped(self):
        """Should transition from SHIPPED to RETURNED on INITIATE_RETURN."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        
        # Act
        state_machine.initiate_return()
        
        # Assert
        assert state_machine.state == "RETURNED"
    
    def test_return_from_delivered(self):
        """Should transition from DELIVERED to RETURNED on INITIATE_RETURN."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        state_machine.deliver_order()
        
        # Act
        state_machine.initiate_return()
        
        # Assert
        assert state_machine.state == "RETURNED"
    
    def test_refund_from_returned(self):
        """Should transition from RETURNED to REFUNDED on PROCESS_REFUND."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        state_machine.initiate_return()
        
        # Act
        state_machine.process_refund()
        
        # Assert
        assert state_machine.state == "REFUNDED"
        assert state_machine.is_terminal_state()
    
    def test_no_transition_from_completed(self):
        """Should not allow transitions from COMPLETED (terminal state)."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        self._complete_order(state_machine)
        
        # Act & Assert
        with pytest.raises(Exception):
            state_machine.initiate_return()
        
        assert state_machine.state == "COMPLETED"
    
    def test_no_transition_from_cancelled(self):
        """Should not allow transitions from CANCELLED (terminal state)."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.cancel()
        
        # Act & Assert
        with pytest.raises(Exception):
            state_machine.confirm_payment()
        
        assert state_machine.state == "CANCELLED"
    
    def test_no_transition_from_refunded(self):
        """Should not allow transitions from REFUNDED (terminal state)."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        self._complete_order(state_machine)
        state_machine.initiate_return()
        state_machine.process_refund()
        
        # Act & Assert
        with pytest.raises(Exception):
            state_machine.complete_order()
        
        assert state_machine.state == "REFUNDED"
    
    def test_transition_history_is_recorded(self):
        """Should record all transitions in history."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Act
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        
        # Assert
        history = state_machine.get_transition_history()
        assert len(history) == 3
        assert history[0]["to_state"] == "CONFIRMED"
        assert history[1]["to_state"] == "PROCESSING"
        assert history[2]["to_state"] == "SHIPPED"
    
    def test_guard_condition_can_confirm_payment(self):
        """Should return True for can_confirm_payment when in PENDING."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Assert
        assert state_machine.can_confirm_payment() is True
    
    def test_guard_condition_cannot_confirm_payment_when_confirmed(self):
        """Should return False for can_confirm_payment when already CONFIRMED."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        state_machine.confirm_payment()
        
        # Assert
        assert state_machine.can_confirm_payment() is False
    
    def test_guard_condition_can_cancel(self):
        """Should return True for can_cancel in valid states."""
        # Arrange
        state_machine = OrderStateMachine("order-123")
        
        # Assert
        assert state_machine.can_cancel() is True  # PENDING
        
        state_machine.confirm_payment()
        assert state_machine.can_cancel() is True  # CONFIRMED
        
        state_machine.start_processing()
        assert state_machine.can_cancel() is True  # PROCESSING
        
        state_machine.ship_order()
        assert state_machine.can_cancel() is False  # SHIPPED
    
    def _complete_order(self, state_machine: OrderStateMachine):
        """Helper to complete order to DELIVERED state."""
        state_machine.confirm_payment()
        state_machine.start_processing()
        state_machine.ship_order()
        state_machine.deliver_order()
