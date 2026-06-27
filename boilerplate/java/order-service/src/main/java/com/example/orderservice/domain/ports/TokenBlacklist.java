package com.example.orderservice.domain.ports;

/**
 * Port for token blacklisting / revocation.
 * Used during logout to invalidate tokens before their natural expiry.
 */
public interface TokenBlacklist {

    /**
     * Add a token to the blacklist.
     *
     * @param token the token to blacklist
     * @param ttlSeconds time-to-live in seconds (should match token expiry)
     */
    void blacklist(String token, long ttlSeconds);

    /**
     * Check if a token is blacklisted.
     *
     * @param token the token to check
     * @return true if the token is blacklisted
     */
    boolean isBlacklisted(String token);
}
