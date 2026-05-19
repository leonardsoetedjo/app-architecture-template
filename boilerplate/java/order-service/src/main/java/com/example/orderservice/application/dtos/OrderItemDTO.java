package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.util.UUID;

public record OrderItemDTO(
    @NotNull UUID productId,
    @Min(1) int quantity,
    @Positive double unitPrice
) {}
