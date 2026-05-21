from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from domain.order import Order
from domain.order_id import OrderId
from domain.order_item import OrderItem
from .models import OrderEntity, OrderItemEntity


class OrderMapper:
    """Bidirectional domain ↔ SQLAlchemy entity mapper.

    Isolated from domain concerns — persistence logic only.
    """

    @staticmethod
    def to_domain(entity: OrderEntity | None) -> Order | None:
        if entity is None:
            return None
        items = [
            OrderItem(
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=Decimal(str(it.unit_price)),
            )
            for it in entity.items
        ]
        return Order(
            id=OrderId(entity.id),
            customer_id=entity.customer_id,
            items=items,
            status=entity.status,
            created_at=entity.created_at,
            confirmed_at=entity.confirmed_at,
        )

    @staticmethod
    def to_entity(domain: Order) -> OrderEntity:
        entity_items = [
            OrderItemEntity(
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,  # SQLAlchemy Numeric handles Decimal
            )
            for it in domain.items
        ]
        order_entity = OrderEntity(
            id=domain.id.value,
            customer_id=domain.customer_id,
            status=domain.status,
            created_at=domain.created_at,
            confirmed_at=domain.confirmed_at,
        )
        order_entity.items = entity_items
        return order_entity
