package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.OrderState;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderDetailResult(
    UUID orderId,
    UUID customerId,
    OrderState status,
    List<OrderItemResult> items,
    BigDecimal totalAmount,
    OffsetDateTime createdAt,
    OffsetDateTime confirmedAt,
    boolean isDeleted
) {}
