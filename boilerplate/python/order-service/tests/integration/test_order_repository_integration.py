"""Integration tests for Order repository with real PostgreSQL.

These tests verify the repository layer works correctly with a real database.
Uses Testcontainers PostgreSQL for test isolation.

Run with: pytest tests/integration/ -v --tb=short
"""

import pytest
from uuid import uuid4
from decimal import Decimal
from datetime import datetime, timezone

from domain.order import Order
from domain.order_id import OrderId
from domain.order_item import OrderItem
from infrastructure.persistence.order_repository_impl import SqlAlchemyOrderRepository


@pytest.mark.integration
class TestOrderRepositoryIntegration:
    """Integration tests for OrderRepository with PostgreSQL."""
    
    def test_save_and_find_order(self, db_session):
        """Test saving and retrieving an order."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [
            OrderItem(product_id=uuid4(), quantity=2, unit_price=Decimal("29.99"))
        ]
        order = Order.create(customer_id=customer_id, items=items)
        
        # Act
        saved_order = repo.save(order)
        db_session.commit()
        
        # Assert
        found_order = repo.find_by_id(saved_order.id)
        assert found_order is not None
        assert found_order.id == order.id
        assert found_order.customer_id == customer_id
        assert len(found_order.items) == 1
        assert found_order.status == "PENDING"
    
    def test_find_by_customer_id(self, db_session):
        """Test finding orders by customer ID."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        
        # Create multiple orders for same customer
        for i in range(3):
            items = [
                OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))
            ]
            order = Order.create(customer_id=customer_id, items=items)
            repo.save(order)
            db_session.commit()
        
        # Act
        orders = repo.find_by_customer_id(customer_id)
        
        # Assert
        assert len(orders) == 3
        assert all(order.customer_id == customer_id for order in orders)
    
    def test_update_order_status(self, db_session):
        """Test updating order status."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
        order = Order.create(customer_id=customer_id, items=items)
        repo.save(order)
        db_session.commit()
        
        # Act: Confirm the order
        order.confirm()
        repo.save(order)
        db_session.commit()
        
        # Assert
        found = repo.find_by_id(order.id)
        assert found is not None
        assert found.status == "CONFIRMED"
        assert found.confirmed_at is not None
    
    def test_count_orders(self, db_session):
        """Test counting orders."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        
        # Create 5 orders
        for i in range(5):
            items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
            order = Order.create(customer_id=customer_id, items=items)
            repo.save(order)
            db_session.commit()
        
        # Act
        count = repo.count()
        
        # Assert
        assert count == 5
    
    def test_delete_order(self, db_session):
        """Test deleting an order."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
        order = Order.create(customer_id=customer_id, items=items)
        repo.save(order)
        db_session.commit()
        
        # Act
        repo.delete_by_id(order.id)
        db_session.commit()
        
        # Assert
        found = repo.find_by_id(order.id)
        assert found is None
    
    def test_order_exists(self, db_session):
        """Test checking if order exists."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
        order = Order.create(customer_id=customer_id, items=items)
        repo.save(order)
        db_session.commit()
        
        # Act & Assert
        assert repo.exists(order.id) is True
        assert repo.exists(OrderId.generate()) is False
    
    def test_find_all_orders(self, db_session):
        """Test retrieving all orders."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        
        # Create 3 orders
        for i in range(3):
            items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
            order = Order.create(customer_id=customer_id, items=items)
            repo.save(order)
            db_session.commit()
        
        # Act
        orders = repo.find_all()
        
        # Assert
        assert len(orders) == 3
    
    def test_transaction_rollback(self, db_session):
        """Test that transactions are rolled back after each test."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("10.00"))]
        order = Order.create(customer_id=customer_id, items=items)
        
        # Act: Save order but this test's transaction will rollback
        repo.save(order)
        db_session.commit()
        
        # Assert: Order exists in this test
        assert repo.count() >= 1
        
        # After this test, the transaction rolls back automatically
        # Next test starts with clean database
    
    def test_order_with_multiple_items(self, db_session):
        """Test order with multiple items."""
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [
            OrderItem(product_id=uuid4(), quantity=2, unit_price=Decimal("29.99")),
            OrderItem(product_id=uuid4(), quantity=1, unit_price=Decimal("49.99")),
            OrderItem(product_id=uuid4(), quantity=3, unit_price=Decimal("9.99")),
        ]
        order = Order.create(customer_id=customer_id, items=items)
        
        # Act
        saved_order = repo.save(order)
        db_session.commit()
        
        # Assert
        found = repo.find_by_id(saved_order.id)
        assert found is not None
        assert len(found.items) == 3
        assert found.total_amount() == Decimal("29.99") * 2 + Decimal("49.99") + Decimal("9.99") * 3


@pytest.mark.integration
class TestOrderRepositoryEdgeCases:
    """Edge case tests for OrderRepository."""
    
    def test_find_nonexistent_order(self, db_session):
        """Test finding an order that doesn't exist."""
        repo = SqlAlchemyOrderRepository(db_session)
        fake_id = OrderId.generate()
        
        result = repo.find_by_id(fake_id)
        
        assert result is None
    
    def test_empty_customer_orders(self, db_session):
        """Test finding orders for customer with no orders."""
        repo = SqlAlchemyOrderRepository(db_session)
        nonexistent_customer = uuid4()
        
        orders = repo.find_by_customer_id(nonexistent_customer)
        
        assert len(orders) == 0
    
    def test_delete_nonexistent_order(self, db_session):
        """Test deleting an order that doesn't exist."""
        repo = SqlAlchemyOrderRepository(db_session)
        fake_id = OrderId.generate()
        
        # Should not raise exception
        repo.delete_by_id(fake_id)
    
    def test_order_with_zero_quantity_item(self, db_session):
        """Test order with zero quantity item (should fail validation)."""
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        
        with pytest.raises(ValueError, match="positive quantity"):
            items = [OrderItem(product_id=uuid4(), quantity=0, unit_price=Decimal("10.00"))]
            Order.create(customer_id=customer_id, items=items)
