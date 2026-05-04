package com.example.common.infrastructure.http;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.util.UUID;

/**
 * Client for external system communication with mTLS support, circuit breaker, and retry.
 *
 * Features:
 * - mTLS client certificate authentication
 * - Circuit breaker (Resilience4j) for fault tolerance
 * - Retry with exponential backoff for transient failures
 * - Correlation ID propagation for distributed tracing
 *
 * Example usage:
 * ```java
 * // In a service class
 * @Service
 * public class OrderService {
 *     private final ExternalServiceClient externalClient;
 *
 *     public OrderService(ExternalServiceClient externalClient) {
 *         this.externalClient = externalClient;
 *     }
 *
 *     public void placeOrder(Order order) {
 *         // Call external system with circuit breaker and retry
 *         externalClient.callExternalSystem("order-placement", order);
 *     }
 * }
 * ```
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalServiceClient {

    private final WebClient webClient;
    private final MTLSConfiguration mTLSConfiguration;

    /**
     * Call external system with circuit breaker and retry.
     *
     * @param endpoint The endpoint path to call
     * @param request The request body
     * @param <T> The request type
     * @return The response body
     */
    @CircuitBreaker(name = "externalApi", fallbackMethod = "fallbackCall")
    @Retry(name = "externalApiRetry", fallbackMethod = "retryFallbackCall")
    public <T> T callExternalSystem(String endpoint, T request, Class<T> responseType) {
        String traceId = org.slf4j.MDC.get("traceId");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
            org.slf4j.MDC.put("traceId", traceId);
        }

        log.info("Calling external system: {} with traceId: {}", endpoint, traceId);

        try {
            T response = webClient.post()
                    .uri(endpoint)
                    .headers(headers -> headers.setBearerAuth(getAuthToken()))
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", traceId)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, response -> {
                        log.warn("4xx error from external system: {}", response.statusCode());
                        return Mono.empty();
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, response -> {
                        log.warn("5xx error from external system: {}", response.statusCode());
                        return Mono.empty();
                    })
                    .bodyToMono(responseType)
                    .block();

            log.info("Successfully called external system: {} with traceId: {}", endpoint, traceId);
            return response;
        } catch (WebClientResponseException e) {
            log.error("WebClientResponseException calling {}: {}", endpoint, e.getResponseBodyAsString(), e);
            throw e;
        } catch (Exception e) {
            log.error("Exception calling {}: {}", endpoint, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Fallback method when circuit breaker is open.
     */
    public <T> T fallbackCall(String endpoint, T request, Class<T> responseType, Throwable t) {
        log.warn("Circuit breaker OPEN for external API. Using fallback for: {}", endpoint);
        return createFallbackResponse(responseType);
    }

    /**
     * Fallback method when retry is exhausted.
     */
    public <T> T retryFallbackCall(String endpoint, T request, Class<T> responseType, Throwable t) {
        log.warn("Retry exhausted for external API. Using fallback for: {}", endpoint);
        return createFallbackResponse(responseType);
    }

    /**
     * Create a fallback response when the external system is unavailable.
     */
    private <T> T createFallbackResponse(Class<T> responseType) {
        try {
            return responseType.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            log.error("Failed to create fallback response", e);
            return null;
        }
    }

    /**
     * Get authentication token for external API calls.
     * In production, this would fetch from a secure token service.
     */
    private String getAuthToken() {
        String token = System.getenv("EXTERNAL_API_AUTH_TOKEN");
        if (token == null) {
            log.warn("EXTERNAL_API_AUTH_TOKEN not set, using placeholder");
            return "placeholder-token";
        }
        return token;
    }
}
