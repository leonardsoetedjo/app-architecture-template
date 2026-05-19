package com.example.orderservice.application.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OrderResult(UUID orderId, String status, OffsetDateTime createdAt) {}
