package com.example.common.infrastructure.secrets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * SecretManager - Secure secrets and credentials management using Java Keystore.
 *
 * Provides a unified interface for loading secrets from:
 * 1. JKS/PKCS12 keystore files (for production)
 * 2. Environment variables (for development)
 */
@Component
public class SecretManager {

    private static final Logger LOG = LoggerFactory.getLogger(SecretManager.class);

    private final ResourceLoader resourceLoader;
    private final SecretManagerConfiguration configuration;
    private final Map<String, String> secrets = new HashMap<>();

    public SecretManager(ResourceLoader resourceLoader, SecretManagerConfiguration configuration) {
        this.resourceLoader = resourceLoader;
        this.configuration = configuration;
    }

    @PostConstruct
    public void init() {
        loadFromKeystore();
        loadFromEnvironment();
        LOG.info("SecretManager initialized with {} secrets", secrets.size());
    }

    private void loadFromKeystore() {
        if (!configuration.getKeystore().isEnabled()) {
            LOG.debug("Keystore loading disabled");
            return;
        }

        String keystorePath = configuration.getKeystore().getPath();
        String passwordEnv = configuration.getKeystore().getPasswordEnv();

        if (keystorePath == null || keystorePath.isEmpty()) {
            LOG.warn("Keystore path not configured");
            return;
        }

        try {
            char[] keystorePassword = getKeystorePassword(passwordEnv);
            InputStream keystoreStream = resourceLoader.getResource(keystorePath).getInputStream();
            KeyStore keyStore = KeyStore.getInstance(configuration.getKeystore().getType());
            keyStore.load(keystoreStream, keystorePassword);

            Enumeration<String> aliases = keyStore.aliases();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                secrets.put(alias, "KEYSTORE_ALIAS:" + alias);
            }

            LOG.info("Loaded {} secrets from keystore: {}", secrets.size(), keystorePath);
        } catch (IOException | KeyStoreException | CertificateException | NoSuchAlgorithmException e) {
            LOG.error("Failed to load keystore: {}", keystorePath, e);
            throw new SecretInitializationException("Failed to load keystore", e);
        }
    }

    private void loadFromEnvironment() {
        if (!configuration.getFallback().isEnabled()) {
            return;
        }

        String envPrefix = configuration.getFallback().getEnvPrefix();
        Map<String, String> envSecrets = new HashMap<>();

        Map<String, String> env = System.getenv();
        for (Map.Entry<String, String> entry : env.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith(envPrefix)) {
                String secretKey = key.substring(envPrefix.length()).toLowerCase().replace('_', '.');
                envSecrets.put(secretKey, entry.getValue());
            }
        }

        secrets.putAll(envSecrets);
        LOG.info("Loaded {} secrets from environment", envSecrets.size());
    }

    public String get(String key) {
        String value = secrets.get(key);
        if (value == null) {
            LOG.warn("Secret not found: {}", key);
            return null;
        }
        return value;
    }

    public String getOrDefault(String key, String defaultValue) {
        String value = get(key);
        return value != null ? value : defaultValue;
    }

    public boolean contains(String key) {
        return secrets.containsKey(key);
    }

    public Set<String> keys() {
        return Collections.unmodifiableSet(secrets.keySet());
    }

    private char[] getKeystorePassword(String passwordEnv) {
        String password = System.getenv(passwordEnv);
        if (password == null || password.isEmpty()) {
            LOG.warn("Keystore password env variable '{}' not set, using default placeholder", passwordEnv);
            return "placeholder".toCharArray();
        }
        return password.toCharArray();
    }
}

class SecretInitializationException extends RuntimeException {
    public SecretInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
