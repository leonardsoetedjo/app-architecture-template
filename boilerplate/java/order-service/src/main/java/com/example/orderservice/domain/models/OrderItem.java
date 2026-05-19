package com.example.orderservice.domain.models;

import java.util.UUID;

public record OrderItem(UUID productId, int quantity, double unitPrice) {}
