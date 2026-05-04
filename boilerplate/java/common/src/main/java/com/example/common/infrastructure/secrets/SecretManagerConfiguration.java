package com.example.common.infrastructure.secrets;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for secrets and credentials management.
 */
@Getter
@RequiredArgsConstructor
@ConfigurationProperties(prefix = "secrets")
public class SecretManagerConfiguration {

    private final KeystoreConfiguration keystore;
    private final FallbackConfiguration fallback;

    public static SecretManagerConfigurationBuilder builder() {
        return new SecretManagerConfigurationBuilder();
    }

    public static class SecretManagerConfigurationBuilder {
        private KeystoreConfiguration.Builder keystoreBuilder = KeystoreConfiguration.builder();
        private FallbackConfiguration.Builder fallbackBuilder = FallbackConfiguration.builder();

        public SecretManagerConfigurationBuilder keystoreEnabled(boolean enabled) {
            keystoreBuilder.enabled(enabled);
            return this;
        }

        public SecretManagerConfigurationBuilder keystorePath(String path) {
            keystoreBuilder.path(path);
            return this;
        }

        public SecretManagerConfigurationBuilder keystoreType(String type) {
            keystoreBuilder.type(type);
            return this;
        }

        public SecretManagerConfigurationBuilder keystorePasswordEnv(String passwordEnv) {
            keystoreBuilder.passwordEnv(passwordEnv);
            return this;
        }

        public SecretManagerConfigurationBuilder fallbackEnabled(boolean enabled) {
            fallbackBuilder.enabled(enabled);
            return this;
        }

        public SecretManagerConfigurationBuilder fallbackEnvPrefix(String envPrefix) {
            fallbackBuilder.envPrefix(envPrefix);
            return this;
        }

        public SecretManagerConfiguration build() {
            return new SecretManagerConfiguration(keystoreBuilder.build(), fallbackBuilder.build());
        }
    }
}
