from abc import ABC, abstractmethod
from typing import Optional, List

from domain.order import Order
from domain.order_id import OrderId

class OrderRepository(ABC):
    """Repository port for Order persistence.

    ABC = zero framework dependencies.
    Infrastructure adapters implement this.
    """

    @abstractmethod
    def save(self, order: Order) -> Order:
        """Persist the order to the database."""
        ...

    @abstractmethod
    def find_by_id(self, order_id: OrderId) -> Optional[Order]:
        """Retrieve an order by its OrderId value object."""
        ...

    @abstractmethod
    def find_by_customer_id(self, customer_id: OrderId) -> List[Order]:
        """Find all orders for a customer by OrderId."""
        ...

    @abstractmethod
    def find_all(self) -> List[Order]:
        """Return all orders."""
        ...

    @abstractmethod
    def count(self) -> int:
        """Return total number of orders."""
        ...

    @abstractmethod
    def exists(self, order_id: OrderId) -> bool:
        """Check if an order exists."""
        ...
