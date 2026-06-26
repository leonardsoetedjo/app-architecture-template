package com.example.orderservice.application.dtos;

/**
 * Command to refresh an access token using a refresh token.
 */
public record RefreshTokenCommand(
    String refreshToken
) {}
