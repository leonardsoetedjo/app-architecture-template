package com.example.orderservice.infrastructure.http;

import com.example.common.infrastructure.http.MTLSConfiguration;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ExternalServiceConfig {

    private static final Logger LOG = LoggerFactory.getLogger(ExternalServiceConfig.class);

    private final MTLSConfiguration mTLSConfiguration;

    public ExternalServiceConfig(MTLSConfiguration mTLSConfiguration) {
        this.mTLSConfiguration = mTLSConfiguration;
    }

    @Bean
    public WebClient orderServiceWebClient() {
        return WebClient.builder()
                .baseUrl("https://external-api.example.com")
                .build();
    }

    @Bean
    public OrderExternalServiceClient orderExternalServiceClient(WebClient webClient) {
        return new OrderExternalServiceClient(webClient, mTLSConfiguration);
    }

    public static class OrderExternalServiceClient {

        private final WebClient webClient;
        private final MTLSConfiguration mTLSConfiguration;

        public OrderExternalServiceClient(WebClient webClient, MTLSConfiguration mTLSConfiguration) {
            this.webClient = webClient;
            this.mTLSConfiguration = mTLSConfiguration;
        }

        @CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
        @Retry(name = "paymentRetry", fallbackMethod = "paymentFallback")
        public PaymentResponse processPayment(PaymentRequest request) {
            LOG.info("Processing payment with traceId: {}", org.slf4j.MDC.get("traceId"));

            return webClient.post()
                    .uri("/api/v1/payments/process")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PaymentResponse.class)
                    .block();
        }

        public PaymentResponse paymentFallback(PaymentRequest request, Throwable t) {
            LOG.warn("Payment service unavailable. Using fallback for order: {}", request.orderId());
            return new PaymentResponse(request.orderId(), "PENDING", "Fallback: Payment processing delayed");
        }

        @CircuitBreaker(name = "inventoryService", fallbackMethod = "inventoryFallback")
        @Retry(name = "inventoryRetry", fallbackMethod = "inventoryFallback")
        public InventoryResponse checkInventory(InventoryRequest request) {
            LOG.info("Checking inventory with traceId: {}", org.slf4j.MDC.get("traceId"));

            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/inventory/check")
                            .queryParam("productId", request.productId())
                            .queryParam("quantity", request.quantity())
                            .build())
                    .header("X-Correlation-ID", org.slf4j.MDC.get("traceId"))
                    .retrieve()
                    .bodyToMono(InventoryResponse.class)
                    .block();
        }

        public InventoryResponse inventoryFallback(InventoryRequest request, Throwable t) {
            LOG.warn("Inventory service unavailable. Using fallback for product: {}", request.productId());
            return new InventoryResponse(request.productId(), true, "Fallback: Inventory check delayed");
        }
    }

    public record PaymentRequest(String orderId, String customerId, double amount, String currency) {}
    public record PaymentResponse(String orderId, String status, String message) {}
    public record InventoryRequest(String productId, int quantity) {}
    public record InventoryResponse(String productId, boolean available, String message) {}
}
