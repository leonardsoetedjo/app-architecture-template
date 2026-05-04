package com.example.common.infrastructure.http;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryRegistry;

/**
 * Resilience4j Registry Configuration.
 *
 * Provides shared CircuitBreakerRegistry and RetryRegistry beans that can be injected
 * into other components for programmatic configuration or monitoring.
 */
@Configuration
@RequiredArgsConstructor
public class ResilienceConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.ofDefaults();
    }

    @Bean
    public RetryRegistry retryRegistry() {
        return RetryRegistry.ofDefaults();
    }
}
