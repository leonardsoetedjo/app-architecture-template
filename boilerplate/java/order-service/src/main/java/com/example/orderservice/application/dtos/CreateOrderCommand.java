package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CreateOrderCommand(
    @NotNull UUID customerId,
    @NotEmpty List<OrderItemDTO> items
) {}
