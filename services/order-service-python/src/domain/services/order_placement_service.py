from typing import List
from ..domain.models.order import Order, OrderId, OrderItem, InvalidOrderException
from ..domain.ports.order_repository import OrderRepository

class OrderPlacementService:
    def __init__(self, order_repository: OrderRepository):
        self.order_repository = order_repository

    def place_order(self, customer_id, items: List[OrderItem]) -> Order:
        # 1. Semantic Domain Validation
        if not items:
            raise InvalidOrderException("Order must have at least one item")

        # 2. Create Domain Entity
        order = Order(
            id=OrderId.generate(),
            customer_id=customer_id,
            items=items
        )

        # 3. Persist via Port
        return self.order_repository.save(order)
