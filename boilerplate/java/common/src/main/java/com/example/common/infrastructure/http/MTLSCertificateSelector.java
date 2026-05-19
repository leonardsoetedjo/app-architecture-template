package com.example.common.infrastructure.http;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

/**
 * MTLSCertificateSelector - Selects the appropriate mTLS certificate based on current configuration.
 */
public class MTLSCertificateSelector implements ExchangeFilterFunction {

    private static final Logger LOG = LoggerFactory.getLogger(MTLSCertificateSelector.class);

    public static final String PRIMARY_CERTIFICATE = "primary";
    public static final String SECONDARY_CERTIFICATE = "secondary";

    private final MTLSConfiguration configuration;
    private volatile String currentCertificate = PRIMARY_CERTIFICATE;
    private int successCountSinceFailover = 0;

    public MTLSCertificateSelector(MTLSConfiguration configuration) {
        this.configuration = configuration;
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        String certToUse = currentCertificate;

        return next.exchange(request)
                .onErrorResume(Exception.class, error -> {
                    LOG.warn("MTLS call failed with {}: {}", certToUse, error.getMessage());
                    return Mono.empty();
                })
                .flatMap(response -> {
                    if (shouldUseSecondaryCert(response)) {
                        return switchToSecondaryCert(request, next);
                    }
                    if (shouldSwitchBackToPrimary(request)) {
                        return switchToPrimaryCert(request, next);
                    }
                    successCountSinceFailover++;
                    return Mono.just(response);
                });
    }

    private Mono<ClientResponse> switchToSecondaryCert(ClientRequest request, ExchangeFunction next) {
        if (configuration.isSecondaryEnabled()) {
            currentCertificate = SECONDARY_CERTIFICATE;
            successCountSinceFailover = 0;
            LOG.info("Switching to secondary mTLS certificate due to primary cert issue");
            return next.exchange(request);
        }
        return Mono.error(new MTLSException("Both primary and secondary certificates failed"));
    }

    private Mono<ClientResponse> switchToPrimaryCert(ClientRequest request, ExchangeFunction next) {
        if (successCountSinceFailover >= configuration.getSuccessThresholdForFailback()) {
            currentCertificate = PRIMARY_CERTIFICATE;
            successCountSinceFailover = 0;
            LOG.info("Switching back to primary mTLS certificate after successful calls");
            return next.exchange(request);
        }
        return Mono.empty();
    }

    private boolean shouldUseSecondaryCert(ClientResponse response) {
        return PRIMARY_CERTIFICATE.equals(currentCertificate) &&
               configuration.isSecondaryEnabled() &&
               response.statusCode().is5xxServerError();
    }

    private boolean shouldSwitchBackToPrimary(ClientRequest request) {
        return SECONDARY_CERTIFICATE.equals(currentCertificate) &&
               successCountSinceFailover >= configuration.getSuccessThresholdForFailback();
    }

    public String getCurrentCertificate() {
        return currentCertificate;
    }

    public void resetToPrimary() {
        currentCertificate = PRIMARY_CERTIFICATE;
        successCountSinceFailover = 0;
        LOG.info("Manually reset to primary mTLS certificate");
    }
}
