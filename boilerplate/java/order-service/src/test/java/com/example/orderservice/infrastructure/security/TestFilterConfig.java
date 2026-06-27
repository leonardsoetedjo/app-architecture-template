package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.ports.TokenBlacklist;
import com.example.orderservice.domain.ports.TokenParser;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Test configuration that creates a {@link JwtAuthenticationFilter} bean
 * using the mocked {@link TokenParser} and {@link TokenBlacklist} beans
 * declared via {@code @MockBean} in integration tests.
 *
 * This ensures the filter is wired with test-controlled dependencies
 * rather than real production beans.
 */
@TestConfiguration
public class TestFilterConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            TokenParser tokenParser,
            TokenBlacklist tokenBlacklist) {
        return new JwtAuthenticationFilter(tokenParser, tokenBlacklist);
    }
}
