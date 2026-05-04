package com.example.common.infrastructure.http;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Configuration for MTLS (Mutual TLS) client settings.
 *
 * Supports dual certificate configuration with automatic failover:
 * - Primary certificate (default)
 * - Secondary certificate (backup, optional)
 *
 * Failover behavior:
 * - Automatically switches to secondary if primary certificate fails
 * - Automatically switches back to primary after successful calls (failback)
 */
@Getter
@RequiredArgsConstructor
public class MTLSConfiguration {

    /**
     * Enable secondary certificate support.
     * When false, only primary certificate will be used.
     */
    private final boolean secondaryEnabled;

    /**
     * Number of successful calls required after failover before switching back to primary.
     * This prevents rapid flipping between certificates.
     */
    private final int successThresholdForFailback;

    /**
     * Connection timeout in milliseconds for mTLS connections.
     */
    private final int connectTimeoutMs;

    /**
     * Read timeout in milliseconds for mTLS connections.
     */
    private final int readTimeoutMs;

    /**
     * Maximum number of retries for transient failures.
     */
    private final int maxRetries;

    /**
     * Initial backoff duration in milliseconds for retry attempts.
     */
    private final int initialBackoffMs;

    /**
     * Maximum backoff duration in milliseconds for retry attempts.
     */
    private final int maxBackoffMs;

    /**
     * Whether to apply exponential backoff with jitter.
     */
    private final boolean useJitter;

    public static MTLSConfigurationBuilder builder() {
        return new MTLSConfigurationBuilder();
    }

    public static class MTLSConfigurationBuilder {
        private boolean secondaryEnabled = true;
        private int successThresholdForFailback = 5;
        private int connectTimeoutMs = 5000;
        private int readTimeoutMs = 30000;
        private int maxRetries = 3;
        private int initialBackoffMs = 100;
        private int maxBackoffMs = 10000;
        private boolean useJitter = true;

        public MTLSConfigurationBuilder secondaryEnabled(boolean secondaryEnabled) {
            this.secondaryEnabled = secondaryEnabled;
            return this;
        }

        public MTLSConfigurationBuilder successThresholdForFailback(int successThresholdForFailback) {
            this.successThresholdForFailback = successThresholdForFailback;
            return this;
        }

        public MTLSConfigurationBuilder connectTimeoutMs(int connectTimeoutMs) {
            this.connectTimeoutMs = connectTimeoutMs;
            return this;
        }

        public MTLSConfigurationBuilder readTimeoutMs(int readTimeoutMs) {
            this.readTimeoutMs = readTimeoutMs;
            return this;
        }

        public MTLSConfigurationBuilder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        public MTLSConfigurationBuilder initialBackoffMs(int initialBackoffMs) {
            this.initialBackoffMs = initialBackoffMs;
            return this;
        }

        public MTLSConfigurationBuilder maxBackoffMs(int maxBackoffMs) {
            this.maxBackoffMs = maxBackoffMs;
            return this;
        }

        public MTLSConfigurationBuilder useJitter(boolean useJitter) {
            this.useJitter = useJitter;
            return this;
        }

        public MTLSConfiguration build() {
            return new MTLSConfiguration(
                secondaryEnabled,
                successThresholdForFailback,
                connectTimeoutMs,
                readTimeoutMs,
                maxRetries,
                initialBackoffMs,
                maxBackoffMs,
                useJitter
            );
        }
    }
}
