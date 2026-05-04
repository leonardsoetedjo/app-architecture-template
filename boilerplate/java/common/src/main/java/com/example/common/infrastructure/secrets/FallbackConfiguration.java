package com.example.common.infrastructure.secrets;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Configuration for fallback secrets sources (environment variables, etc.).
 */
@Getter
@RequiredArgsConstructor
public class FallbackConfiguration {

    private final boolean enabled;
    private final String envPrefix;

    public static FallbackConfigurationBuilder builder() {
        return new FallbackConfigurationBuilder();
    }

    public static class FallbackConfigurationBuilder {
        private boolean enabled = true;
        private String envPrefix = "SECRET_";

        public FallbackConfigurationBuilder enabled(boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        public FallbackConfigurationBuilder envPrefix(String envPrefix) {
            this.envPrefix = envPrefix;
            return this;
        }

        public FallbackConfiguration build() {
            return new FallbackConfiguration(enabled, envPrefix);
        }
    }
}
