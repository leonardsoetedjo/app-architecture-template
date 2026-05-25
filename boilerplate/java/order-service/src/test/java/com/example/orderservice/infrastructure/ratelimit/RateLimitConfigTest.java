package com.example.orderservice.infrastructure.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for rate limiting configuration.
 */
class RateLimitConfigTest {
    
    @Test
    @DisplayName("Auth tier allows 10 requests per minute")
    void authTierAllowsTenRequestsPerMinute() {
        Bandwidth authTier = Bandwidth.builder()
            .capacity(10)
            .refillIntervally(10, Duration.ofMinutes(1))
            .build();
        
        Bucket bucket = Bucket.builder().addLimit(authTier).build();
        
        // Consume all 10 tokens
        for (int i = 0; i < 10; i++) {
            assertTrue(bucket.tryConsume(1), "Should allow request " + (i + 1));
        }
        
        // 11th request should be denied
        assertFalse(bucket.tryConsume(1), "Should deny 11th request");
    }
    
    @Test
    @DisplayName("Default tier allows 100 requests per minute")
    void defaultTierAllowsHundredRequestsPerMinute() {
        Bandwidth defaultTier = Bandwidth.builder()
            .capacity(100)
            .refillIntervally(100, Duration.ofMinutes(1))
            .build();
        
        Bucket bucket = Bucket.builder().addLimit(defaultTier).build();
        
        // Consume all 100 tokens
        for (int i = 0; i < 100; i++) {
            assertTrue(bucket.tryConsume(1), "Should allow request " + (i + 1));
        }
        
        // 101st request should be denied
        assertFalse(bucket.tryConsume(1), "Should deny 101st request");
    }
    
    @Test
    @DisplayName("Export tier allows only 5 requests per minute")
    void exportTierAllowsFiveRequestsPerMinute() {
        Bandwidth exportTier = Bandwidth.builder()
            .capacity(5)
            .refillIntervally(5, Duration.ofMinutes(1))
            .build();
        
        Bucket bucket = Bucket.builder().addLimit(exportTier).build();
        
        // Consume all 5 tokens
        for (int i = 0; i < 5; i++) {
            assertTrue(bucket.tryConsume(1), "Should allow request " + (i + 1));
        }
        
        // 6th request should be denied
        assertFalse(bucket.tryConsume(1), "Should deny 6th request");
    }
    
    @Test
    @DisplayName("Bucket refills after time passes")
    void bucketRefillsAfterTimePasses() throws InterruptedException {
        Bandwidth tier = Bandwidth.builder()
            .capacity(2)
            .refillIntervally(2, Duration.ofSeconds(1))
            .build();
        
        Bucket bucket = Bucket.builder().addLimit(tier).build();
        
        // Consume both tokens
        assertTrue(bucket.tryConsume(1));
        assertTrue(bucket.tryConsume(1));
        assertFalse(bucket.tryConsume(1));
        
        // Wait for refill
        Thread.sleep(1100);
        
        // Should have tokens again
        assertTrue(bucket.tryConsume(1), "Should have refilled token");
    }
}
