package com.example.common.infrastructure.http;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.UUID;

/**
 * Client for external system communication with circuit breaker and retry.
 */
@Service
public class ExternalServiceClient {

    private static final Logger LOG = LoggerFactory.getLogger(ExternalServiceClient.class);

    private final WebClient webClient;

    public ExternalServiceClient(WebClient webClient) {
        this.webClient = webClient;
    }

    @CircuitBreaker(name = "externalApi", fallbackMethod = "fallbackCall")
    @Retry(name = "externalApiRetry", fallbackMethod = "retryFallbackCall")
    public String callExternalSystem(String endpoint, String requestBody) {
        String traceId = org.slf4j.MDC.get("traceId");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
        }

        LOG.info("Calling external system: {} with traceId: {}", endpoint, traceId);

        try {
            return webClient.post()
                    .uri(endpoint)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", traceId)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (WebClientResponseException e) {
            LOG.error("WebClientResponseException calling {}: {}", endpoint, e.getResponseBodyAsString(), e);
            throw e;
        } catch (Exception e) {
            LOG.error("Exception calling {}: {}", endpoint, e.getMessage(), e);
            throw e;
        }
    }

    public String fallbackCall(String endpoint, String requestBody, Throwable t) {
        LOG.warn("Circuit breaker OPEN for external API. Using fallback for: {}", endpoint);
        return "{}";
    }

    public String retryFallbackCall(String endpoint, String requestBody, Throwable t) {
        LOG.warn("Retry exhausted for external API. Using fallback for: {}", endpoint);
        return "{}";
    }
}
