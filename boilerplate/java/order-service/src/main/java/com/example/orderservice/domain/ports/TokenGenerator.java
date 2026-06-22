package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.User;

/**
 * Port for generating authentication tokens.
 * Domain defines the contract; infrastructure provides JWT/opaque implementations.
 */
public interface TokenGenerator {

    /**
     * Generate an access token for the given user.
     *
     * @param user the authenticated user
     * @return the access token string
     */
    String generateAccessToken(User user);

    /**
     * Generate a refresh token for the given user.
     *
     * @param user the authenticated user
     * @return the refresh token string
     */
    String generateRefreshToken(User user);
}
