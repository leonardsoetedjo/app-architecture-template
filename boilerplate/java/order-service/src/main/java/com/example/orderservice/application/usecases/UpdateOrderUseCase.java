package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.CacheManager;
import com.example.orderservice.domain.order_id.OrderId;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Update Order Use Case demonstrating Write-Through pattern.
 * 
 * Pattern:
 * 1. Update database
 * 2. Immediately update cache (write-through)
 * 3. Return updated order
 * 
 * This ensures cache consistency with database.
 */
@Component
public class UpdateOrderUseCase {
    
    private static final String CACHE_KEY_PREFIX = "order-service:order:";
    private static final String CACHE_KEY_SUFFIX = ":full";
    
    private final OrderRepository orderRepository;
    private final CacheManager cacheManager;
    
    public UpdateOrderUseCase(OrderRepository orderRepository, CacheManager cacheManager) {
        this.orderRepository = orderRepository;
        this.cacheManager = cacheManager;
    }
    
    /**
     * Update order with write-through caching.
     * 
     * @param orderId Order ID
     * @param items Updated order items
     * @return Updated order
     * @throws OrderNotFoundException if order doesn't exist
     */
    public Order execute(OrderId orderId, List<OrderItem> items) {
        // Step 1: Update database
        Order updatedOrder = orderRepository.update(orderId, items);
        
        // Step 2: Write-through - update cache immediately
        String cacheKey = buildCacheKey(orderId);
        cacheManager.put(cacheKey, updatedOrder);
        
        // Step 3: Return updated order
        return updatedOrder;
    }
    
    /**
     * Cancel order with cache invalidation.
     * 
     * @param orderId Order ID to cancel
     */
    public void cancelOrder(OrderId orderId) {
        // Update database
        orderRepository.cancel(orderId);
        
        // Invalidate cache (don't cache cancelled orders)
        invalidateCache(orderId);
    }
    
    /**
     * Invalidate order cache.
     * 
     * @param orderId Order ID to invalidate
     */
    public void invalidateCache(OrderId orderId) {
        String cacheKey = buildCacheKey(orderId);
        cacheManager.evict(cacheKey);
    }
    
    private String buildCacheKey(OrderId orderId) {
        return CACHE_KEY_PREFIX + orderId.getValue() + CACHE_KEY_SUFFIX;
    }
    
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(OrderId orderId) {
            super("Order not found: " + orderId.getValue());
        }
    }
}
