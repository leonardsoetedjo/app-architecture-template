from __future__ import annotations

from typing import List
from uuid import UUID

from domain.exceptions import InvalidOrderException
from domain.order import Order, OrderItem
from domain.order_id import OrderId
from domain.ports.event_publisher import EventPublisher
from domain.ports.order_repository import OrderRepository
from domain.events.order_placed import OrderPlacedEvent


class OrderPlacementService:
    """Domain service for placing orders.

    Orchestrates: validation → creation → persistence → event publishing.
    Pure domain — no framework imports.
    """

    def __init__(
        self,
        order_repository: OrderRepository,
        event_publisher: EventPublisher,
    ):
        self._order_repository = order_repository
        self._event_publisher = event_publisher

    def place_order(self, customer_id: str, items: List[OrderItem]) -> Order:
        """Place a new order.

        1. Semantic validation
        2. Create domain entity (constructor validates)
        3. Persist via repository port
        4. Publish domain event
        """
        if not items:
            raise InvalidOrderException("Order must have at least one item")

        order = Order.create(customer_id, items)
        saved = self._order_repository.save(order)

        event = OrderPlacedEvent(
            order_id=saved.id.value,
            customer_id=saved.customer_id,
            created_at=saved.created_at,
            total_amount=saved.total_amount(),
        )
        self._event_publisher.publish(event)

        return saved
