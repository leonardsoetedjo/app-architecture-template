"""
Integration tests for RedisCacheManager with Testcontainers.
"""

import pytest
from datetime import timedelta
from testcontainers.redis import RedisContainer

from infrastructure.cache.redis_cache_manager import RedisCacheManager, create_redis_client
from domain.ports.cache_manager import CacheException


@pytest.fixture(scope="module")
def redis_container():
    """Start Redis container for tests."""
    with RedisContainer("redis:7-alpine") as redis:
        yield redis


@pytest.fixture
def cache_manager(redis_container: RedisContainer):
    """Create cache manager instance."""
    redis_client = redis_container.get_client()
    return RedisCacheManager(redis_client)


class TestRedisCacheManagerIntegration:
    """Integration tests for RedisCacheManager."""
    
    def test_put_and_get(self, cache_manager: RedisCacheManager):
        """Should put and get value from cache."""
        # Arrange
        key = "test:key"
        value = "test-value"
        
        # Act
        cache_manager.put(key, value)
        result = cache_manager.get(key, str)
        
        # Assert
        assert result == value
    
    def test_get_non_existent(self, cache_manager: RedisCacheManager):
        """Should return None for non-existent key."""
        # Act
        result = cache_manager.get("non-existent", str)
        
        # Assert
        assert result is None
    
    def test_put_with_custom_ttl(self, cache_manager: RedisCacheManager):
        """Should respect custom TTL."""
        # Arrange
        key = "test:ttl"
        value = "ttl-value"
        ttl = timedelta(seconds=2)
        
        # Act
        cache_manager.put(key, value, ttl)
        
        # Assert: Initially present
        assert cache_manager.get(key, str) == value
        
        # Wait for TTL to expire
        import time
        time.sleep(2.5)
        
        # Assert: Expired
        assert cache_manager.get(key, str) is None
    
    def test_evict(self, cache_manager: RedisCacheManager):
        """Should evict key from cache."""
        # Arrange
        key = "test:evict"
        cache_manager.put(key, "value")
        
        # Act
        cache_manager.evict(key)
        
        # Assert
        assert cache_manager.get(key, str) is None
    
    def test_contains(self, cache_manager: RedisCacheManager):
        """Should check if key exists."""
        # Arrange
        key = "test:exists"
        cache_manager.put(key, "value")
        
        # Act & Assert
        assert cache_manager.contains(key) is True
        assert cache_manager.contains("non-existent") is False
    
    def test_clear_pattern(self, cache_manager: RedisCacheManager):
        """Should clear pattern."""
        # Arrange
        cache_manager.put("order:1:full", "order1")
        cache_manager.put("order:2:full", "order2")
        cache_manager.put("user:1:profile", "user1")
        
        # Act
        cache_manager.clear_pattern("order:*")
        
        # Assert
        assert cache_manager.get("order:1:full", str) is None
        assert cache_manager.get("order:2:full", str) is None
        assert cache_manager.get("user:1:profile", str) == "user1"
    
    def test_clear_all(self, cache_manager: RedisCacheManager):
        """Should clear all cache."""
        # Arrange
        cache_manager.put("key1", "value1")
        cache_manager.put("key2", "value2")
        
        # Act
        cache_manager.clear_all()
        
        # Assert
        assert cache_manager.get("key1", str) is None
        assert cache_manager.get("key2", str) is None
    
    def test_handle_complex_objects(self, cache_manager: RedisCacheManager):
        """Should handle complex objects (dict)."""
        # Arrange
        obj = {
            "id": "id-123",
            "name": "Test Object",
            "value": 42,
            "nested": {"key": "value"}
        }
        key = "test:object"
        
        # Act
        cache_manager.put(key, obj)
        result = cache_manager.get(key, dict)
        
        # Assert
        assert result is not None
        assert result["id"] == "id-123"
        assert result["name"] == "Test Object"
        assert result["value"] == 42
        assert result["nested"]["key"] == "value"
    
    def test_cache_exception_on_error(self):
        """Should raise CacheException on connection error."""
        # Arrange: Create manager with invalid Redis
        bad_client = create_redis_client(host="invalid-host", port=9999)
        cache_manager = RedisCacheManager(bad_client)
        
        # Act & Assert
        with pytest.raises(CacheException):
            cache_manager.put("key", "value")


class TestCacheInvalidationServiceIntegration:
    """Integration tests for CacheInvalidationService."""
    
    @pytest.fixture
    def invalidation_service(self, cache_manager: RedisCacheManager):
        from infrastructure.cache.cache_invalidation_service import CacheInvalidationService
        return CacheInvalidationService(cache_manager)
    
    def test_invalidate_order(self, invalidation_service, cache_manager: RedisCacheManager):
        """Should invalidate order cache."""
        # Arrange
        from domain.order_id import OrderId
        order_id = OrderId("test-123")
        cache_manager.put("{{ cookiecutter.project_slug }}:order:test-123:full", "order-data")
        
        # Act
        invalidation_service.invalidate_order(order_id)
        
        # Assert
        assert cache_manager.get("{{ cookiecutter.project_slug }}:order:test-123:full", str) is None
    
    def test_invalidate_all_orders(self, invalidation_service, cache_manager: RedisCacheManager):
        """Should invalidate all orders."""
        # Arrange
        cache_manager.put("{{ cookiecutter.project_slug }}:order:1:full", "order1")
        cache_manager.put("{{ cookiecutter.project_slug }}:order:2:full", "order2")
        
        # Act
        invalidation_service.invalidate_all_orders()
        
        # Assert
        assert cache_manager.get("{{ cookiecutter.project_slug }}:order:1:full", str) is None
        assert cache_manager.get("{{ cookiecutter.project_slug }}:order:2:full", str) is None
