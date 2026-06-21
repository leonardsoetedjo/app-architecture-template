from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, DBAPIError

from domain.order_id import OrderId
from domain.order import Order
from domain.exceptions import InvalidOrderException
from domain.ports.order_repository import OrderRepository

from .models import OrderEntity, OrderItemEntity, OutboxEventEntity
from .mapper import OrderMapper


class SqlAlchemyOrderRepository(OrderRepository):
    """SQLAlchemy adapter implementing OrderRepository port.

    Persists orders with outbox events in the same transaction.
    """

    def __init__(self, session: Session):
        self._session = session

    def save(self, order: Order) -> Order:
        """Persist order + outbox event atomically."""
        entity = OrderMapper.to_entity(order)
        try:
            self._session.add(entity)
            self._session.flush()

            # Outbox pattern: write event in same transaction
            payload = {
                "order_id": str(order.id.value),
                "customer_id": str(order.customer_id),
                "items": [
                    {
                        "product_id": str(it.product_id),
                        "quantity": it.quantity,
                        "unit_price": str(it.unit_price),
                    }
                    for it in order.items
                ],
                "total_amount": str(order.total_amount()),
                "created_at": order.created_at.isoformat(),
            }
            outbox = OutboxEventEntity(
                event_type="OrderPlaced",
                aggregate_id=str(order.id.value),
                payload=str(payload),
            )
            self._session.add(outbox)
            self._session.commit()
            self._session.refresh(entity)
            return OrderMapper.to_domain(entity)
        except (SQLAlchemyError, DBAPIError) as exc:
            self._session.rollback()
            raise InvalidOrderException(f"Failed to save order: {exc}")

    def find_by_id(self, order_id: OrderId) -> Order | None:
        entity = (
            self._session.query(OrderEntity)
            .filter(OrderEntity.id == order_id.value)
            .first()
        )
        return OrderMapper.to_domain(entity) if entity else None

    def find_by_customer_id(self, customer_id: UUID) -> list[Order]:
        from uuid import UUID
        entities = (
            self._session.query(OrderEntity)
            .filter(OrderEntity.customer_id == customer_id)
            .all()
        )
        return [OrderMapper.to_domain(e) for e in entities]

    def count(self) -> int:
        return self._session.query(OrderEntity).count()

    def exists(self, order_id: OrderId) -> bool:
        count = (
            self._session.query(OrderEntity)
            .filter(OrderEntity.id == order_id.value)
            .count()
        )
        return count > 0

    def find_all(self) -> list[Order]:
        entities = self._session.query(OrderEntity).all()
        return [OrderMapper.to_domain(e) for e in entities]

    def delete_by_id(self, order_id: OrderId) -> None:
        entity = (
            self._session.query(OrderEntity)
            .filter(OrderEntity.id == order_id.value)
            .first()
        )
        if entity:
            self._session.delete(entity)
            self._session.commit()
