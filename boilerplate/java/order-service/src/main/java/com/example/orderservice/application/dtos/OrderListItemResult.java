package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.OrderState;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Schema(name = "OrderListItem", description = "Summary view of an order for list/pagination endpoints")
public record OrderListItemResult(
    @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID orderId,

    @Schema(description = "Customer UUID", example = "550e8400-e29b-41d4-a716-446655440001")
    UUID customerId,

    @Schema(description = "Current order status", example = "PENDING")
    OrderState status,

    @Schema(description = "Total order amount as string (BigDecimal)", example = "1000.99")
    BigDecimal totalAmount,

    @Schema(description = "When order was created", example = "2026-01-15T10:30:00+01:00")
    OffsetDateTime createdAt,

    @Schema(description = "Number of line items", example = "3")
    int itemCount
) {}
