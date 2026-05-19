package com.example.common.infrastructure.secrets;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for secrets and credentials management.
 */
@ConfigurationProperties(prefix = "secrets")
public class SecretManagerConfiguration {

    private final KeystoreConfiguration keystore;
    private final FallbackConfiguration fallback;

    public SecretManagerConfiguration(KeystoreConfiguration keystore, FallbackConfiguration fallback) {
        this.keystore = keystore;
        this.fallback = fallback;
    }

    public KeystoreConfiguration getKeystore() {
        return keystore;
    }

    public FallbackConfiguration getFallback() {
        return fallback;
    }

    public static SecretManagerConfigurationBuilder builder() {
        return new SecretManagerConfigurationBuilder();
    }

    public static class SecretManagerConfigurationBuilder {
        private KeystoreConfiguration keystore = KeystoreConfiguration.builder().build();
        private FallbackConfiguration fallback = FallbackConfiguration.builder().build();

        public SecretManagerConfigurationBuilder keystore(KeystoreConfiguration keystore) {
            this.keystore = keystore; return this;
        }
        public SecretManagerConfigurationBuilder fallback(FallbackConfiguration fallback) {
            this.fallback = fallback; return this;
        }
        public SecretManagerConfiguration build() {
            return new SecretManagerConfiguration(keystore, fallback);
        }
    }
}
