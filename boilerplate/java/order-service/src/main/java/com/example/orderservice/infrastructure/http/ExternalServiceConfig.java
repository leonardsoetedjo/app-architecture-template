package com.example.orderservice.infrastructure.http;

import com.example.common.infrastructure.http.MTLSConfiguration;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

/**
 * Configuration for external system communication in the order service.
 *
 * This provides service-specific HTTP client configuration that extends the common
 * MTLS and resilience patterns.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ExternalServiceConfig {

    private final MTLSConfiguration mTLSConfiguration;

    /**
     * Create WebClient specifically for order service external API calls.
     *
     * @param sslContext The shared SSL context with mTLS certificates
     * @return WebClient configured for external calls
     */
    @Bean
    public WebClient orderServiceWebClient(org.springframework.http.client.reactive.ReactorClientHttpConnector connector) {
        return WebClient.builder()
                .baseUrl("https://external-api.example.com")
                .clientConnector(connector)
                .build();
    }

    /**
     * Order Service specific External Service Client.
     *
     * This client adds order-specific circuit breaker configurations.
     */
    @Bean
    public OrderExternalServiceClient orderExternalServiceClient(WebClient webClient) {
        return new OrderExternalServiceClient(webClient, mTLSConfiguration);
    }

    /**
     * Order-specific external service client.
     */
    @Slf4j
    @RequiredArgsConstructor
    public static class OrderExternalServiceClient {

        private final WebClient webClient;
        private final MTLSConfiguration mTLSConfiguration;

        /**
         * Call external payment service with circuit breaker.
         */
        @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
        @Retry(name = "paymentRetry", fallbackMethod = "paymentFallback")
        public PaymentResponse processPayment(PaymentRequest request) {
            log.info("Processing payment with traceId: {}", org.slf4j.MDC.get("traceId"));

            return webClient.post()
                    .uri("/api/v1/payments/process")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .bodyValue(request)
                    .retrieve()
                    .body(PaymentResponse.class)
                    .block();
        }

        /**
         * Fallback for payment processing.
         */
        public PaymentResponse paymentFallback(PaymentRequest request, Throwable t) {
            log.warn("Payment service unavailable. Using fallback for order: {}", request.orderId());
            return new PaymentResponse(request.orderId(), "PENDING", "Fallback: Payment processing delayed");
        }

        /**
         * Call inventory service with circuit breaker.
         */
        @CircuitBreaker(name = "inventoryService", fallbackMethod = "inventoryFallback")
        @Retry(name = "inventoryRetry", fallbackMethod = "inventoryFallback")
        public InventoryResponse checkInventory(InventoryRequest request) {
            log.info("Checking inventory with traceId: {}", org.slf4j.MDC.get("traceId"));

            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/inventory/check")
                            .queryParam("productId", request.productId())
                            .queryParam("quantity", request.quantity())
                            .build())
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .retrieve()
                    .body(InventoryResponse.class)
                    .block();
        }

        /**
         * Fallback for inventory check.
         */
        public InventoryResponse inventoryFallback(InventoryRequest request, Throwable t) {
            log.warn("Inventory service unavailable. Using fallback for product: {}", request.productId());
            return new InventoryResponse(request.productId(), true, "Fallback: Inventory check delayed");
        }
    }

    /**
     * Payment request DTO.
     */
    public record PaymentRequest(String orderId, String customerId, double amount, String currency) {
    }

    /**
     * Payment response DTO.
     */
    public record PaymentResponse(String orderId, String status, String message) {
    }

    /**
     * Inventory request DTO.
     */
    public record InventoryRequest(String productId, int quantity) {
    }

    /**
     * Inventory response DTO.
     */
    public record InventoryResponse(String productId, boolean available, String message) {
    }
}
