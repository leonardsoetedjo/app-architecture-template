package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenBlacklist;
import com.example.orderservice.domain.ports.TokenParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test verifying the full token blacklist flow:
 * login → logout (token blacklisted) → reuse token → 401.
 *
 * Uses {@link SecurityConfig} with {@link JwtAuthenticationFilter} wired
 * with real beans (TokenBlacklist mock + TokenParser mock).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFilterConfig.class)
class TokenBlacklistIntegrationTest {

    @Autowired MockMvc mockMvc;

    @MockBean TokenParser tokenParser;
    @MockBean TokenBlacklist tokenBlacklist;

    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String BLACKLISTED_TOKEN = "blacklisted.jwt.token";

    @BeforeEach
    void setUp() {
        when(tokenParser.parseUserId(VALID_TOKEN))
            .thenReturn(Optional.of(new UserId(USER_ID)));
        when(tokenParser.parseUserId(BLACKLISTED_TOKEN))
            .thenReturn(Optional.of(new UserId(USER_ID)));
        when(tokenParser.parseUserId(anyString()))
            .thenReturn(Optional.empty());
    }

    @Test
    void validToken_shouldAccessProtectedEndpoint() throws Exception {
        when(tokenBlacklist.isBlacklisted(VALID_TOKEN)).thenReturn(false);

        mockMvc.perform(get("/api/v1/orders")
                .header("Authorization", "Bearer " + VALID_TOKEN))
            .andExpect(status().isOk()); // 200 — but orders may be empty, that's fine
    }

    @Test
    void blacklistedToken_shouldReturn401() throws Exception {
        when(tokenBlacklist.isBlacklisted(BLACKLISTED_TOKEN)).thenReturn(true);

        mockMvc.perform(get("/api/v1/orders")
                .header("Authorization", "Bearer " + BLACKLISTED_TOKEN))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void missingToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void fullFlow_loginThenLogoutThenReuse() throws Exception {
        // Step 1: Simulate login — token is valid, not blacklisted
        when(tokenBlacklist.isBlacklisted(VALID_TOKEN)).thenReturn(false);
        mockMvc.perform(get("/api/v1/orders")
                .header("Authorization", "Bearer " + VALID_TOKEN))
            .andExpect(status().isOk());

        // Step 2: Simulate logout — blacklist the token
        // (In real flow, LogoutUseCase would call tokenBlacklist.blacklist())
        // We simulate by flipping the mock
        when(tokenBlacklist.isBlacklisted(VALID_TOKEN)).thenReturn(true);

        // Step 3: Reuse the same token → 401
        mockMvc.perform(get("/api/v1/orders")
                .header("Authorization", "Bearer " + VALID_TOKEN))
            .andExpect(status().isUnauthorized());
    }
}
