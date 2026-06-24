package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderCommand(
    @NotEmpty List<OrderItemDTO> items
) {}
