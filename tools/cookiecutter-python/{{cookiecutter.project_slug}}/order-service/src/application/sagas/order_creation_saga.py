"""
Order Creation Saga - Orchestrates distributed transaction for order creation.

Saga Flow:
1. Create Order (PENDING)
2. Reserve Inventory
   ├─ Success → Continue
   └─ Failure → Compensate: Cancel Order
3. Authorize Payment
   ├─ Success → Confirm Order (CONFIRMED)
   └─ Failure → Compensate: Release Inventory → Cancel Order

This implements the Orchestration Pattern where a central coordinator
manages the saga execution and compensation.
"""

import logging
from typing import Protocol, List, runtime_checkable
from dataclasses import dataclass
from decimal import Decimal

from domain.models.order import Order
from domain.order_id import OrderId
from domain.services.order_state_machine import OrderStateMachine, OrderEvent


logger = logging.getLogger(__name__)


@runtime_checkable
class InventoryService(Protocol):
    """Inventory service port."""
    
    def reserve_items(self, order_id: OrderId, items: List) -> bool:
        """Reserve items for order. Returns True if successful."""
        ...
    
    def release_reservation(self, order_id: OrderId) -> None:
        """Release inventory reservation."""
        ...


@runtime_checkable
class PaymentService(Protocol):
    """Payment service port."""
    
    def authorize_payment(self, order_id: OrderId, customer_id: str, amount: Decimal) -> bool:
        """Authorize payment. Returns True if successful."""
        ...
    
    def void_authorization(self, order_id: OrderId) -> None:
        """Void payment authorization."""
        ...


@dataclass
class SagaResult:
    """Result of saga execution."""
    success: bool
    order_id: OrderId
    message: str
    failed_step: str | None = None


class OrderCreationSaga:
    """
    Order Creation Saga orchestrator.
    
    Coordinates inventory reservation and payment authorization
    with compensating transactions on failure.
    """
    
    def __init__(
        self,
        inventory_service: InventoryService,
        payment_service: PaymentService,
        order_state_machine_factory: callable
    ):
        """
        Initialize saga.
        
        Args:
            inventory_service: Inventory service implementation
            payment_service: Payment service implementation
            order_state_machine_factory: Factory function to create OrderStateMachine
        """
        self.inventory_service = inventory_service
        self.payment_service = payment_service
        self.order_state_machine_factory = order_state_machine_factory
    
    def execute(self, order: Order) -> SagaResult:
        """
        Execute order creation saga.
        
        Args:
            order: Order to create
            
        Returns:
            SagaResult with success status and details
        """
        order_id = order.id
        logger.info(f"Starting OrderCreationSaga for order: {order_id}")
        
        try:
            # Step 1: Create order in PENDING state
            self._create_order(order)
            
            # Step 2: Reserve inventory
            if not self._reserve_inventory(order):
                logger.warning(f"Inventory reservation failed for order: {order_id}")
                self._compensate_inventory_reservation(order)
                self._cancel_order(order)
                return SagaResult(
                    success=False,
                    order_id=order_id,
                    message="Inventory reservation failed",
                    failed_step="reserve_inventory"
                )
            
            # Step 3: Authorize payment
            if not self._authorize_payment(order):
                logger.warning(f"Payment authorization failed for order: {order_id}")
                self._compensate_payment_authorization(order)
                self._compensate_inventory_reservation(order)
                self._cancel_order(order)
                return SagaResult(
                    success=False,
                    order_id=order_id,
                    message="Payment authorization failed",
                    failed_step="authorize_payment"
                )
            
            # Step 4: Confirm order
            self._confirm_order(order)
            
            logger.info(f"OrderCreationSaga completed successfully for order: {order_id}")
            return SagaResult(
                success=True,
                order_id=order_id,
                message="Order created successfully"
            )
            
        except Exception as e:
            logger.error(f"OrderCreationSaga failed for order: {order_id}", exc_info=True)
            self._rollback(order)
            return SagaResult(
                success=False,
                order_id=order_id,
                message=f"Saga failed: {str(e)}",
                failed_step="unknown"
            )
    
    # ============== Saga Steps ==============
    
    def _create_order(self, order: Order) -> None:
        """Step 1: Create order."""
        logger.info(f"Step 1: Creating order {order.id}")
        # Order already created by this point
    
    def _reserve_inventory(self, order: Order) -> bool:
        """Step 2: Reserve inventory."""
        logger.info(f"Step 2: Reserving inventory for order {order.id}")
        return self.inventory_service.reserve_items(order.id, order.items)
    
    def _authorize_payment(self, order: Order) -> bool:
        """Step 3: Authorize payment."""
        logger.info(f"Step 3: Authorizing payment for order {order.id}")
        return self.payment_service.authorize_payment(
            order.id,
            order.customer_id,
            order.total_amount
        )
    
    def _confirm_order(self, order: Order) -> None:
        """Step 4: Confirm order."""
        logger.info(f"Step 4: Confirming order {order.id}")
        state_machine = self.order_state_machine_factory(order.id.value)
        state_machine.confirm_payment()
    
    def _cancel_order(self, order: Order) -> None:
        """Cancel order."""
        logger.info(f"Compensation: Cancelling order {order.id}")
        state_machine = self.order_state_machine_factory(order.id.value)
        try:
            state_machine.cancel()
        except MachineError:
            logger.warning(f"Could not cancel order {order.id} - already in terminal state")
    
    # ============== Compensation Actions ==============
    
    def _compensate_inventory_reservation(self, order: Order) -> None:
        """Compensate: Release inventory."""
        logger.info(f"Compensation: Releasing inventory for order {order.id}")
        self.inventory_service.release_reservation(order.id)
    
    def _compensate_payment_authorization(self, order: Order) -> None:
        """Compensate: Void payment."""
        logger.info(f"Compensation: Voiding payment authorization for order {order.id}")
        self.payment_service.void_authorization(order.id)
    
    def _rollback(self, order: Order) -> None:
        """Rollback all changes."""
        logger.info(f"Rolling back all changes for order {order.id}")
        try:
            self._compensate_payment_authorization(order)
        except Exception as e:
            logger.error(f"Failed to void payment: {e}")
        
        try:
            self._compensate_inventory_reservation(order)
        except Exception as e:
            logger.error(f"Failed to release inventory: {e}")
        
        try:
            self._cancel_order(order)
        except Exception as e:
            logger.error(f"Failed to cancel order: {e}")
