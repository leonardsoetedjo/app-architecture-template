"""
Tests for PlaceOrderUseCase.
"""
import pytest
from uuid import uuid4
from datetime import datetime

from src.domain.order import Order
from src.domain.order_id import OrderId
from src.domain.order_item import OrderItem
from src.domain.services.order_placement_service import OrderPlacementService
from src.application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
from src.application.dtos import CreateOrderCommand, OrderItemDTO, OrderResult


class MockOrderRepository:
    """Mock repository for testing."""
    
    def __init__(self):
        self.orders = {}
        self.saved_orders = []
    
    async def save(self, order: Order) -> Order:
        self.saved_orders.append(order)
        self.orders[order.id.value] = order
        return order
    
    async def find_by_id(self, order_id: OrderId) -> Order | None:
        return self.orders.get(str(order_id.value))


class MockEventPublisher:
    """Mock event publisher for testing."""
    
    def __init__(self):
        self.published_events = []
    
    async def publish(self, event):
        self.published_events.append(event)


class MockOrderPlacementService:
    """Mock domain service for testing."""
    
    def __init__(self):
        self.place_order_calls = []
    
    def place_order(
        self,
        customer_id: str,
        items: list[OrderItem]
    ) -> Order:
        self.place_order_calls.append({
            'customer_id': customer_id,
            'items': items
        })
        
        # Create a valid order
        order_id = OrderId(uuid4())
        order = Order.create(
            order_id=order_id,
            customer_id=customer_id,
            items=items
        )
        return order


class TestPlaceOrderUseCase:
    """Tests for PlaceOrderUseCase."""
    
    @pytest.fixture
    def mock_repository(self):
        return MockOrderRepository()
    
    @pytest.fixture
    def mock_event_publisher(self):
        return MockEventPublisher()
    
    @pytest.fixture
    def mock_placement_service(self):
        return MockOrderPlacementService()
    
    @pytest.fixture
    def use_case(self, mock_repository, mock_event_publisher, mock_placement_service):
        return PlaceOrderUseCaseImpl(
            order_repository=mock_repository,
            order_placement_service=mock_placement_service,
            event_publisher=mock_event_publisher
        )
    
    def test_execute_success(self, use_case, mock_placement_service):
        """Test successful order placement."""
        # Arrange
        customer_id = uuid4()
        items = [
            OrderItemDTO(product_id=uuid4(), quantity=2, unit_price=100.0),
            OrderItemDTO(product_id=uuid4(), quantity=1, unit_price=50.0),
        ]
        command = CreateOrderCommand(customer_id=customer_id, items=items)
        
        # Act
        result = use_case.execute(command)
        
        # Assert
        assert isinstance(result, OrderResult)
        assert result.customer_id == customer_id
        assert len(mock_placement_service.place_order_calls) == 1
        
        call_args = mock_placement_service.place_order_calls[0]
        assert call_args['customer_id'] == customer_id
        assert len(call_args['items']) == 2
    
    def test_execute_with_invalid_command(self, use_case):
        """Test order placement with invalid command."""
        # Arrange - empty items
        customer_id = uuid4()
        items = []
        command = CreateOrderCommand(customer_id=customer_id, items=items)
        
        # Act & Assert
        with pytest.raises(ValueError, match="Items cannot be empty"):
            use_case.execute(command)
    
    def test_execute_with_null_customer_id(self, use_case):
        """Test order placement with null customer ID."""
        # Arrange
        items = [OrderItemDTO(product_id=uuid4(), quantity=1, unit_price=100.0)]
        command = CreateOrderCommand(customer_id=None, items=items)
        
        # Act & Assert
        with pytest.raises(ValueError):
            use_case.execute(command)
    
    def test_execute_publishes_event(
        self,
        use_case,
        mock_event_publisher,
        mock_placement_service
    ):
        """Test that domain event is published on successful order placement."""
        # Arrange
        customer_id = uuid4()
        items = [OrderItemDTO(product_id=uuid4(), quantity=1, unit_price=100.0)]
        command = CreateOrderCommand(customer_id=customer_id, items=items)
        
        # Act
        result = use_case.execute(command)
        
        # Assert
        assert len(mock_event_publisher.published_events) == 1
        event = mock_event_publisher.published_events[0]
        assert event['type'] == 'OrderPlaced'
        assert event['customer_id'] == str(customer_id)
    
    def test_execute_saves_order(
        self,
        use_case,
        mock_repository,
        mock_placement_service
    ):
        """Test that order is saved to repository."""
        # Arrange
        customer_id = uuid4()
        items = [OrderItemDTO(product_id=uuid4(), quantity=1, unit_price=100.0)]
        command = CreateOrderCommand(customer_id=customer_id, items=items)
        
        # Act
        result = use_case.execute(command)
        
        # Assert
        assert len(mock_repository.saved_orders) == 1
        saved_order = mock_repository.saved_orders[0]
        assert saved_order.customer_id == customer_id

