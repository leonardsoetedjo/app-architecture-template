package com.example.orderservice.domain.models;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserIdTest {

    @Test
    @DisplayName("should create from UUID")
    void shouldCreateFromUuid() {
        UUID uuid = UUID.randomUUID();
        UserId userId = UserId.from(uuid);
        assertEquals(uuid, userId.getValue());
    }

    @Test
    @DisplayName("should generate unique IDs")
    void shouldGenerateUnique() {
        UserId id1 = UserId.generate();
        UserId id2 = UserId.generate();
        assertNotNull(id1);
        assertNotNull(id2);
        assertNotEquals(id1, id2);
    }

    @Test
    @DisplayName("should reject null")
    void shouldRejectNull() {
        assertThrows(IllegalArgumentException.class, () -> new UserId(null));
    }

    @Test
    @DisplayName("should be equal by value")
    void shouldBeEqualByValue() {
        UUID uuid = UUID.randomUUID();
        UserId id1 = UserId.from(uuid);
        UserId id2 = UserId.from(uuid);
        assertEquals(id1, id2);
        assertEquals(id1.hashCode(), id2.hashCode());
    }
}
