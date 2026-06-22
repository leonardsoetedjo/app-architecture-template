package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.Role;

import java.util.Set;

public record LoginResult(
    String accessToken,
    String refreshToken,
    String email,
    Set<Role> roles,
    String tokenType
) {}
