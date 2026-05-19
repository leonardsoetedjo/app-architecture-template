package com.example.common.infrastructure.http;

/**
 * Configuration for MTLS (Mutual TLS) client settings.
 *
 * Supports dual certificate configuration with automatic failover:
 * - Primary certificate (default)
 * - Secondary certificate (backup, optional)
 */
public class MTLSConfiguration {

    private final boolean secondaryEnabled;
    private final int successThresholdForFailback;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;
    private final int maxRetries;
    private final int initialBackoffMs;
    private final int maxBackoffMs;
    private final boolean useJitter;

    public MTLSConfiguration(boolean secondaryEnabled, int successThresholdForFailback,
                             int connectTimeoutMs, int readTimeoutMs,
                             int maxRetries, int initialBackoffMs, int maxBackoffMs, boolean useJitter) {
        this.secondaryEnabled = secondaryEnabled;
        this.successThresholdForFailback = successThresholdForFailback;
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;
        this.maxRetries = maxRetries;
        this.initialBackoffMs = initialBackoffMs;
        this.maxBackoffMs = maxBackoffMs;
        this.useJitter = useJitter;
    }

    public boolean isSecondaryEnabled() { return secondaryEnabled; }
    public int getSuccessThresholdForFailback() { return successThresholdForFailback; }
    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public int getReadTimeoutMs() { return readTimeoutMs; }
    public int getMaxRetries() { return maxRetries; }
    public int getInitialBackoffMs() { return initialBackoffMs; }
    public int getMaxBackoffMs() { return maxBackoffMs; }
    public boolean isUseJitter() { return useJitter; }

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
            this.secondaryEnabled = secondaryEnabled; return this;
        }
        public MTLSConfigurationBuilder successThresholdForFailback(int successThresholdForFailback) {
            this.successThresholdForFailback = successThresholdForFailback; return this;
        }
        public MTLSConfigurationBuilder connectTimeoutMs(int connectTimeoutMs) {
            this.connectTimeoutMs = connectTimeoutMs; return this;
        }
        public MTLSConfigurationBuilder readTimeoutMs(int readTimeoutMs) {
            this.readTimeoutMs = readTimeoutMs; return this;
        }
        public MTLSConfigurationBuilder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries; return this;
        }
        public MTLSConfigurationBuilder initialBackoffMs(int initialBackoffMs) {
            this.initialBackoffMs = initialBackoffMs; return this;
        }
        public MTLSConfigurationBuilder maxBackoffMs(int maxBackoffMs) {
            this.maxBackoffMs = maxBackoffMs; return this;
        }
        public MTLSConfigurationBuilder useJitter(boolean useJitter) {
            this.useJitter = useJitter; return this;
        }
        public MTLSConfiguration build() {
            return new MTLSConfiguration(secondaryEnabled, successThresholdForFailback,
                connectTimeoutMs, readTimeoutMs, maxRetries, initialBackoffMs, maxBackoffMs, useJitter);
        }
    }
}
