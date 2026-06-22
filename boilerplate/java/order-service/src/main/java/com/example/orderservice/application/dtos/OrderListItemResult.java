package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.OrderState;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderListItemResult(
    UUID orderId,
    UUID customerId,
    OrderState status,
    BigDecimal totalAmount,
    OffsetDateTime createdAt,
    int itemCount
) {}
