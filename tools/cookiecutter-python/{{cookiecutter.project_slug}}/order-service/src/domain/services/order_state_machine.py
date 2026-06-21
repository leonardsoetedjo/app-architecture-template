"""
Order State Machine using transitions library.

Implements the Order lifecycle state machine with:
- 9 states (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED, RETURNED, REFUNDED)
- 9 events that trigger transitions
- Guard conditions for validation
- Callbacks for actions on transitions
"""

from enum import Enum
from typing import Optional, Callable, List, Dict, Any
from datetime import datetime
from dataclasses import dataclass, field
from transitions import Machine, MachineError


class OrderState(Enum):
    """Order lifecycle states."""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"
    REFUNDED = "REFUNDED"


class OrderEvent(Enum):
    """Order state machine events."""
    CONFIRM_PAYMENT = "CONFIRM_PAYMENT"
    CANCEL_ORDER = "CANCEL_ORDER"
    START_PROCESSING = "START_PROCESSING"
    SHIP_ORDER = "SHIP_ORDER"
    DELIVER_ORDER = "DELIVER_ORDER"
    COMPLETE_ORDER = "COMPLETE_ORDER"
    INITIATE_RETURN = "INITIATE_RETURN"
    PROCESS_REFUND = "PROCESS_REFUND"


@dataclass
class StateTransition:
    """Represents a state transition."""
    trigger: str
    source: str
    dest: str
    before: Optional[Callable] = None
    after: Optional[Callable] = None
    conditions: Optional[List[Callable]] = None


class OrderStateMachine:
    """
    State machine for Order lifecycle.
    
    Usage:
        order = OrderStateMachine("order-123")
        order.confirm_payment()  # PENDING → CONFIRMED
        order.start_processing()  # CONFIRMED → PROCESSING
        order.ship_order()  # PROCESSING → SHIPPED
    """
    
    # Define all states
    states = [state.value for state in OrderState]
    
    # Define transitions
    transitions = [
        # PENDING → CONFIRMED or CANCELLED
        StateTransition("confirm_payment", "PENDING", "CONFIRMED"),
        StateTransition("cancel", "PENDING", "CANCELLED"),
        
        # CONFIRMED → PROCESSING or CANCELLED
        StateTransition("start_processing", "CONFIRMED", "PROCESSING"),
        StateTransition("cancel", "CONFIRMED", "CANCELLED"),
        
        # PROCESSING → SHIPPED or CANCELLED
        StateTransition("ship_order", "PROCESSING", "SHIPPED"),
        StateTransition("cancel", "PROCESSING", "CANCELLED"),
        
        # SHIPPED → DELIVERED or RETURNED
        StateTransition("deliver_order", "SHIPPED", "DELIVERED"),
        StateTransition("initiate_return", "SHIPPED", "RETURNED"),
        
        # DELIVERED → COMPLETED or RETURNED
        StateTransition("complete_order", "DELIVERED", "COMPLETED"),
        StateTransition("initiate_return", "DELIVERED", "RETURNED"),
        
        # RETURNED → REFUNDED
        StateTransition("process_refund", "RETURNED", "REFUNDED"),
    ]
    
    def __init__(self, order_id: str, initial_state: str = "PENDING"):
        """
        Initialize order state machine.
        
        Args:
            order_id: Unique order identifier
            initial_state: Starting state (default: PENDING)
        """
        self.order_id = order_id
        self.state = initial_state
        self.transition_history: List[Dict[str, Any]] = []
        
        # Initialize state machine
        self.machine = Machine(
            model=self,
            states=self.states,
            initial=initial_state,
            transitions=[
                {
                    'trigger': t.trigger,
                    'source': t.source,
                    'dest': t.dest,
                    'before': t.before,
                    'after': t.after,
                    'conditions': t.conditions
                }
                for t in self.transitions
            ],
            send_event=True,
            queued=True
        )
        
        # Add global callbacks
        self.machine.on_enter_state(self._on_state_enter)
        self.machine.on_exit_state(self._on_state_exit)
    
    def _on_state_enter(self, event):
        """Called when entering any state."""
        self.transition_history.append({
            "order_id": self.order_id,
            "event": event.trigger,
            "from_state": event.data.get('source', 'INITIAL'),
            "to_state": self.state,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def _on_state_exit(self, event):
        """Called when exiting any state."""
        pass
    
    def can_confirm_payment(self) -> bool:
        """Check if payment can be confirmed."""
        return self.state == "PENDING"
    
    def can_cancel(self) -> bool:
        """Check if order can be cancelled."""
        return self.state in ["PENDING", "CONFIRMED", "PROCESSING"]
    
    def can_ship(self) -> bool:
        """Check if order can be shipped."""
        return self.state == "PROCESSING"
    
    def get_transition_history(self) -> List[Dict[str, Any]]:
        """Get full transition history."""
        return self.transition_history
    
    def get_current_state(self) -> OrderState:
        """Get current state."""
        return OrderState(self.state)
    
    def is_terminal_state(self) -> bool:
        """Check if in terminal state (no further transitions possible)."""
        return self.state in ["COMPLETED", "CANCELLED", "REFUNDED"]
