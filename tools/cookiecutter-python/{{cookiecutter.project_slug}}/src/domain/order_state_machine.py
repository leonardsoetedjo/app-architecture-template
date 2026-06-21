"""
Order State Machine Implementation

Implements state transitions for Order aggregate with validation.
States: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                     ↓
                  CANCELLED
"""

from enum import Enum
from typing import Set, Dict
from dataclasses import dataclass


class OrderStatus(str, Enum):
    """Order status states."""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


@dataclass(frozen=True)
class StatusTransition:
    """Represents a valid state transition."""
    from_status: OrderStatus
    to_status: OrderStatus
    allowed: bool


class OrderStateMachine:
    """
    State machine for Order status transitions.
    
    Enforces valid state transitions and prevents invalid ones.
    Thread-safe and immutable configuration.
    """
    
    # Define valid transitions
    VALID_TRANSITIONS: Dict[OrderStatus, Set[OrderStatus]] = {
        OrderStatus.PENDING: {
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        },
        OrderStatus.CONFIRMED: {
            OrderStatus.PROCESSING,
            OrderStatus.CANCELLED,
        },
        OrderStatus.PROCESSING: {
            OrderStatus.SHIPPED,
            OrderStatus.CANCELLED,
        },
        OrderStatus.SHIPPED: {
            OrderStatus.DELIVERED,
        },
        OrderStatus.DELIVERED: set(),  # Terminal state
        OrderStatus.CANCELLED: set(),  # Terminal state
    }
    
    @classmethod
    def can_transition(cls, from_status: OrderStatus, to_status: OrderStatus) -> bool:
        """
        Check if a transition is valid.
        
        Args:
            from_status: Current order status
            to_status: Target order status
            
        Returns:
            True if transition is valid, False otherwise
        """
        return to_status in cls.VALID_TRANSITIONS.get(from_status, set())
    
    @classmethod
    def get_allowed_transitions(cls, status: OrderStatus) -> Set[OrderStatus]:
        """
        Get all valid next states for a given status.
        
        Args:
            status: Current order status
            
        Returns:
            Set of allowed next statuses
        """
        return cls.VALID_TRANSITIONS.get(status, set()).copy()
    
    @classmethod
    def validate_transition(cls, from_status: OrderStatus, to_status: OrderStatus) -> None:
        """
        Validate a state transition, raising an exception if invalid.
        
        Args:
            from_status: Current order status
            to_status: Target order status
            
        Raises:
            InvalidStatusTransitionError: If transition is not allowed
        """
        if not cls.can_transition(from_status, to_status):
            allowed = cls.get_allowed_transitions(from_status)
            raise InvalidStatusTransitionError(
                f"Cannot transition from {from_status.value} to {to_status.value}. "
                f"Allowed transitions: {[s.value for s in allowed] or 'none (terminal state)'}"
            )
    
    @classmethod
    def is_terminal_state(cls, status: OrderStatus) -> bool:
        """
        Check if a status is a terminal state (no further transitions allowed).
        
        Args:
            status: Order status to check
            
        Returns:
            True if terminal state, False otherwise
        """
        return len(cls.get_allowed_transitions(status)) == 0


class InvalidStatusTransitionError(Exception):
    """Raised when an invalid order status transition is attempted."""
    
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


# Convenience functions for common transitions
def can_confirm_order(status: OrderStatus) -> bool:
    """Check if order can be confirmed."""
    return OrderStateMachine.can_transition(status, OrderStatus.CONFIRMED)


def can_cancel_order(status: OrderStatus) -> bool:
    """Check if order can be cancelled."""
    return OrderStateMachine.can_transition(status, OrderStatus.CANCELLED)


def can_ship_order(status: OrderStatus) -> bool:
    """Check if order can be shipped."""
    return OrderStateMachine.can_transition(status, OrderStatus.SHIPPED)


def can_deliver_order(status: OrderStatus) -> bool:
    """Check if order can be delivered."""
    return OrderStateMachine.can_transition(status, OrderStatus.DELIVERED)
