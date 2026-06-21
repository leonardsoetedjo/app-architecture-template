"""
Update Order Use Case demonstrating Write-Through pattern.

Pattern:
1. Update database
2. Immediately update cache (write-through)
3. Return updated order

This ensures cache consistency with database.
"""

from typing import List
from domain.models.order import Order
from domain.models.order_item import OrderItem
from domain.ports.order_repository import OrderRepository
from domain.ports.cache_manager import CacheManager
from domain.order_id import OrderId


class UpdateOrderUseCase:
    """Update order with write-through caching."""
    
    CACHE_KEY_PREFIX = "{{ cookiecutter.project_slug }}:order:"
    CACHE_KEY_SUFFIX = ":full"
    
    def __init__(self, order_repository: OrderRepository, cache_manager: CacheManager):
        """
        Initialize use case.
        
        Args:
            order_repository: Order repository port
            cache_manager: Cache manager port
        """
        self.order_repository = order_repository
        self.cache_manager = cache_manager
    
    def execute(self, order_id: OrderId, items: List[OrderItem]) -> Order:
        """
        Update order with write-through caching.
        
        Args:
            order_id: Order ID
            items: Updated order items
            
        Returns:
            Updated order
            
        Raises:
            OrderNotFoundException: If order doesn't exist
        """
        # Step 1: Update database
        updated_order = self.order_repository.update(order_id, items)
        if updated_order is None:
            raise OrderNotFoundException(order_id)
        
        # Step 2: Write-through - update cache immediately
        cache_key = self._build_cache_key(order_id)
        self.cache_manager.put(cache_key, updated_order)
        
        return updated_order
    
    def cancel_order(self, order_id: OrderId) -> None:
        """
        Cancel order with cache invalidation.
        
        Args:
            order_id: Order ID to cancel
        """
        # Update database
        self.order_repository.cancel(order_id)
        
        # Invalidate cache (don't cache cancelled orders)
        self.invalidate_cache(order_id)
    
    def invalidate_cache(self, order_id: OrderId) -> None:
        """
        Invalidate order cache.
        
        Args:
            order_id: Order ID to invalidate
        """
        cache_key = self._build_cache_key(order_id)
        self.cache_manager.evict(cache_key)
    
    def _build_cache_key(self, order_id: OrderId) -> str:
        """Build cache key from order ID."""
        return f"{self.CACHE_KEY_PREFIX}{order_id.value}{self.CACHE_KEY_SUFFIX}"


class OrderNotFoundException(Exception):
    """Raised when order is not found."""
    
    def __init__(self, order_id: OrderId):
        super().__init__(f"Order not found: {order_id.value}")
