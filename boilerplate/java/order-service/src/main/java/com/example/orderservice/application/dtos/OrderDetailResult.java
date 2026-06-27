package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.OrderState;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Schema(name = "OrderDetail", description = "Complete order details with line items")
public record OrderDetailResult(
    @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID orderId,

    @Schema(description = "Customer UUID", example = "550e8400-e29b-41d4-a716-446655440001")
    UUID customerId,

    @Schema(description = "Current order status", example = "PENDING")
    OrderState status,

    @Schema(description = "Line items in this order")
    List<OrderItemResult> items,

    @Schema(description = "Total order amount as string (BigDecimal)", example = "1000.99")
    BigDecimal totalAmount,

    @Schema(description = "When order was created", example = "2026-01-15T10:30:00+01:00")
    OffsetDateTime createdAt,

    @Schema(description = "When order was confirmed, or null", example = "2026-01-15T11:00:00+01:00")
    OffsetDateTime confirmedAt,

    @Schema(description = "Whether the order is soft-deleted", example = "false")
    boolean isDeleted
) {}
