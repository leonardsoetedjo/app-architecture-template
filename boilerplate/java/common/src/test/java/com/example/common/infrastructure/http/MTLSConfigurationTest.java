package com.example.common.infrastructure.http;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class MTLSConfigurationTest {

    @Test
    void builder_createsDefaultConfiguration() {
        MTLSConfiguration config = MTLSConfiguration.builder().build();

        assertThat(config.isSecondaryEnabled()).isTrue();
        assertThat(config.getSuccessThresholdForFailback()).isEqualTo(5);
        assertThat(config.getConnectTimeoutMs()).isEqualTo(5000);
        assertThat(config.getReadTimeoutMs()).isEqualTo(30000);
        assertThat(config.getMaxRetries()).isEqualTo(3);
        assertThat(config.getInitialBackoffMs()).isEqualTo(100);
        assertThat(config.getMaxBackoffMs()).isEqualTo(10000);
        assertThat(config.isUseJitter()).isTrue();
    }

    @Test
    void builder_overridesDefaults() {
        MTLSConfiguration config = MTLSConfiguration.builder()
            .secondaryEnabled(false)
            .successThresholdForFailback(10)
            .connectTimeoutMs(1000)
            .readTimeoutMs(5000)
            .maxRetries(5)
            .initialBackoffMs(200)
            .maxBackoffMs(5000)
            .useJitter(false)
            .build();

        assertThat(config.isSecondaryEnabled()).isFalse();
        assertThat(config.getSuccessThresholdForFailback()).isEqualTo(10);
        assertThat(config.getConnectTimeoutMs()).isEqualTo(1000);
        assertThat(config.getReadTimeoutMs()).isEqualTo(5000);
        assertThat(config.getMaxRetries()).isEqualTo(5);
        assertThat(config.getInitialBackoffMs()).isEqualTo(200);
        assertThat(config.getMaxBackoffMs()).isEqualTo(5000);
        assertThat(config.isUseJitter()).isFalse();
    }

    @Test
    void constructor_usesProvidedValues() {
        MTLSConfiguration config = new MTLSConfiguration(
            false, 10, 1000, 5000, 5, 200, 5000, false
        );

        assertThat(config.isSecondaryEnabled()).isFalse();
        assertThat(config.getSuccessThresholdForFailback()).isEqualTo(10);
        assertThat(config.getConnectTimeoutMs()).isEqualTo(1000);
        assertThat(config.getReadTimeoutMs()).isEqualTo(5000);
        assertThat(config.getMaxRetries()).isEqualTo(5);
        assertThat(config.getInitialBackoffMs()).isEqualTo(200);
        assertThat(config.getMaxBackoffMs()).isEqualTo(5000);
        assertThat(config.isUseJitter()).isFalse();
    }
}
