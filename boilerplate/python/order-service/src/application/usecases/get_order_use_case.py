"""
Get Order Use Case demonstrating Cache-Aside pattern.

Pattern:
1. Check cache first
2. On cache miss → load from database
3. Populate cache with result
4. Return order

This optimizes read-heavy workloads by reducing database queries.
"""

from typing import Optional
from domain.models.order import Order
from domain.ports.order_repository import OrderRepository
from domain.ports.cache_manager import CacheManager
from domain.order_id import OrderId


class GetOrderUseCase:
    """Get order by ID with cache-aside pattern."""
    
    CACHE_KEY_PREFIX = "order-service:order:"
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
    
    def execute(self, order_id: OrderId) -> Order:
        """
        Get order by ID with cache-aside pattern.
        
        Args:
            order_id: Order ID
            
        Returns:
            Order if found
            
        Raises:
            OrderNotFoundException: If order doesn't exist
        """
        cache_key = self._build_cache_key(order_id)
        
        # Step 1: Check cache first
        cached_order = self.cache_manager.get(cache_key, Order)
        if cached_order is not None:
            return cached_order
        
        # Step 2: Cache miss - load from database
        order = self.order_repository.find_by_id(order_id)
        if order is None:
            raise OrderNotFoundException(order_id)
        
        # Step 3: Populate cache
        self.cache_manager.put(cache_key, order)
        
        # Step 4: Return order
        return order
    
    def invalidate_cache(self, order_id: OrderId) -> None:
        """
        Invalidate order cache (call after updates).
        
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
