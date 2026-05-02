from ..domain.models.order import Order, OrderId, OrderItem, InvalidOrderException
from ..domain.ports.order_repository import OrderRepository
from .dtos.order_dtos import CreateOrderCommand, OrderResult
from datetime import datetime, timezone

class PlaceOrderUseCase:
    def __init__(self, order_repository: OrderRepository):
        self.order_repository = order_repository

    def execute(self, command: CreateOrderCommand) -> OrderResult:
        # Semantic Validation
        if not command.items:
            raise InvalidOrderException("Order must have at least one item")

        # Map DTO to Domain Entity
        items = [
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            ) for item in command.items
        ]

        order = Order(
            id=OrderId.generate(),
            customer_id=command.customer_id,
            items=items
        )

        # Persist
        saved_order = self.order_repository.save(order)

        return OrderResult(
            order_id=saved_order.id.value,
            status=saved_order.status,
            created_at=saved_order.created_at.isoformat()
        )
