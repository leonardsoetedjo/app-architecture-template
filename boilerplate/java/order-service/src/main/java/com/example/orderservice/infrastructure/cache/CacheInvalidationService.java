package com.example.orderservice.infrastructure.cache;

import com.example.orderservice.domain.ports.CacheManager;
import com.example.orderservice.domain.models.OrderId;
import org.springframework.stereotype.Service;

/**
 * Centralized cache invalidation service.
 * 
 * Provides methods to invalidate caches for different entities.
 * Use this service instead of calling CacheManager directly
 * to ensure consistent invalidation patterns.
 */
@Service
public class CacheInvalidationService {
    
    private static final String ORDER_CACHE_PREFIX = "order-service:order:";
    private static final String USER_CACHE_PREFIX = "order-service:user:";
    private static final String CACHE_KEY_SUFFIX_FULL = ":full";
    private static final String CACHE_KEY_SUFFIX_ITEMS = ":items";
    
    private final CacheManager cacheManager;
    
    public CacheInvalidationService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }
    
    /**
     * Invalidate order cache.
     * 
     * @param orderId Order ID
     */
    public void invalidateOrder(OrderId orderId) {
        String fullKey = ORDER_CACHE_PREFIX + orderId.getValue() + CACHE_KEY_SUFFIX_FULL;
        String itemsKey = ORDER_CACHE_PREFIX + orderId.getValue() + CACHE_KEY_SUFFIX_ITEMS;
        
        cacheManager.evict(fullKey);
        cacheManager.evict(itemsKey);
    }
    
    /**
     * Invalidate all order caches (use with caution).
     */
    public void invalidateAllOrders() {
        cacheManager.clearPattern(ORDER_CACHE_PREFIX + "*");
    }
    
    /**
     * Invalidate user profile cache.
     * 
     * @param userId User ID
     */
    public void invalidateUserProfile(String userId) {
        String key = USER_CACHE_PREFIX + userId + ":profile";
        cacheManager.evict(key);
    }
    
    /**
     * Invalidate all caches (emergency use only).
     */
    public void invalidateAll() {
        cacheManager.clearAll();
    }
}
