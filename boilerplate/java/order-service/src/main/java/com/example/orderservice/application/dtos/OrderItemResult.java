package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.OrderState;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderItemResult(
    UUID productId,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal totalAmount
) {}
