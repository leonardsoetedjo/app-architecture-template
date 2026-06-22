package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

class PasswordTest {

    @Test
    @DisplayName("should create with hashed value")
    void shouldCreateHashed() {
        Password pwd = new Password("$2a$10$hashed");
        assertEquals("$2a$10$hashed", pwd.getHashedValue());
    }

    @Test
    @DisplayName("should reject null")
    void shouldRejectNull() {
        assertThrows(IllegalArgumentException.class, () -> new Password(null));
    }

    @Test
    @DisplayName("should validate strong password")
    void shouldValidateStrong() {
        assertDoesNotThrow(() -> Password.validatePlaintext("StrongP@ss1"));
    }

    @Test
    @DisplayName("should reject short password")
    void shouldRejectShort() {
        AuthenticationException ex = assertThrows(
            AuthenticationException.class,
            () -> Password.validatePlaintext("Abc1!")
        );
        assertTrue(ex.getCode().contains("TOO_SHORT"));
    }

    @Test
    @DisplayName("should reject password without digit")
    void shouldRejectNoDigit() {
        AuthenticationException ex = assertThrows(
            AuthenticationException.class,
            () -> Password.validatePlaintext("StrongPass!")
        );
        assertTrue(ex.getCode().contains("NO_DIGIT"));
    }

    @Test
    @DisplayName("should reject password without special character")
    void shouldRejectNoSpecial() {
        AuthenticationException ex = assertThrows(
            AuthenticationException.class,
            () -> Password.validatePlaintext("StrongPass1")
        );
        assertTrue(ex.getCode().contains("NO_SPECIAL"));
    }
}
