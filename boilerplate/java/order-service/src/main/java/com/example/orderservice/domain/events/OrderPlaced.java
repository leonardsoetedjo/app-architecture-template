package com.example.orderservice.domain.events;

import com.example.orderservice.domain.models.OrderId;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Domain event published when an order is successfully placed.
 * 
 * This event is used to notify other parts of the system
 * (inventory, billing, shipping) that a new order was created.
 */
public class OrderPlaced extends DomainEvent {
    
    private final OrderId orderId;
    private final UUID customerId;
    private final List<OrderItemEventData> items;
    private final BigDecimal totalAmount;
    
    public OrderPlaced(OrderId orderId, UUID customerId, List<OrderItemEventData> items, BigDecimal totalAmount) {
        super("OrderPlaced");
        this.orderId = orderId;
        this.customerId = customerId;
        this.items = List.copyOf(items);
        this.totalAmount = totalAmount;
    }
    
    @Override
    public UUID getAggregateId() {
        return orderId.getValue();
    }
    
    public OrderId getOrderId() {
        return orderId;
    }
    
    public UUID getCustomerId() {
        return customerId;
    }
    
    public List<OrderItemEventData> getItems() {
        return items;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    /**
     * Immutable event data for order items.
     * Keeps only the data needed by event consumers.
     */
    public record OrderItemEventData(
        UUID productId,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount
    ) {}
}
