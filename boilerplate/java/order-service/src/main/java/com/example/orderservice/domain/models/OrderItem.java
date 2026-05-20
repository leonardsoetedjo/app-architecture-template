package com.example.orderservice.domain.models;

import java.util.UUID;

public class OrderItem {
    private final UUID productId;
    private final int quantity;
    private final double unitPrice;

    public OrderItem(UUID productId, int quantity, double unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public UUID getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public double getUnitPrice() {
        return unitPrice;
    }
}
