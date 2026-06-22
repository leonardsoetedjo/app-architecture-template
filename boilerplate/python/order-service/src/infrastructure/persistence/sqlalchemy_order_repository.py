from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, DBAPIError

from domain.order_id import OrderId
from domain.order import Order
from domain.exceptions import InvalidOrderException
from domain.ports.order_repository import OrderRepository

from infrastructure.persistence.models import OrderEntity, OrderItemEntity, OutboxEventEntity
from infrastructure.persistence.mapper import OrderMapper


class SqlAlchemyOrderRepository(OrderRepository):
    """SQLAlchemy adapter implementing OrderRepository port."""

    def __init__(self, session_factory):
        self._session_factory = session_factory

    def _session(self) -> Session:
        return self._session_factory()

    def save(self, order: Order) -> Order:
        with self._session_factory() as session:
            try:
                existing = session.query(OrderEntity).filter(OrderEntity.id == str(order.id.value)).first()
                if existing:
                    existing.status = order.status
                    existing.customer_id = order.customer_id
                    existing.confirmed_at = order.confirmed_at
                    session.commit()
                    session.refresh(existing)
                    return OrderMapper.to_domain(existing)

                entity = OrderMapper.to_entity(order)
                session.add(entity)
                session.flush()

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
                session.add(outbox)
                session.commit()
                session.refresh(entity)
                return OrderMapper.to_domain(entity)
            except (SQLAlchemyError, DBAPIError) as exc:
                session.rollback()
                raise InvalidOrderException(f"Failed to save order: {exc}")

    def find_by_id(self, order_id: OrderId) -> Order | None:
        with self._session_factory() as session:
            entity = (
                session.query(OrderEntity)
                .filter(OrderEntity.id == str(order_id.value))
                .first()
            )
            return OrderMapper.to_domain(entity) if entity else None

    def find_by_customer_id(self, customer_id: UUID) -> list[Order]:
        with self._session_factory() as session:
            entities = (
                session.query(OrderEntity)
                .filter(OrderEntity.customer_id == str(customer_id))
                .all()
            )
            return [OrderMapper.to_domain(e) for e in entities]

    def count(self) -> int:
        with self._session_factory() as session:
            return session.query(OrderEntity).count()

    def exists(self, order_id: OrderId) -> bool:
        with self._session_factory() as session:
            count = (
                session.query(OrderEntity)
                .filter(OrderEntity.id == str(order_id.value))
                .count()
            )
            return count > 0

    def find_all(self) -> list[Order]:
        with self._session_factory() as session:
            entities = session.query(OrderEntity).all()
            return [OrderMapper.to_domain(e) for e in entities]

    def delete_by_id(self, order_id: OrderId) -> None:
        with self._session_factory() as session:
            entity = (
                session.query(OrderEntity)
                .filter(OrderEntity.id == str(order_id.value))
                .first()
            )
            if entity:
                session.delete(entity)
                session.commit()
