package com.example.orderservice.domain.models;

/**
 * Multi-factor authentication methods.
 * 
 * String-backed enum for easy serialization to/from JSON.
 * No framework dependencies - pure domain model.
 */
public enum MfaMethod {
    TOTP("TOTP"),
    WEBAUTHN("WEBAUTHN"),
    BACKUP_CODE("BACKUP_CODE");

    private final String value;

    MfaMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
