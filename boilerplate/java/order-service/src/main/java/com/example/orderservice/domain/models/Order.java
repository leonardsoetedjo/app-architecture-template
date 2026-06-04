package com.example.orderservice.domain.models;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class Order {
    private final OrderId id;
    private final UUID customerId;
    private final List<OrderItem> items;
    private final OffsetDateTime createdAt;
    private String status;
    private OffsetDateTime confirmedAt;

    public Order(OrderId id, UUID customerId, List<OrderItem> items, OffsetDateTime createdAt, String status) {
        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID cannot be null");
        }
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }
        this.id = id;
        this.customerId = customerId;
        this.items = new ArrayList<>(items);
        this.createdAt = createdAt;
        this.status = status;
    }

    public static Order create(UUID customerId, List<OrderItem> items) {
        return new Order(
            new OrderId(UUID.randomUUID()),
            customerId,
            items,
            OffsetDateTime.now(),
            "PENDING"
        );
    }

    public OrderId getId() {
        return id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public String getStatus() {
        return status;
    }

    public void confirm() {
        markAsConfirmed();
    }

    public void markAsConfirmed() {
        if (!"PENDING".equals(status)) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }
        this.status = "CONFIRMED";
        this.confirmedAt = OffsetDateTime.now();
    }

    public BigDecimal calculateTotalValue() {
        return items.stream()
            .map(OrderItem::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalAmount() {
        return calculateTotalValue();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order order = (Order) o;
        return id.equals(order.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    @Override
    public String toString() {
        return "Order{"
            + "id=" + id
            + ", customerId=" + customerId
            + ", items=" + items.size()
            + ", createdAt=" + createdAt
            + ", status=" + status
            + '}';
    }
}
