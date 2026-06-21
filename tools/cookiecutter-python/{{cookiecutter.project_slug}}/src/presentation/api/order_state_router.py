"""
FastAPI endpoints for order state management.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID

from domain.services.order_state_machine import OrderStateMachine, OrderState


router = APIRouter(prefix="/orders/{order_id}/state", tags=["Order State"])


class StateResponse(BaseModel):
    """Response for order state queries."""
    order_id: str
    state: str
    is_terminal: bool


class TransitionResponse(BaseModel):
    """Response for state transitions."""
    success: bool
    message: str
    new_state: Optional[str] = None
    current_state: Optional[str] = None
    error: Optional[str] = None


def create_state_machine_factory() -> callable:
    """Factory function to create OrderStateMachine instances."""
    def factory(order_id: str) -> OrderStateMachine:
        return OrderStateMachine(order_id)
    return factory


_state_machine_factory = create_state_machine_factory()


@router.get("", response_model=StateResponse)
async def get_order_state(order_id: UUID):
    """Get current state of an order."""
    state_machine = _state_machine_factory(str(order_id))
    
    return StateResponse(
        order_id=str(order_id),
        state=state_machine.state,
        is_terminal=state_machine.is_terminal_state()
    )


@router.post("/confirm-payment", response_model=TransitionResponse)
async def confirm_payment(order_id: UUID):
    """Confirm payment - transitions from PENDING to CONFIRMED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        if not state_machine.can_confirm_payment():
            return TransitionResponse(
                success=False,
                message="Cannot confirm payment from current state",
                current_state=state_machine.state
            )
        
        state_machine.confirm_payment()
        
        return TransitionResponse(
            success=True,
            message="Payment confirmed",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/start-processing", response_model=TransitionResponse)
async def start_processing(order_id: UUID):
    """Start processing - transitions from CONFIRMED to PROCESSING."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.start_processing()
        
        return TransitionResponse(
            success=True,
            message="Processing started",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/ship", response_model=TransitionResponse)
async def ship_order(order_id: UUID):
    """Ship order - transitions from PROCESSING to SHIPPED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.ship_order()
        
        return TransitionResponse(
            success=True,
            message="Order shipped",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/deliver", response_model=TransitionResponse)
async def deliver_order(order_id: UUID):
    """Deliver order - transitions from SHIPPED to DELIVERED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.deliver_order()
        
        return TransitionResponse(
            success=True,
            message="Order delivered",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/complete", response_model=TransitionResponse)
async def complete_order(order_id: UUID):
    """Complete order - transitions from DELIVERED to COMPLETED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.complete_order()
        
        return TransitionResponse(
            success=True,
            message="Order completed",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/cancel", response_model=TransitionResponse)
async def cancel_order(order_id: UUID):
    """Cancel order - transitions to CANCELLED from PENDING/CONFIRMED/PROCESSING."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        if not state_machine.can_cancel():
            return TransitionResponse(
                success=False,
                message="Cannot cancel order from current state",
                current_state=state_machine.state
            )
        
        state_machine.cancel()
        
        return TransitionResponse(
            success=True,
            message="Order cancelled",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/return", response_model=TransitionResponse)
async def initiate_return(order_id: UUID):
    """Initiate return - transitions from SHIPPED/DELIVERED to RETURNED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.initiate_return()
        
        return TransitionResponse(
            success=True,
            message="Return initiated",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )


@router.post("/refund", response_model=TransitionResponse)
async def process_refund(order_id: UUID):
    """Process refund - transitions from RETURNED to REFUNDED."""
    state_machine = _state_machine_factory(str(order_id))
    
    try:
        state_machine.process_refund()
        
        return TransitionResponse(
            success=True,
            message="Refund processed",
            new_state=state_machine.state
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition failed: {str(e)}"
        )
