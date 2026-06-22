package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    @DisplayName("should create user with defaults")
    void shouldCreateWithDefaults() {
        User user = User.createWithDefaults(
            new Email("user@example.com"),
            new Password("$2a$10$hash")
        );

        assertNotNull(user.getId());
        assertEquals("user@example.com", user.getEmail().getValue());
        assertTrue(user.hasRole(Role.USER));
        assertTrue(user.isEnabled());
        assertNotNull(user.getCreatedAt());
    }

    @Test
    @DisplayName("should reject null email")
    void shouldRejectNullEmail() {
        assertThrows(IllegalArgumentException.class, () ->
            new User(
                UserId.generate(),
                null,
                new Password("$2a$10$hash"),
                Set.of(Role.USER),
                true,
                null
            )
        );
    }

    @Test
    @DisplayName("should record login")
    void shouldRecordLogin() {
        User user = User.createWithDefaults(
            new Email("user@example.com"),
            new Password("$2a$10$hash")
        );
        assertNull(user.getLastLoginAt());
        user.recordLogin();
        assertNotNull(user.getLastLoginAt());
    }

    @Test
    @DisplayName("should check permissions by role")
    void shouldCheckPermissions() {
        User user = User.createWithDefaults(
            new Email("admin@example.com"),
            new Password("$2a$10$hash")
        );
        // USER role doesn't have ADMIN_ACCESS
        assertFalse(user.hasPermission(Permission.ADMIN_ACCESS));
    }
}
