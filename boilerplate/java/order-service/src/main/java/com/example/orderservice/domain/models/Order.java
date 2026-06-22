package com.example.orderservice.domain.models;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Order aggregate root.
 *
 * Invariants:
 * - Order must have at least one item
 * - Status transitions must follow the state machine
 * - Soft-deleted orders are logically invisible but physically retained
 */
public class Order {
    private final OrderId id;
    private final UUID customerId;
    private final List<OrderItem> items;
    private final OffsetDateTime createdAt;
    private OrderState status;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime deletedAt;

    public Order(
            OrderId id,
            UUID customerId,
            List<OrderItem> items,
            OffsetDateTime createdAt,
            OrderState status,
            OffsetDateTime confirmedAt,
            OffsetDateTime deletedAt) {
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
        this.confirmedAt = confirmedAt;
        this.deletedAt = deletedAt;
    }

    public static Order create(UUID customerId, List<OrderItem> items) {
        return new Order(
            OrderId.generate(),
            customerId,
            items,
            OffsetDateTime.now(ZoneOffset.UTC),
            OrderState.PENDING,
            null,
            null
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

    public OrderState getStatus() {
        return status;
    }

    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void confirm() {
        assertCanTransitionTo(OrderState.CONFIRMED);
        this.status = OrderState.CONFIRMED;
        this.confirmedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public void markAsShipped() {
        assertCanTransitionTo(OrderState.SHIPPED);
        this.status = OrderState.SHIPPED;
    }

    public void markAsDelivered() {
        assertCanTransitionTo(OrderState.DELIVERED);
        this.status = OrderState.DELIVERED;
    }

    public void markAsProcessing() {
        assertCanTransitionTo(OrderState.PROCESSING);
        this.status = OrderState.PROCESSING;
    }

    public void markAsCompleted() {
        assertCanTransitionTo(OrderState.COMPLETED);
        this.status = OrderState.COMPLETED;
    }

    public void cancel() {
        if (isDeleted()) {
            throw new IllegalStateException("Cannot cancel a deleted order");
        }
        if (!status.canBeCancelled()) {
            throw new IllegalStateException(
                "Order in state " + status + " cannot be cancelled"
            );
        }
        this.status = OrderState.CANCELLED;
    }

    public void markAsReturned() {
        assertCanTransitionTo(OrderState.RETURNED);
        this.status = OrderState.RETURNED;
    }

    public void markAsRefunded() {
        assertCanTransitionTo(OrderState.REFUNDED);
        this.status = OrderState.REFUNDED;
    }

    public void softDelete() {
        if (isDeleted()) {
            throw new IllegalStateException("Order is already deleted");
        }
        this.deletedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public void restore() {
        if (!isDeleted()) {
            throw new IllegalStateException("Order is not deleted");
        }
        this.deletedAt = null;
    }

    private void assertCanTransitionTo(OrderState target) {
        if (isDeleted()) {
            throw new IllegalStateException("Cannot transition a deleted order");
        }
        if (!status.canTransitionTo(target)) {
            throw new IllegalStateException(
                "Cannot transition from " + status + " to " + target
            );
        }
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
            + ", deleted=" + isDeleted()
            + '}';
    }
}