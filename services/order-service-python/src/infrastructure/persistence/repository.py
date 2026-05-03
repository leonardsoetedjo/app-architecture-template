from sqlalchemy.orm import Session
from ..domain.models.order import Order, OrderId, OrderItem, OrderPlacedEvent
from ..domain.ports.order_repository import OrderRepository
from .models import OrderSqlModel, OrderItemSqlModel
from .outbox import OutboxEvent

class SqlAlchemyOrderRepository(OrderRepository):
    def __init__(self, session: Session):
        self.session = session

    def save(self, order: Order) -> Order:
        # Map Domain -> SQL
        sql_order = OrderSqlModel(
            id=order.id.value,
            customer_id=order.customer_id,
            created_at=order.created_at,
            status=order.status
        )

        sql_items = [
            OrderItemSqlModel(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            ) for item in order.items
        ]

        sql_order.items = sql_items

        self.session.add(sql_order)

        # Also persist the outbox event in the same transaction
        outbox_event = OutboxEvent(
            event_type="OrderPlaced",
            payload={
                "order_id": str(order.id.value),
                "customer_id": str(order.customer_id)
            }
        )
        self.session.add(outbox_event)

        self.session.commit()
        self.session.refresh(sql_order)

        # Map SQL -> Domain
        return Order(
            id=OrderId(sql_order.id),
            customer_id=sql_order.customer_id,
            items=[
                OrderItem(item.product_id, item.quantity, item.unit_price)
                for item in sql_order.items
            ],
            created_at=sql_order.created_at,
            status=sql_order.status
        )

    def find_by_id(self, order_id: OrderId) -> Order | None:
        sql_order = self.session.query(OrderSqlModel).filter(OrderSqlModel.id == order_id.value).first()
        if not sql_order:
            return None

        return Order(
            id=OrderId(sql_order.id),
            customer_id=sql_order.customer_id,
            items=[
                OrderItem(item.product_id, item.quantity, item.unit_price)
                for item in sql_order.items
            ],
            created_at=sql_order.created_at,
            status=sql_order.status
        )

    def get_unpublished_events(self, limit: int = 100) -> list[OutboxEvent]:
        """Get events that haven't been published yet."""
        return self.session.query(OutboxEvent).filter(OutboxEvent.published == 0).limit(limit).all()

    def mark_event_published(self, event_id: str):
        """Mark an event as published."""
        event = self.session.query(OutboxEvent).filter(OutboxEvent.id == event_id).first()
        if event:
            event.published = 1
            self.session.commit()
