package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.Role;

import java.time.OffsetDateTime;
import java.util.Set;

public record UserProfileResult(
    String userId,
    String email,
    Set<Role> roles,
    boolean enabled,
    OffsetDateTime createdAt,
    OffsetDateTime lastLoginAt
) {}
