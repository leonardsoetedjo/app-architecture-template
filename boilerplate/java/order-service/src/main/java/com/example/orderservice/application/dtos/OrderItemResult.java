package com.example.orderservice.application.dtos;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(name = "OrderItem", description = "Individual line item within an order")
public record OrderItemResult(
    @Schema(description = "Product UUID", example = "550e8400-e29b-41d4-a716-446655440002")
    UUID productId,

    @Schema(description = "Quantity ordered", example = "2")
    Integer quantity,

    @Schema(description = "Unit price as string (BigDecimal)", example = "19.99")
    BigDecimal unitPrice,

    @Schema(description = "Total line amount as string (BigDecimal)", example = "39.98")
    BigDecimal totalAmount
) {}
