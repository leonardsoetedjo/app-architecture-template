package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

class EmailTest {

    @Test
    @DisplayName("should create valid email")
    void shouldCreateValid() {
        Email email = new Email("user@example.com");
        assertEquals("user@example.com", email.getValue());
    }

    @Test
    @DisplayName("should normalize to lowercase")
    void shouldNormalize() {
        Email email = new Email("User@Example.COM");
        assertEquals("user@example.com", email.getValue());
    }

    @Test
    @DisplayName("should reject null")
    void shouldRejectNull() {
        assertThrows(IllegalArgumentException.class, () -> new Email(null));
    }

    @Test
    @DisplayName("should reject invalid format")
    void shouldRejectInvalid() {
        assertThrows(IllegalArgumentException.class, () -> new Email("not-an-email"));
    }

    @Test
    @DisplayName("should reject blank")
    void shouldRejectBlank() {
        assertThrows(IllegalArgumentException.class, () -> new Email(""));
    }
}
