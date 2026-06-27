---
title: "Distributed Caching Layer (Redis)"
type: "Guideline"
created: "2026-06-27"
status: "active"
---
# Distributed Caching Layer (Redis)

**Status**: ✅ **Complete** (2026-05-25)  
**Date**: 2026-05-25  
**Related Issue**: [#72](https://github.com/leonardsoetedjo/app-architecture-template/issues/72)

---

## Implementation Summary

### ✅ Completed Components

**Infrastructure:**
- ✅ Redis service in `docker-compose.yml` (base + standalone)
- ✅ Redis configuration in `docker-compose.standalone.yml` (port 6379)

**Domain Layer:**
- ✅ `CacheManager` port interface (Java + Python)
- ✅ `CacheException` error handling (Java + Python)

**Infrastructure Layer:**
- ✅ `RedisCacheManager` implementation (Java Spring Data Redis)
- ✅ `RedisCacheManager` implementation (Python redis-py)
- ✅ `CacheInvalidationService` centralized service (Java + Python)
- ✅ `RedisConfig` Spring configuration (Java)

**Application Layer:**
- ✅ `GetOrderUseCase` - Cache-aside pattern example (Java + Python)
- ✅ `UpdateOrderUseCase` - Write-through pattern example (Java + Python)

**Configuration:**
- ✅ Java: `application.properties` Redis settings
- ✅ Java: `pom.xml` spring-boot-starter-data-redis dependency
- ✅ Python: `pyproject.toml` redis>=5.0.0 dependency
- ✅ Python: testcontainers[redis] for integration tests

**Tests:**
- ✅ Java: `RedisCacheManagerIntegrationTest` (Testcontainers)
- ✅ Python: `test_redis_cache_integration.py` (Testcontainers)

**Documentation:**
- ✅ `docs/01-agnostic/03-guidelines/caching.md` - Complete guide

---

## Overview

This guide documents the distributed caching layer implementation using Redis for both Java (Spring Boot) and Python (FastAPI) backends.

---

## Architecture

### Cache Abstraction

```
┌─────────────────────────────────────┐
│     Application Layer (Use Cases)   │
│  - GetOrderUseCase (Cache-Aside)    │
│  - UpdateOrderUseCase (Write-Through)│
└──────────────┬──────────────────────┘
               │
               │ Uses
               ▼
┌─────────────────────────────────────┐
│    Domain Layer (Ports)             │
│  - CacheManager interface           │
│  - CacheException                   │
└──────────────┬──────────────────────┘
               │
               │ Implemented By
               ▼
┌─────────────────────────────────────┐
│  Infrastructure Layer (Adapters)    │
│  - RedisCacheManager (Java/Python)  │
│  - RedisConfig                      │
└─────────────────────────────────────┘
```

---

## Cache Key Naming Convention

**Format**: `{service}:{entity-type}:{identifier}:{field?}`

**Examples**:
- `order-service:order:123:full` - Full order object
- `order-service:user:456:profile` - User profile
- `order-service:permissions:role:admin` - Role permissions

**Best Practices**:
1. Always use lowercase
2. Use colons as separators
3. Include service name to avoid collisions
4. Add field suffix for partial objects

---

## Cache Patterns

### 1. Cache-Aside (Lazy Loading)

**Use Case**: Read-heavy workloads where data is frequently accessed but rarely changes.

**Implementation**:
```java
// Java Example
public Order execute(OrderId orderId) {
    String cacheKey = buildCacheKey(orderId);
    
    // Step 1: Check cache
    Optional<Order> cached = cacheManager.get(cacheKey, Order.class);
    if (cached.isPresent()) {
        return cached.get();
    }
    
    // Step 2: Cache miss - load from DB
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new OrderNotFoundException(orderId));
    
    // Step 3: Populate cache
    cacheManager.put(cacheKey, order);
    
    // Step 4: Return
    return order;
}
```

```python
# Python Example
def execute(self, order_id: OrderId) -> Order:
    cache_key = self._build_cache_key(order_id)
    
    # Step 1: Check cache
    cached = self.cache_manager.get(cache_key, Order)
    if cached is not None:
        return cached
    
    # Step 2: Cache miss - load from DB
    order = self.order_repository.find_by_id(order_id)
    if order is None:
        raise OrderNotFoundException(order_id)
    
    # Step 3: Populate cache
    self.cache_manager.put(cache_key, order)
    
    return order
```

**When to Use**:
- ✅ Read-heavy workloads
- ✅ Data changes infrequently
- ✅ Stale data is acceptable temporarily

**When NOT to Use**:
- ❌ Write-heavy workloads
- ❌ Data must be always consistent
- ❌ Real-time data requirements

---

### 2. Write-Through

**Use Case**: Consistency-critical operations where cache must reflect database state immediately.

**Implementation**:
```java
// Java Example
public Order execute(UpdateOrderCommand command) {
    // Step 1: Update database
    Order updated = orderRepository.update(command);
    
    // Step 2: Update cache (write-through)
    String cacheKey = buildCacheKey(updated.getId());
    cacheManager.put(cacheKey, updated, Duration.ofMinutes(5));
    
    return updated;
}
```

**When to Use**:
- ✅ Consistency is critical
- ✅ Read-write ratio is balanced
- ✅ Can afford write latency

---

### 3. Cache Invalidation

**Strategies**:

1. **Time-Based (TTL)**
   ```java
   cacheManager.put(key, value, Duration.ofMinutes(30));
   ```

2. **Event-Based**
   ```java
   // On order update
   getOrderUseCase.invalidateCache(orderId);
   ```

3. **Pattern-Based**
   ```java
   // Clear all order caches
   cacheManager.clearPattern("order-service:order:*");
   ```

---

## Configuration

### Java (Spring Boot)

**Dependencies** (`pom.xml`):
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

**Configuration** (`RedisConfig.java`):
```java
@Configuration
public class RedisConfig {
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory("redis", 6379);
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(
        RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // JSON serialization for values
        template.setValueSerializer(
            new GenericJackson2JsonRedisSerializer()
        );
        template.setKeySerializer(new StringRedisSerializer());
        
        return template;
    }
}
```

### Python (FastAPI)

**Dependencies** (`pyproject.toml`):
```toml
[tool.poetry.dependencies]
redis = "^5.0.0"
```

**Configuration**:
```python
# infrastructure/config/redis_config.py
def create_redis_client() -> redis.Redis:
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True,
    )
```

---

## Docker Compose

**Base Configuration** (`docker-compose.yml`):
```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  redis_data:
```

**Standalone Mode** (`docker-compose.standalone.yml`):
```yaml
services:
  redis:
    ports:
      - "127.0.0.1:6379:6379"
    labels:
      - "traefik.enable=false"
```

---

## Testing

### Java Integration Test

```java
@Testcontainers
@SpringBootTest
class GetOrderUseCaseIntegrationTest {
    
    @Container
    static RedisContainer redis = 
        new RedisContainer("redis:7-alpine");
    
    @Autowired
    private GetOrderUseCase getOrderUseCase;
    
    @Test
    void should_cache_order_on_first_retrieval() {
        // Arrange
        OrderId orderId = OrderId.from("test-123");
        
        // Act: First call (cache miss)
        Order order1 = getOrderUseCase.execute(orderId);
        
        // Act: Second call (cache hit)
        Order order2 = getOrderUseCase.execute(orderId);
        
        // Assert
        assertThat(order1).isEqualTo(order2);
        // Verify cache was populated (mock/spy)
    }
}
```

### Python Integration Test

```python
import pytest
from testcontainers.redis import RedisContainer

@pytest.fixture
def redis_container():
    with RedisContainer("redis:7-alpine") as redis:
        yield redis

def test_cache_aside_pattern(redis_container):
    # Arrange
    redis_client = redis_container.get_client()
    cache_manager = RedisCacheManager(redis_client)
    
    # Act
    cache_manager.put("test:key", {"id": 1})
    result = cache_manager.get("test:key", dict)
    
    # Assert
    assert result == {"id": 1}
```

---

## Performance Tuning

### Redis Configuration

**Memory Management**:
```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**Persistence**:
```bash
# Enable AOF for durability
appendonly yes
appendfsync everysec
```

### Connection Pooling

**Java (Lettuce)**:
```java
LettucePoolingClientConfiguration poolingConfig = LettucePoolingClientConfiguration.builder()
    .poolConfig(GenericObjectPoolConfig.builder()
        .setMaxTotal(8)
        .setMaxIdle(8)
        .setMinIdle(0)
        .build())
    .build();

return new LettuceConnectionFactory(host, port, poolingConfig);
```

**Python**:
```python
redis_pool = redis.ConnectionPool(
    host='redis',
    port=6379,
    db=0,
    max_connections=10,
    decode_responses=True,
)
```

---

## Monitoring

### Key Metrics

1. **Hit Rate**: `cache_hits / (cache_hits + cache_misses)`
   - Target: > 80% for read-heavy workloads

2. **Memory Usage**: `used_memory / maxmemory`
   - Alert: > 90%

3. **Eviction Rate**: Keys evicted per second
   - Alert: Sudden spikes

### Spring Boot Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,redis
  metrics:
    export:
      redis:
        enabled: true
```

---

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
Cause: Redis hostname not resolving in Docker network
Solution: Ensure all services are on same network ('app-network')
```

**2. Serialization Errors**
```
Cause: Complex objects not serializable to JSON
Solution: Use DTOs or custom serializers
```

**3. Cache Stampede**
```
Cause: Many requests hit DB simultaneously on cache expiry
Solution: Use probabilistic early expiration or mutex locks
```

---

## Related Documentation

- **Architecture Standards**: `docs/01-agnostic/01-standards/02-architecture.md`
- **SOP-07**: Add New Use Case
- **Performance Optimization**: `docs/01-agnostic/03-guidelines/performance.md`

---

**Last Updated**: 2026-05-25  
**Owner**: @backend-team
