package com.example.orderservice.domain.models;

import java.util.regex.Pattern;

public class Password {
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    private static final Pattern HAS_UPPER = Pattern.compile("[A-Z]");
    private static final Pattern HAS_LOWER = Pattern.compile("[a-z]");
    private static final Pattern HAS_DIGIT = Pattern.compile("[0-9]");
    private static final Pattern HAS_SPECIAL = Pattern.compile("[!@#$%^&*()\\-_+=\\\\|\\[\\]{};:'\",.<>/?]");

    private final String hashedValue;

    public Password(String hashedValue) {
        if (hashedValue == null || hashedValue.isBlank()) {
            throw new IllegalArgumentException("Hashed password cannot be null or blank");
        }
        this.hashedValue = hashedValue;
    }

    public static void validatePlaintext(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new AuthenticationException("AUTH_PASSWORD_EMPTY", "Password cannot be empty");
        }
        if (plaintext.length() < MIN_LENGTH) {
            throw new AuthenticationException("AUTH_PASSWORD_TOO_SHORT",
                "Password must be at least " + MIN_LENGTH + " characters");
        }
        if (plaintext.length() > MAX_LENGTH) {
            throw new AuthenticationException("AUTH_PASSWORD_TOO_LONG",
                "Password must be at most " + MAX_LENGTH + " characters");
        }
        if (!HAS_UPPER.matcher(plaintext).find()) {
            throw new AuthenticationException("AUTH_PASSWORD_NO_UPPER",
                "Password must contain at least one uppercase letter");
        }
        if (!HAS_LOWER.matcher(plaintext).find()) {
            throw new AuthenticationException("AUTH_PASSWORD_NO_LOWER",
                "Password must contain at least one lowercase letter");
        }
        if (!HAS_DIGIT.matcher(plaintext).find()) {
            throw new AuthenticationException("AUTH_PASSWORD_NO_DIGIT",
                "Password must contain at least one digit");
        }
        if (!HAS_SPECIAL.matcher(plaintext).find()) {
            throw new AuthenticationException("AUTH_PASSWORD_NO_SPECIAL",
                "Password must contain at least one special character");
        }
    }

    public String getHashedValue() {
        return hashedValue;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Password password = (Password) o;
        return hashedValue.equals(password.hashedValue);
    }

    @Override
    public int hashCode() {
        return hashedValue.hashCode();
    }
}
