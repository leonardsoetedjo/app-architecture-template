"""
Centralized cache invalidation service.

Provides methods to invalidate caches for different entities.
Use this service instead of calling CacheManager directly
to ensure consistent invalidation patterns.
"""

from domain.ports.cache_manager import CacheManager
from domain.order_id import OrderId


class CacheInvalidationService:
    """Centralized cache invalidation service."""
    
    ORDER_CACHE_PREFIX = "{{ cookiecutter.project_slug }}:order:"
    USER_CACHE_PREFIX = "{{ cookiecutter.project_slug }}:user:"
    CACHE_KEY_SUFFIX_FULL = ":full"
    CACHE_KEY_SUFFIX_ITEMS = ":items"
    
    def __init__(self, cache_manager: CacheManager):
        """
        Initialize service.
        
        Args:
            cache_manager: Cache manager instance
        """
        self.cache_manager = cache_manager
    
    def invalidate_order(self, order_id: OrderId) -> None:
        """
        Invalidate order cache.
        
        Args:
            order_id: Order ID
        """
        full_key = f"{self.ORDER_CACHE_PREFIX}{order_id.value}{self.CACHE_KEY_SUFFIX_FULL}"
        items_key = f"{self.ORDER_CACHE_PREFIX}{order_id.value}{self.CACHE_KEY_SUFFIX_ITEMS}"
        
        self.cache_manager.evict(full_key)
        self.cache_manager.evict(items_key)
    
    def invalidate_all_orders(self) -> None:
        """Invalidate all order caches (use with caution)."""
        self.cache_manager.clear_pattern(f"{self.ORDER_CACHE_PREFIX}*")
    
    def invalidate_user_profile(self, user_id: str) -> None:
        """
        Invalidate user profile cache.
        
        Args:
            user_id: User ID
        """
        key = f"{self.USER_CACHE_PREFIX}{user_id}:profile"
        self.cache_manager.evict(key)
    
    def invalidate_all(self) -> None:
        """Invalidate all caches (emergency use only)."""
        self.cache_manager.clear_all()
