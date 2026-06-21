"""Unit tests for domain layer: Order, OrderId, OrderItem.

Uses only stdlib + pytest. No framework imports.
"""
from decimal import Decimal
from uuid import UUID, uuid4
from datetime import datetime, timezone

import pytest

from domain.order import Order
from domain.order_id import OrderId
from domain.order_item import OrderItem
from domain.exceptions import InvalidOrderException, IllegalStateException


class TestOrderId:

    def test_should_generate_unique_values(self):
        a = OrderId.generate()
        b = OrderId.generate()
        assert a != b
        assert isinstance(a.value, UUID)

    def test_should_reconstruct_from_string(self):
        original = OrderId.generate()
        restored = OrderId.from_string(str(original))
        assert original == restored

    def test_should_be_immutable(self):
        oid = OrderId.generate()
        with pytest.raises(AttributeError):
            oid.value = uuid4()


class TestOrderItem:

    def test_should_calculate_total_price(self):
        item = OrderItem(
            product_id=uuid4(),
            quantity=3,
            unit_price=Decimal("10.50"),
        )
        assert item.total_price() == Decimal("31.50")

    def test_should_be_frozen(self):
        item = OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("5.00"))
        with pytest.raises(AttributeError):
            item.quantity = 2


class TestOrder:

    def test_should_create_valid_order(self):
        customer_id = uuid4()
        items = [
            OrderItem(product_id=uuid4(), quantity=2, unit_price=Decimal("19.99")),
            OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("5.00")),
        ]
        order = Order.create(customer_id, items)

        assert isinstance(order.id, OrderId)
        assert order.customer_id == customer_id
        assert order.status == "PENDING"
        assert len(order.items) == 2
        assert order.total_amount() == Decimal("44.98")
        assert order.created_at is not None

    def test_should_reject_empty_items(self):
        with pytest.raises(InvalidOrderException, match="at least one item"):
            Order.create(uuid4(), [])

    def test_should_reject_zero_quantity(self):
        with pytest.raises(InvalidOrderException, match="positive quantity"):
            Order.create(
                uuid4(),
                [OrderItem(product_id=uuid4(), quantity=0, unit_price=Decimal("10.00"))],
            )

    def test_should_reject_negative_price(self):
        with pytest.raises(InvalidOrderException, match="non-negative price"):
            Order.create(
                uuid4(),
                [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("-5.00"))],
            )

    def test_should_confirm_pending_order(self):
        order = Order.create(
            uuid4(),
            [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))],
        )
        order.confirm()
        assert order.status == "CONFIRMED"
        assert order.confirmed_at is not None

    def test_should_refuse_double_confirmation(self):
        order = Order.create(
            uuid4(),
            [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))],
        )
        order.confirm()
        with pytest.raises(IllegalStateException, match="Only pending"):
            order.confirm()

    def test_should_compare_by_identity(self):
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
        a = Order.create(customer_id, items)
        b = Order.create(customer_id, items)
        assert a != b
        assert a == a
        assert hash(a) == hash(a.id)

    def test_should_use_utc_datetime(self):
        before = datetime.now(timezone.utc)
        order = Order.create(
            uuid4(),
            [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("1.00"))],
        )
        after = datetime.now(timezone.utc)
        assert before <= order.created_at <= after
        assert order.created_at.tzinfo is not None
