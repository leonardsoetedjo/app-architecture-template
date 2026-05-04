package com.example.orderservice.application.dtos;

import java.util.*;
import java.time.OffsetDateTime;

public record CreateOrderCommand(UUID customerId, List<OrderItemDTO> items) {}

public record OrderItemDTO(UUID productId, int quantity, double unitPrice) {}

public record OrderResult(UUID orderId, String status, OffsetDateTime createdAt) {}
