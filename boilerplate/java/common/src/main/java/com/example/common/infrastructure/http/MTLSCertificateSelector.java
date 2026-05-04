package com.example.common.infrastructure.http;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.client.reactive.ClientHttpRequest;
import org.springframework.http.client.reactive.ClientHttpResponse;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

/**
 * MTLSCertificateSelector - Selects the appropriate mTLS certificate based on current configuration.
 *
 * This filter implements a failover strategy for mTLS:
 * - Primary certificate is used by default
 * - If the call fails with SSL/TLS errors, it automatically falls back to secondary certificate
 * - After successful calls with secondary, it periodically switches back to primary (configurable)
 */
@RequiredArgsConstructor
public class MTLSCertificateSelector implements ExchangeFilterFunction {

    public static final String PRIMARY_CERTIFICATE = "primary";
    public static final String SECONDARY_CERTIFICATE = "secondary";

    private final MTLSConfiguration configuration;
    private volatile String currentCertificate = PRIMARY_CERTIFICATE;
    private int successCountSinceFailover = 0;

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        String certToUse = currentCertificate;

        return next.exchange(request)
                .onErrorResume(Exception.class, error -> {
                    logError(certToUse, error);
                    return Mono.empty();
                })
                .flatMap(response -> {
                    // Check if we need to switch to secondary cert
                    if (shouldUseSecondaryCert(response)) {
                        return switchToSecondaryCert(request, next);
                    }

                    // Check if we should switch back to primary
                    if (shouldSwitchBackToPrimary(request)) {
                        return switchToPrimaryCert(request, next);
                    }

                    // Continue with current cert
                    successCountSinceFailover++;
                    return Mono.just(response);
                });
    }

    private Mono<ClientResponse> switchToSecondaryCert(ClientRequest request, ExchangeFunction next) {
        if (configuration.isSecondaryEnabled()) {
            currentCertificate = SECONDARY_CERTIFICATE;
            successCountSinceFailover = 0;
            log.info("Switching to secondary mTLS certificate due to primary cert issue");
            // Retry with secondary cert
            return next.exchange(request);
        }
        // Secondary not enabled or also failing
        return Mono.error(new MTLSException("Both primary and secondary certificates failed"));
    }

    private Mono<ClientResponse> switchToPrimaryCert(ClientRequest request, ExchangeFunction next) {
        if (successCountSinceFailover >= configuration.getSuccessThresholdForFailback()) {
            currentCertificate = PRIMARY_CERTIFICATE;
            successCountSinceFailover = 0;
            log.info("Switching back to primary mTLS certificate after successful calls");
            // Retry with primary cert
            return next.exchange(request);
        }
        return Mono.empty();
    }

    private boolean shouldUseSecondaryCert(ClientResponse response) {
        return currentCertificate.equals(PRIMARY_CERTIFICATE) &&
               configuration.isSecondaryEnabled() &&
               isCertificateRelatedError(response);
    }

    private boolean shouldSwitchBackToPrimary(ClientRequest request) {
        return currentCertificate.equals(SECONDARY_CERTIFICATE) &&
               successCountSinceFailover >= configuration.getSuccessThresholdForFailback();
    }

    private boolean isCertificateRelatedError(ClientResponse response) {
        // Check response status for SSL-related errors
        return response.statusCode().is5xxClientError() || response.statusCode().is5xxServerError();
    }

    private void logError(String certificate, Exception error) {
        log.warn("MTLS call failed with {}: {}", certificate, error.getMessage());
    }

    /**
     * Get the current active certificate name.
     */
    public String getCurrentCertificate() {
        return currentCertificate;
    }

    /**
     * Reset the certificate selector back to primary (for manual failback).
     */
    public void resetToPrimary() {
        currentCertificate = PRIMARY_CERTIFICATE;
        successCountSinceFailover = 0;
        log.info("Manually reset to primary mTLS certificate");
    }
}
