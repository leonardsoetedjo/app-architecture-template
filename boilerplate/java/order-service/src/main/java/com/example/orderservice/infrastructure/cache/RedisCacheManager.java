package com.example.orderservice.infrastructure.cache;

import com.example.orderservice.domain.ports.CacheException;
import com.example.orderservice.domain.ports.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis implementation of CacheManager.
 * 
 * Uses Spring Data Redis for cache operations.
 * Default TTL: 30 minutes for most cache entries.
 */
@Component
public class RedisCacheManager implements CacheManager {
    
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(30);
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    public RedisCacheManager(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return Optional.empty();
            }
            if (type.isInstance(value)) {
                return Optional.of((T) value);
            } else {
                throw new CacheException(
                    "Cached value type mismatch. Expected: " + type.getName() + 
                    ", Got: " + (value != null ? value.getClass().getName() : "null")
                );
            }
        } catch (Exception e) {
            throw new CacheException("Failed to get cache key: " + key, e);
        }
    }
    
    @Override
    public <T> void put(String key, T value) {
        put(key, value, DEFAULT_TTL);
    }
    
    @Override
    public <T> void put(String key, T value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl.toMillis(), TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            throw new CacheException("Failed to put cache key: " + key, e);
        }
    }
    
    @Override
    public void evict(String key) {
        try {
            Boolean deleted = redisTemplate.delete(key);
            if (Boolean.FALSE.equals(deleted)) {
                // Key didn't exist - this is OK, no-op
            }
        } catch (Exception e) {
            throw new CacheException("Failed to evict cache key: " + key, e);
        }
    }
    
    @Override
    public boolean contains(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            throw new CacheException("Failed to check cache key existence: " + key, e);
        }
    }
    
    @Override
    public void clearPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            throw new CacheException("Failed to clear cache pattern: " + pattern, e);
        }
    }
    
    @Override
    public void clearAll() {
        try {
            Set<String> keys = redisTemplate.keys("*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            throw new CacheException("Failed to clear all cache", e);
        }
    }
}
