package com.example.orderservice.domain.ports;

import java.time.Duration;
import java.util.Optional;

/**
 * Cache abstraction port for distributed caching.
 * 
 * This interface defines the contract for cache operations,
 * allowing different cache implementations (Redis, Hazelcast, etc.)
 * to be swapped without changing business logic.
 * 
 * Cache Key Naming Convention:
 * {service}:{entity-type}:{identifier}:{field?}
 * 
 * Examples:
 * - "order-service:order:123:full"
 * - "order-service:user:456:profile"
 * - "order-service:permissions:role:admin"
 */
public interface CacheManager {
    
    /**
     * Get value from cache.
     * 
     * @param key Cache key
     * @param type Expected value type
     * @param <T> Value type
     * @return Optional containing cached value or empty if not found
     */
    <T> Optional<T> get(String key, Class<T> type);
    
    /**
     * Put value in cache with default TTL.
     * 
     * @param key Cache key
     * @param value Value to cache
     * @param <T> Value type
     */
    <T> void put(String key, T value);
    
    /**
     * Put value in cache with custom TTL.
     * 
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live
     * @param <T> Value type
     */
    <T> void put(String key, T value, Duration ttl);
    
    /**
     * Remove value from cache.
     * 
     * @param key Cache key
     */
    void evict(String key);
    
    /**
     * Check if key exists in cache.
     * 
     * @param key Cache key
     * @return true if key exists
     */
    boolean contains(String key);
    
    /**
     * Clear all cache entries matching pattern.
     * 
     * @param pattern Key pattern (e.g., "order-service:order:*")
     */
    void clearPattern(String pattern);
    
    /**
     * Clear entire cache (use with caution).
     */
    void clearAll();
}
