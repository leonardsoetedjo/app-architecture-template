"""
Redis Cache Layer Implementation

Provides a clean abstraction over Redis for caching domain data.
Implements cache-aside pattern with automatic serialization.

Usage:
    from infrastructure.cache.redis_cache import RedisCache
    
    cache = RedisCache("redis://localhost:6379")
    await cache.set("user:123", user_data, ttl=3600)
    user = await cache.get("user:123", User)
"""

import json
from typing import TypeVar, Generic, Type, Optional, Any
from dataclasses import dataclass, asdict
from datetime import timedelta
import redis.asyncio as redis

T = TypeVar('T')


@dataclass
class CacheEntry(Generic[T]):
    """Wrapper for cached data with metadata."""
    value: T
    key: str
    ttl: Optional[int] = None


class CacheError(Exception):
    """Base exception for cache operations."""
    pass


class CacheSerializationError(CacheError):
    """Raised when serialization/deserialization fails."""
    pass


class RedisCache:
    """
    Redis cache implementation with cache-aside pattern.
    
    Features:
    - Automatic JSON serialization/deserialization
    - Type-safe get operations
    - TTL support
    - Cache-aside pattern helpers
    - Graceful degradation on Redis failures
    
    Example:
        cache = RedisCache("redis://localhost:6379")
        
        # Set with TTL
        await cache.set("order:123", order_dict, ttl=3600)
        
        # Get with type
        order = await cache.get("order:123", Order)
        
        # Cache-aside pattern
        order = await cache.get_or_set(
            "order:123",
            lambda: fetch_order_from_db(123),
            ttl=3600
        )
    """
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        default_ttl: int = 3600,
        key_prefix: str = "cache",
    ):
        """
        Initialize Redis cache.
        
        Args:
            redis_url: Redis connection URL
            default_ttl: Default TTL in seconds (1 hour)
            key_prefix: Prefix for all cache keys
        """
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.key_prefix = key_prefix
        self._redis: Optional[redis.Redis] = None
    
    async def get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )
            except redis.RedisError as e:
                raise CacheError(f"Failed to connect to Redis: {e}")
        return self._redis
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self.key_prefix}:{key}"
    
    def _serialize(self, value: Any) -> str:
        """
        Serialize value to JSON string.
        
        Handles dataclasses, dicts, lists, and primitives.
        """
        try:
            if hasattr(value, '__dataclass_fields__'):
                value = asdict(value)
            return json.dumps(value, default=str)
        except (TypeError, ValueError) as e:
            raise CacheSerializationError(f"Failed to serialize value: {e}")
    
    def _deserialize(self, data: Optional[str], type_hint: Optional[Type[T]] = None) -> Optional[T]:
        """
        Deserialize JSON string to value.
        
        Args:
            data: JSON string to deserialize
            type_hint: Optional type hint for the expected type
            
        Returns:
            Deserialized value or None if data is None
        """
        if data is None:
            return None
        
        try:
            value = json.loads(data)
            
            # If type hint is provided and it's a dataclass, reconstruct it
            if type_hint and hasattr(type_hint, '__dataclass_fields__'):
                if isinstance(value, dict):
                    return type_hint(**value)  # type: ignore
            
            return value
        except (json.JSONDecodeError, TypeError, KeyError) as e:
            raise CacheSerializationError(f"Failed to deserialize value: {e}")
    
    async def get(self, key: str, type_hint: Optional[Type[T]] = None) -> Optional[T]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            type_hint: Optional type hint for deserialization
            
        Returns:
            Cached value or None if not found
        """
        try:
            redis_client = await self.get_redis()
            full_key = self._make_key(key)
            data = await redis_client.get(full_key)
            return self._deserialize(data, type_hint)
        except redis.RedisError as e:
            # Graceful degradation - log error and return None
            print(f"Cache get error: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not specified)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            full_key = self._make_key(key)
            serialized = self._serialize(value)
            effective_ttl = ttl or self.default_ttl
            
            await redis_client.setex(full_key, effective_ttl, serialized)
            return True
        except (redis.RedisError, CacheSerializationError) as e:
            print(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if key existed and was deleted, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            full_key = self._make_key(key)
            result = await redis_client.delete(full_key)
            return result > 0
        except redis.RedisError as e:
            print(f"Cache delete error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            full_key = self._make_key(key)
            result = await redis_client.exists(full_key)
            return result > 0
        except redis.RedisError as e:
            print(f"Cache exists error: {e}")
            return False
    
    async def get_or_set(
        self,
        key: str,
        factory: callable,
        ttl: Optional[int] = None,
    ) -> Any:
        """
        Get value from cache or set it using factory function.
        
        Implements cache-aside pattern.
        
        Args:
            key: Cache key
            factory: Async function to call if key not in cache
            ttl: Time-to-live in seconds
            
        Returns:
            Cached value or value from factory
        """
        # Try to get from cache
        value = await self.get(key)
        if value is not None:
            return value
        
        # Cache miss - call factory
        value = await factory()
        
        # Set in cache
        await self.set(key, value, ttl)
        
        return value
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.
        
        Args:
            pattern: Key pattern (e.g., "user:*")
            
        Returns:
            Number of keys deleted
        """
        try:
            redis_client = await self.get_redis()
            full_pattern = self._make_key(pattern)
            keys = []
            
            async for key in redis_client.scan_iter(match=full_pattern):
                keys.append(key)
            
            if keys:
                return await redis_client.delete(*keys)
            return 0
        except redis.RedisError as e:
            print(f"Cache invalidate pattern error: {e}")
            return 0
    
    async def clear_all(self) -> bool:
        """
        Clear all cache entries with current prefix.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            redis_client = await self.get_redis()
            pattern = f"{self.key_prefix}:*"
            keys = []
            
            async for key in redis_client.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                await redis_client.delete(*keys)
            return True
        except redis.RedisError as e:
            print(f"Cache clear error: {e}")
            return False


# Convenience functions for common caching scenarios
async def cache_user(cache: RedisCache, user_id: str, user_data: dict, ttl: int = 3600) -> bool:
    """Cache user data."""
    return await cache.set(f"user:{user_id}", user_data, ttl)


async def get_cached_user(cache: RedisCache, user_id: str) -> Optional[dict]:
    """Get cached user data."""
    return await cache.get(f"user:{user_id}")


async def cache_order(cache: RedisCache, order_id: str, order_data: dict, ttl: int = 1800) -> bool:
    """Cache order data."""
    return await cache.set(f"order:{order_id}", order_data, ttl)


async def get_cached_order(cache: RedisCache, order_id: str) -> Optional[dict]:
    """Get cached order data."""
    return await cache.get(f"order:{order_id}")


async def invalidate_user_cache(cache: RedisCache, user_id: str) -> bool:
    """Invalidate user cache."""
    return await cache.delete(f"user:{user_id}")


async def invalidate_order_cache(cache: RedisCache, order_id: str) -> bool:
    """Invalidate order cache."""
    return await cache.delete(f"order:{order_id}")
