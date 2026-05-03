from sqlalchemy.orm import Session
from ..domain.models.order import Order, OrderId, OrderItem
from ..domain.ports.order_repository import OrderRepository
from .models import OrderSqlModel, OrderItemSqlModel

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
