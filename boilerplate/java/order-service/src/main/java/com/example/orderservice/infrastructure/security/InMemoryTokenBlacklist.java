package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.ports.TokenBlacklist;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist for development.
 * <p>
 * ⚠️ NOT SUITABLE FOR PRODUCTION — use Redis or similar distributed store
 * in multi-instance deployments to ensure logout is honored across all nodes.
 */
@Component
public class InMemoryTokenBlacklist implements TokenBlacklist {

    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    @Override
    public void blacklist(String token, long ttlSeconds) {
        long expiryTime = System.currentTimeMillis() + (ttlSeconds * 1000);
        blacklist.put(token, expiryTime);
    }

    @Override
    public boolean isBlacklisted(String token) {
        Long expiry = blacklist.get(token);
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            blacklist.remove(token); // Clean up expired entries
            return false;
        }
        return true;
    }
}
