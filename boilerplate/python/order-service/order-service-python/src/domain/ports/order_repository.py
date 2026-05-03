from abc import ABC, abstractmethod
from typing import Optional, List
from .models.order import Order, OrderId

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> Order:
        """Persist the order to the database."""
        pass

    @abstractmethod
    def find_by_id(self, order_id: OrderId) -> Optional[Order]:
        """Retrieve an order by its unique ID."""
        pass
