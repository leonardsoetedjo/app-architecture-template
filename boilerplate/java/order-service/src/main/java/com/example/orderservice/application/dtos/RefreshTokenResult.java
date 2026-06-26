package com.example.orderservice.application.dtos;

import java.util.Set;

/**
 * Result of a successful token refresh.
 */
public record RefreshTokenResult(
    String accessToken,
    String refreshToken,
    String email,
    Set<String> roles,
    String tokenType
) {}
