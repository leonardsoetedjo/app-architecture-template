from __future__ import annotations

from decimal import Decimal
from typing import List
from uuid import UUID

from application.dtos import CreateOrderCommand, OrderResult
from domain.order import Order, OrderItem
from domain.services.order_placement_service import OrderPlacementService


class PlaceOrderUseCaseImpl:
    """Application use case: maps commands, orchestrates domain service, returns result.

    Follows CQS: this is a Command (mutates state, returns result DTO).
    """

    def __init__(self, placement_service: OrderPlacementService):
        self._placement_service = placement_service

    def execute(self, command: CreateOrderCommand) -> OrderResult:
        """Execute the place order use case.

        Steps:
        1. Map DTO → domain objects (Domain Item uses Decimal)
        2. Delegate to OrderPlacementService (domain)
        3. Map domain result → application DTO
        """
        items: List[OrderItem] = [
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in command.items
        ]

        saved = self._placement_service.place_order(
            customer_id=command.customer_id,
            items=items,
        )

        return OrderResult(
            order_id=saved.id.value,
            status=saved.status,
            created_at=saved.created_at,
        )
