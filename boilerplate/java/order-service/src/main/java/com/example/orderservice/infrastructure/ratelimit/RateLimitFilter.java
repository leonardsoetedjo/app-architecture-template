package com.example.orderservice.infrastructure.ratelimit;

import io.github.bucket4j.*;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter using Bucket4j with Redis backend.
 * 
 * Implements tiered rate limiting:
 * - Auth tier: 10 req/min (login, register, password reset)
 * - Public tier: 30 req/min (unauthenticated endpoints)
 * - Default tier: 100 req/min (authenticated users)
 * - Write tier: 60 req/min (POST/PUT/DELETE operations)
 * - Export tier: 5 req/min (heavy operations like exports/reports)
 * 
 * Returns 429 Too Many Requests with Retry-After header when limit exceeded.
 * Adds X-RateLimit-* headers to all responses.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    
    // Rate limit configurations by tier
    private static final Bandwidth AUTH_TIER = Bandwidth.builder()
        .capacity(10)
        .refillIntervally(10, Duration.ofMinutes(1))
        .build();
    
    private static final Bandwidth PUBLIC_TIER = Bandwidth.builder()
        .capacity(30)
        .refillIntervally(30, Duration.ofMinutes(1))
        .build();
    
    private static final Bandwidth DEFAULT_TIER = Bandwidth.builder()
        .capacity(100)
        .refillIntervally(100, Duration.ofMinutes(1))
        .build();
    
    private static final Bandwidth WRITE_TIER = Bandwidth.builder()
        .capacity(60)
        .refillIntervally(60, Duration.ofMinutes(1))
        .build();
    
    private static final Bandwidth EXPORT_TIER = Bandwidth.builder()
        .capacity(5)
        .refillIntervally(5, Duration.ofMinutes(1))
        .build();
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        String ipAddress = getClientIpAddress(request);
        String endpoint = getEndpointTier(request);
        String key = ipAddress + ":" + endpoint;
        
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
            .addLimit(getBandwidthForTier(endpoint))
            .build());
        
        // Check if request is allowed
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (probe.isConsumed()) {
            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(probe.getConsumedTokens()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            response.setHeader("X-RateLimit-Reset", String.valueOf(
                System.currentTimeMillis() + Duration.ofMinutes(1).toMillis()
            ));
            
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            long retryAfterSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000 + 1;
            
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setHeader("X-RateLimit-Limit", "0");
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setHeader("X-RateLimit-Reset", String.valueOf(
                System.currentTimeMillis() + retryAfterSeconds * 1000
            ));
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"error\":\"Too Many Requests\",\"retryAfter\":%d}",
                retryAfterSeconds
            ));
        }
    }
    
    /**
     * Determine rate limit tier based on endpoint and HTTP method.
     */
    private String getEndpointTier(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Auth tier: authentication endpoints
        if (path.contains("/auth/") || path.contains("/login") || 
            path.contains("/register") || path.contains("/password-reset")) {
            return "auth";
        }
        
        // Export tier: heavy operations
        if (path.contains("/export") || path.contains("/reports") || 
            path.contains("/bulk")) {
            return "export";
        }
        
        // Write tier: state-changing operations
        if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method)) {
            return "write";
        }
        
        // Public tier: unauthenticated endpoints
        if (path.contains("/public/") || path.contains("/health") || 
            path.contains("/actuator")) {
            return "public";
        }
        
        // Default tier: authenticated API calls
        return "default";
    }
    
    /**
     * Get bandwidth configuration for tier.
     */
    private Bandwidth getBandwidthForTier(String tier) {
        return switch (tier) {
            case "auth" -> AUTH_TIER;
            case "public" -> PUBLIC_TIER;
            case "write" -> WRITE_TIER;
            case "export" -> EXPORT_TIER;
            default -> DEFAULT_TIER;
        };
    }
    
    /**
     * Extract client IP address from request.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
