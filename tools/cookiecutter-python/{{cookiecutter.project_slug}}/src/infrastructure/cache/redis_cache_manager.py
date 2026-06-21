"""
Redis implementation of CacheManager.

Uses redis-py (async) for cache operations.
Default TTL: 30 minutes for most cache entries.
"""

import json
from typing import Any, Optional, Type
from datetime import timedelta
from domain.ports.cache_manager import CacheManager, CacheException


class RedisCacheManager(CacheManager):
    """Redis-based cache manager implementation."""
    
    DEFAULT_TTL = timedelta(minutes=30)
    
    def __init__(self, redis_client: Any):
        """
        Initialize Redis cache manager.
        
        Args:
            redis_client: Redis async client instance
        """
        self.redis = redis_client
    
    def get(self, key: str, type_: Type) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = self.redis.get(key)
            if value is None:
                return None
            
            # Deserialize JSON
            deserialized = json.loads(value)
            
            # Type checking is best-effort in Python
            return deserialized
        except Exception as e:
            raise CacheException(f"Failed to get cache key: {key}") from e
    
    def put(self, key: str, value: Any, ttl: Optional[timedelta] = None) -> None:
        """Put value in cache with optional TTL."""
        try:
            ttl_seconds = int((ttl or self.DEFAULT_TTL).total_seconds())
            serialized = json.dumps(value)
            self.redis.set(key, serialized, ex=ttl_seconds)
        except Exception as e:
            raise CacheException(f"Failed to put cache key: {key}") from e
    
    def evict(self, key: str) -> None:
        """Remove value from cache."""
        try:
            self.redis.delete(key)
        except Exception as e:
            raise CacheException(f"Failed to evict cache key: {key}") from e
    
    def contains(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return self.redis.exists(key) > 0
        except Exception as e:
            raise CacheException(f"Failed to check cache key existence: {key}") from e
    
    def clear_pattern(self, pattern: str) -> None:
        """Clear all cache entries matching pattern."""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
        except Exception as e:
            raise CacheException(f"Failed to clear cache pattern: {pattern}") from e
    
    def clear_all(self) -> None:
        """Clear entire cache."""
        try:
            self.redis.flushdb()
        except Exception as e:
            raise CacheException("Failed to clear all cache") from e


def create_redis_client(host: str = "redis", port: int = 6379, db: int = 0) -> Any:
    """
    Create Redis client instance.
    
    Args:
        host: Redis hostname (default: "redis" for Docker network)
        port: Redis port (default: 6379)
        db: Redis database number (default: 0)
        
    Returns:
        Redis client instance
    """
    import redis
    
    return redis.Redis(
        host=host,
        port=port,
        db=db,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
