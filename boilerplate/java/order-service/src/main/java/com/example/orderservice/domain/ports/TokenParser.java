package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.UserId;

import java.util.Optional;

/**
 * Port for parsing and validating authentication tokens.
 */
public interface TokenParser {

    /**
     * Parse a token and extract the user ID.
     *
     * @param token the token string
     * @return the user ID if valid, empty otherwise
     */
    Optional<UserId> parseUserId(String token);

    /**
     * Check if a token is valid and not expired.
     *
     * @param token the token string
     * @return true if the token is valid
     */
    boolean isValid(String token);
}
