package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.example.orderservice.domain.models.OrderState;

public record UpdateOrderStatusCommand(
    @NotNull(message = "status is required")
    OrderState status
) {}
