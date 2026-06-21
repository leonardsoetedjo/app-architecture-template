"""
Cache abstraction port for distributed caching.

This interface defines the contract for cache operations,
allowing different cache implementations (Redis, etc.)
to be swapped without changing business logic.

Cache Key Naming Convention:
    {service}:{entity-type}:{identifier}:{field?}

Examples:
    - "{{ cookiecutter.project_slug }}:order:123:full"
    - "{{ cookiecutter.project_slug }}:user:456:profile"
    - "{{ cookiecutter.project_slug }}:permissions:role:admin"
"""

from abc import ABC, abstractmethod
from typing import Optional, TypeVar, Generic, Any
from datetime import timedelta


T = TypeVar('T')


class CacheManager(ABC):
    """Abstract cache manager interface."""
    
    @abstractmethod
    def get(self, key: str, type_: type[T]) -> Optional[T]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            type_: Expected value type for deserialization
            
        Returns:
            Cached value or None if not found
        """
        pass
    
    @abstractmethod
    def put(self, key: str, value: Any, ttl: Optional[timedelta] = None) -> None:
        """
        Put value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live (optional, uses default if not provided)
        """
        pass
    
    @abstractmethod
    def evict(self, key: str) -> None:
        """
        Remove value from cache.
        
        Args:
            key: Cache key
        """
        pass
    
    @abstractmethod
    def contains(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists
        """
        pass
    
    @abstractmethod
    def clear_pattern(self, pattern: str) -> None:
        """
        Clear all cache entries matching pattern.
        
        Args:
            pattern: Key pattern (e.g., "{{ cookiecutter.project_slug }}:order:*")
        """
        pass
    
    @abstractmethod
    def clear_all(self) -> None:
        """Clear entire cache (use with caution)."""
        pass


class CacheException(Exception):
    """Exception raised when cache operations fail."""
    pass
