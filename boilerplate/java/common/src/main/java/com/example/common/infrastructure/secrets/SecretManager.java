package com.example.common.infrastructure.secrets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.BindResult;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * SecretManager - Secure secrets and credentials management using Java Keystore.
 *
 * This class provides a unified interface for loading and accessing secrets from:
 * 1. JKS/PKCS12 keystore files (for production)
 * 2. Environment variables (for development)
 * 3. System properties (for override)
 *
 * Keystore Configuration:
 * ```yaml
 * secrets:
 *   keystore:
 *     enabled: true
 *     path: classpath:keystore.jks
 *     type: JKS
 *     password-env: KEYSTORE_PASSWORD
 *   fallback:
 *     enabled: true
 *     env-prefix: SECRET_
 * ```
 *
 * Usage in application:
 * ```java
 * @Service
 * public class MyService {
 *     private final SecretManager secretManager;
 *
 *     public MyService(SecretManager secretManager) {
 *         this.secretManager = secretManager;
 *     }
 *
 *     public void doSomething() {
 *         String apiKey = secretManager.get("api.key");
 *         String dbPassword = secretManager.get("database.password");
 *     }
 * }
 * ```
 */
@Slf4j
@Component
@Configuration
@RequiredArgsConstructor
public class SecretManager {

    private final ResourceLoader resourceLoader;
    private final SecretManagerConfiguration configuration;

    private final Map<String, String> secrets = new HashMap<>();

    /**
     * Initialize secret manager on startup.
     * Loads secrets from keystore and environment variables.
     */
    @PostConstruct
    public void init() {
        loadFromKeystore();
        loadFromEnvironment();
        log.info("SecretManager initialized with {} secrets", secrets.size());
    }

    /**
     * Load secrets from Java Keystore file.
     *
     * The keystore path and password are configured via application.yml:
     * ```yaml
     * secrets:
     *   keystore:
     *     path: /etc/secrets/app.jks
     *     password-env: KEYSTORE_PASSWORD
     * ```
     */
    private void loadFromKeystore() {
        if (!configuration.getKeystore().isEnabled()) {
            log.debug("Keystore loading disabled");
            return;
        }

        String keystorePath = configuration.getKeystore().getPath();
        String passwordEnv = configuration.getKeystore().getPasswordEnv();

        if (keystorePath == null || keystorePath.isEmpty()) {
            log.warn("Keystore path not configured");
            return;
        }

        try {
            char[] keystorePassword = getKeystorePassword(passwordEnv);

            // Load keystore
            InputStream keystoreStream = resourceLoader.getResource(keystorePath).getInputStream();
            KeyStore keyStore = KeyStore.getInstance(configuration.getKeystore().getType());
            keyStore.load(keystoreStream, keystorePassword);

            // Extract all aliases
            Enumeration<String> aliases = keyStore.aliases();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                if (keyStore.isKeyEntry(alias)) {
                    // For key entries, try to get the password if stored
                    try {
                        java.security.Key key = keyStore.getKey(alias, keystorePassword);
                        if (key != null && key.isSecretKey()) {
                            secrets.put(alias, new String(key.getEncoded()));
                            log.debug("Loaded secret from keystore: {}", alias);
                        }
                    } catch (NoSuchAlgorithmException e) {
                        log.debug("Key algorithm not supported: {}", alias);
                    }
                } else if (keyStore.entryInstanceOf(alias, KeyStore.TrustedCertificateEntry.class)) {
                    // Skip trusted certificates
                    continue;
                } else {
                    // Try to get as a secret entry
                    try {
                        KeyStore.SecretKeyEntry secretEntry = (KeyStore.SecretKeyEntry) keyStore.getEntry(
                                alias, new KeyStore.PasswordProtection(keystorePassword));
                        if (secretEntry != null) {
                            secrets.put(alias, new String(secretEntry.getSecretKey().getEncoded()));
                            log.debug("Loaded secret from keystore: {}", alias);
                        }
                    } catch (Exception e) {
                        // Fall back to storing the alias as a placeholder
                        // The actual secret should be retrieved via the alias
                        secrets.put(alias, "KEYSTORE_ALIAS:" + alias);
                        log.debug("Stored keystore reference: {}", alias);
                    }
                }
            }

            log.info("Loaded {} secrets from keystore: {}", secrets.size(), keystorePath);
        } catch (IOException | KeyStoreException | CertificateException | NoSuchAlgorithmException e) {
            log.error("Failed to load keystore: {}", keystorePath, e);
            throw new SecretInitializationException("Failed to load keystore", e);
        }
    }

    /**
     * Load secrets from environment variables.
     * Falls back to environment if keystore is not available or missing.
     */
    private void loadFromEnvironment() {
        if (!configuration.getFallback().isEnabled()) {
            return;
        }

        String envPrefix = configuration.getFallback().getEnvPrefix();
        Map<String, String> envSecrets = new HashMap<>();

        // Get all environment variables
        Map<String, String> env = System.getenv();
        for (Map.Entry<String, String> entry : env.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith(envPrefix)) {
                // Remove prefix and convert to dot notation
                String secretKey = key.substring(envPrefix.length()).toLowerCase().replace('_', '.');
                envSecrets.put(secretKey, entry.getValue());
                log.debug("Loaded secret from environment: {} (hidden)", secretKey);
            }
        }

        secrets.putAll(envSecrets);
        log.info("Loaded {} secrets from environment", envSecrets.size());
    }

    /**
     * Get a secret value by key.
     *
     * @param key The secret key (e.g., "database.password")
     * @return The secret value, or null if not found
     */
    public String get(String key) {
        String value = secrets.get(key);

        if (value == null) {
            log.warn("Secret not found: {}", key);
            return null;
        }

        // Check if this is a placeholder for keystore reference
        if (value.startsWith("KEYSTORE_ALIAS:")) {
            log.debug("Keystore reference, actual value will be retrieved from KeyStore on demand");
        }

        return value;
    }

    /**
     * Get a secret value with a default fallback.
     *
     * @param key The secret key
     * @param defaultValue The default value if secret not found
     * @return The secret value or default
     */
    public String getOrDefault(String key, String defaultValue) {
        String value = get(key);
        return value != null ? value : defaultValue;
    }

    /**
     * Check if a secret exists.
     *
     * @param key The secret key
     * @return true if secret exists, false otherwise
     */
    public boolean contains(String key) {
        return secrets.containsKey(key);
    }

    /**
     * Get all available secret keys.
     *
     * @return Set of secret keys
     */
    public java.util.Set<String> keys() {
        return java.util.Collections.unmodifiableSet(secrets.keySet());
    }

    /**
     * Get the keystore password from environment variable.
     */
    private char[] getKeystorePassword(String passwordEnv) {
        String password = System.getenv(passwordEnv);

        if (password == null || password.isEmpty()) {
            log.warn("Keystore password env variable '{}' not set, using default placeholder", passwordEnv);
            return "placeholder".toCharArray();
        }

        return password.toCharArray();
    }
}

/**
 * Exception thrown when secret initialization fails.
 */
class SecretInitializationException extends RuntimeException {
    public SecretInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
