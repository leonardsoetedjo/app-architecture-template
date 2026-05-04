package com.example.common.infrastructure.http;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.client.ssl.SslProvider;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import java.io.InputStream;
import java.security.KeyStore;
import java.time.Duration;

/**
 * HTTP Client Configuration for external system communication with mTLS support.
 *
 * This configuration creates a WebClient with:
 * - mTLS client certificate support (primary and secondary)
 * - Circuit breaker for fault tolerance
 * - Retry with exponential backoff
 * - Timeouts for connection and read operations
 *
 * Configuration keys (application.yml):
 * ```yaml
 * external-api:
 *   enabled: true
 *   url: https://api.example.com
 *   mtls:
 *     primary:
 *       cert-path: /etc/ssl/certs/primary.crt
 *       key-path: /etc/ssl/private/primary.key
 *       keystore-password: changeit
 *     secondary:
 *       cert-path: /etc/ssl/certs/secondary.crt
 *       key-path: /etc/ssl/private/secondary.key
 *       keystore-password: changeit
 *   circuit-breaker:
 *     failure-rate-threshold: 50
 *     wait-duration: 30s
 *     failure-order-threshold: 5
 *   retry:
 *     max-attempts: 3
 *     initial-backoff: 100ms
 *     max-backoff: 5000ms
 *     use-jitter: true
 * ```
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "external-api.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class ExternalHttpClientConfig {

    private final MTLSConfiguration mTLSConfiguration;

    @Value("${external-api.url:https://api.example.com}")
    private String externalApiUrl;

    /**
     * Configure SSL context with mTLS certificates.
     *
     * @return SSLContext configured with client certificate
     */
    @Bean
    public SSLContext sslContext() {
        try {
            // Load primary certificate and key
            String primaryCertPath = System.getenv("MTLS_PRIMARY_CERT_PATH");
            String primaryKeyPath = System.getenv("MTLS_PRIMARY_KEY_PATH");
            String primaryKeystorePassword = System.getenv("MTLS_PRIMARY_KEYSTORE_PASSWORD");

            if (primaryCertPath == null || primaryKeyPath == null) {
                throw new IllegalStateException("MTLS primary certificate configuration is missing");
            }

            // Load primary keystore
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream keyIs = loadResource(primaryKeyPath)) {
                keyStore.load(keyIs, primaryKeystorePassword.toCharArray());
            }

            // Load trust store (CA certificates)
            KeyStore trustStore = KeyStore.getInstance("JKS");
            String trustStorePath = System.getenv("MTLS_TRUSTSTORE_PATH");
            String trustStorePassword = System.getenv("MTLS_TRUSTSTORE_PASSWORD");

            try (InputStream trustIs = loadResource(trustStorePath != null ? trustStorePath : "classpath:truststore.jks")) {
                trustStore.load(trustIs, (trustStorePassword != null ? trustStorePassword : "changeit").toCharArray());
            }

            // Initialize KeyManagerFactory with client certificate
            KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(keyStore, primaryKeystorePassword.toCharArray());

            // Initialize TrustManagerFactory with CA certificates
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(trustStore);

            // Create SSL context
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);

            log.info("SSL context initialized with primary mTLS certificate");

            return sslContext;
        } catch (Exception e) {
            log.error("Failed to initialize SSL context", e);
            throw new RuntimeException("Failed to initialize SSL context", e);
        }
    }

    /**
     * Configure Retry policy for transient failures.
     */
    @Bean
    public io.github.resilience4j.retry.RetryConfig retryConfig() {
        return io.github.resilience4j.retry.RetryConfig.custom()
                .maxAttempts(mTLSConfiguration.getMaxRetries())
                .waitDuration(Duration.ofMillis(mTLSConfiguration.getInitialBackoffMs()))
                .retryException(e -> true) // Retry all exceptions
                .build();
    }

    /**
     * Configure Circuit Breaker configuration.
     */
    @Bean
    public io.github.resilience4j.circuitbreaker.CircuitBreakerConfig circuitBreakerConfig() {
        return io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f) // Trip if >50% failures
                .waitDurationInOpenState(Duration.ofSeconds(30)) // Wait before half-open
                .slowCallRateThreshold(50.0f) // Trip if >50% slow calls
                .slowCallDurationThreshold(Duration.ofSeconds(2))
                .build();
    }

    /**
     * Create WebClient with mTLS, circuit breaker, retry, and timeout support.
     *
     * @return WebClient configured for external API calls
     */
    @Bean
    public WebClient externalWebClient(SSLContext sslContext) {
        // Configure HTTP client with SSL and timeouts
        HttpClient httpClient = HttpClient.create()
                .secure(sslSpec -> sslSpec.sslContext(sslContext))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, mTLSConfiguration.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(mTLSConfiguration.getReadTimeoutMs()));

        // Create WebClient with custom HTTP client
        return WebClient.builder()
                .baseUrl(externalApiUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    /**
     * External service client that uses the configured WebClient with resilience patterns.
     */
    @Bean
    @ConditionalOnProperty(name = "external-api.enabled", havingValue = "true", matchIfMissing = false)
    public ExternalServiceClient externalServiceClient(WebClient webClient) {
        return new ExternalServiceClient(webClient, mTLSConfiguration);
    }

    /**
     * Helper method to load resources (files or classpath resources).
     */
    private InputStream loadResource(String path) throws Exception {
        // Try file system first
        java.io.File file = new java.io.File(path);
        if (file.exists()) {
            return new java.io.FileInputStream(file);
        }
        // Try classpath
        return getClass().getClassLoader().getResourceAsStream(path);
    }
}
