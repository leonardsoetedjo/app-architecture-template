package com.example.common.infrastructure.secrets;

/**
 * Configuration for keystore-based secrets storage.
 */
public class KeystoreConfiguration {

    private final boolean enabled;
    private final String path;
    private final String type;
    private final String passwordEnv;

    public KeystoreConfiguration(boolean enabled, String path, String type, String passwordEnv) {
        this.enabled = enabled;
        this.path = path;
        this.type = type;
        this.passwordEnv = passwordEnv;
    }

    public boolean isEnabled() { return enabled; }
    public String getPath()    { return path; }
    public String getType()    { return type; }
    public String getPasswordEnv() { return passwordEnv; }

    public static KeystoreConfigurationBuilder builder() {
        return new KeystoreConfigurationBuilder();
    }

    public static class KeystoreConfigurationBuilder {
        private boolean enabled = true;
        private String path = "classpath:keystore.jks";
        private String type = "JKS";
        private String passwordEnv = "KEYSTORE_PASSWORD";

        public KeystoreConfigurationBuilder enabled(boolean enabled) {
            this.enabled = enabled; return this;
        }
        public KeystoreConfigurationBuilder path(String path) {
            this.path = path; return this;
        }
        public KeystoreConfigurationBuilder type(String type) {
            this.type = type; return this;
        }
        public KeystoreConfigurationBuilder passwordEnv(String passwordEnv) {
            this.passwordEnv = passwordEnv; return this;
        }
        public KeystoreConfiguration build() {
            return new KeystoreConfiguration(enabled, path, type, passwordEnv);
        }
    }
}
