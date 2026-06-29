package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.Role;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.models.UserId;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenGeneratorTest {

    private static final String VALID_SECRET =
            "change-me-in-production-change-me-in-production-change-me-now";

    @Test
    @DisplayName("generateAccessToken produces valid JWT with correct claims")
    void generateAccessToken_producesValidJwt() {
        JwtTokenGenerator generator = new JwtTokenGenerator(VALID_SECRET, 3600, 86400);
        User user = createTestUser();

        String token = generator.generateAccessToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.getSubject()).isEqualTo(user.getId().getValue().toString());
        assertThat(claims.get("email")).isEqualTo(user.getEmail().getValue());
        assertThat(claims.get("roles")).isEqualTo("USER,ADMIN");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
    }

    @Test
    @DisplayName("generateRefreshToken produces valid JWT with type=refresh")
    void generateRefreshToken_producesValidJwt() {
        JwtTokenGenerator generator = new JwtTokenGenerator(VALID_SECRET, 3600, 86400);
        User user = createTestUser();

        String token = generator.generateRefreshToken(user);

        Claims claims = parseClaims(token);
        assertThat(claims.getSubject()).isEqualTo(user.getId().getValue().toString());
        assertThat(claims.get("type")).isEqualTo("refresh");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
    }

    @ParameterizedTest
    @DisplayName("constructor rejects secrets shorter than 32 bytes")
    @ValueSource(strings = { "short", "exactly31bytes-long-secret-ok", "" })
    void constructor_rejectsShortSecret(String shortSecret) {
        assertThatThrownBy(() -> new JwtTokenGenerator(shortSecret, 3600, 86400))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("JWT_SECRET must be at least 32 bytes")
            .hasMessageContaining("openssl rand -base64 32");
    }

    @ParameterizedTest
    @DisplayName("constructor rejects null or blank secrets")
    @CsvSource({
        ",",
        "    ,",
    })
    void constructor_rejectsNullOrBlankSecret(String secret) {
        assertThatThrownBy(() -> new JwtTokenGenerator(secret, 3600, 86400))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("JWT_SECRET is not set")
            .hasMessageContaining("openssl rand -base64 32");
    }

    @Test
    @DisplayName("constructor accepts exactly 32-byte secret")
    void constructor_accepts32ByteSecret() {
        // 32 ASCII characters = 32 bytes
        String exactly32 = "exactly32bytes-long-secret-12345";
        assertThat(exactly32.getBytes().length).isEqualTo(32);
        assertThat(new JwtTokenGenerator(exactly32, 3600, 86400)).isNotNull();
    }

    @Test
    @DisplayName("constructor accepts default secret (64 chars)")
    void constructor_acceptsDefaultSecret() {
        assertThat(new JwtTokenGenerator(VALID_SECRET, 3600, 86400)).isNotNull();
    }

    @Test
    @DisplayName("access token expires within expected TTL window")
    void accessToken_expirationWithinTtl() {
        JwtTokenGenerator generator = new JwtTokenGenerator(VALID_SECRET, 3600, 86400);
        User user = createTestUser();

        String token = generator.generateAccessToken(user);
        Claims claims = parseClaims(token);

        Instant now = Instant.now();
        Instant expiration = claims.getExpiration().toInstant();
        long diff = ChronoUnit.SECONDS.between(now, expiration);

        // Allow 5-second tolerance for test execution time
        assertThat(diff).isBetween(3595L, 3600L);
    }

    // ---- helpers ----

    private User createTestUser() {
        User user = new User(
            new UserId(UUID.randomUUID()),
            new com.example.orderservice.domain.models.Email("test@example.com"),
            "hashedPassword",
            Collections.singletonList(new Role("USER", "User")),
            true
        );
        // Add ADMIN role for claim assertion
        user = new User(
            user.getId(),
            user.getEmail(),
            user.getPasswordHash(),
            java.util.List.of(new Role("USER", "User"), new Role("ADMIN", "Admin")),
            user.isEnabled()
        );
        return user;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(
                new javax.crypto.spec.SecretKeySpec(
                    VALID_SECRET.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    "HmacSHA256"
                )
            )
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
