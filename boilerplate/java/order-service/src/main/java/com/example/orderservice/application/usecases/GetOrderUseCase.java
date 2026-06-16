package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.CacheManager;
import com.example.orderservice.domain.models.OrderId;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Get Order Use Case demonstrating Cache-Aside pattern.
 * 
 * Pattern:
 * 1. Check cache first
 * 2. On cache miss → load from database
 * 3. Populate cache with result
 * 4. Return order
 * 
 * This optimizes read-heavy workloads by reducing database queries.
 */
@Component
public class GetOrderUseCase {
    
    private static final String CACHE_KEY_PREFIX = "order-service:order:";
    private static final String CACHE_KEY_SUFFIX = ":full";
    
    private final OrderRepository orderRepository;
    private final CacheManager cacheManager;
    
    public GetOrderUseCase(OrderRepository orderRepository, CacheManager cacheManager) {
        this.orderRepository = orderRepository;
        this.cacheManager = cacheManager;
    }
    
    /**
     * Get order by ID with cache-aside pattern.
     * 
     * @param orderId Order ID
     * @return Order if found
     * @throws OrderNotFoundException if order doesn't exist
     */
    public Order execute(OrderId orderId) {
        String cacheKey = buildCacheKey(orderId);
        
        // Step 1: Check cache first
        Optional<Order> cachedOrder = cacheManager.get(cacheKey, Order.class);
        if (cachedOrder.isPresent()) {
            return cachedOrder.get();
        }
        
        // Step 2: Cache miss - load from database
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        
        // Step 3: Populate cache
        cacheManager.put(cacheKey, order);
        
        // Step 4: Return order
        return order;
    }
    
    /**
     * Invalidate order cache (call after updates).
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
