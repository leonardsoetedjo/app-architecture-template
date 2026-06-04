package com.example.orderservice.domain.models;

import java.math.BigDecimal;
import java.util.UUID;

public class OrderItem {
    private final UUID productId;
    private final Integer quantity;
    private final BigDecimal unitPrice;

    public OrderItem(UUID productId, Integer quantity, BigDecimal unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public UUID getProductId() {
        return productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getTotalAmount() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
