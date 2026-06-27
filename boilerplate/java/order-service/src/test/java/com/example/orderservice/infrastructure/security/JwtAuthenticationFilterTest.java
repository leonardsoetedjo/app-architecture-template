package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenBlacklist;
import com.example.orderservice.domain.ports.TokenParser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link JwtAuthenticationFilter}.
 *
 * Verifies:
 * 1. Valid token → authentication set in SecurityContext
 * 2. Blacklisted token → 401 returned, no authentication set
 * 3. Missing / invalid token → filter continues without auth
 * 4. Request attribute "userId" set for downstream filters
 */
class JwtAuthenticationFilterTest {

    private TokenParser tokenParser;
    private TokenBlacklist tokenBlacklist;
    private JwtAuthenticationFilter filter;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws IOException {
        tokenParser = mock(TokenParser.class);
        tokenBlacklist = mock(TokenBlacklist.class);
        filter = new JwtAuthenticationFilter(tokenParser, tokenBlacklist);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        // Clear security context between tests
        SecurityContextHolder.clearContext();
    }

    @Test
    void validToken_shouldSetAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "valid-jwt-token";
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenParser.parseUserId(token)).thenReturn(Optional.of(new UserId(userId)));
        when(tokenBlacklist.isBlacklisted(token)).thenReturn(false);

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(anyInt());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo(userId.toString());
        assertThat(auth.getAuthorities()).hasSize(1);

        // Verify userId set as request attribute
        ArgumentCaptor<String> attrKey = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> attrValue = ArgumentCaptor.forClass(Object.class);
        verify(request).setAttribute(attrKey.capture(), attrValue.capture());
        assertThat(attrKey.getValue()).isEqualTo("userId");
        assertThat(attrValue.getValue()).isEqualTo(userId.toString());
    }

    @Test
    void blacklistedToken_shouldReturn401_andNotSetAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "blacklisted-jwt-token";
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenParser.parseUserId(token)).thenReturn(Optional.of(new UserId(userId)));
        when(tokenBlacklist.isBlacklisted(token)).thenReturn(true);

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).getWriter();
        assertThat(responseWriter.toString()).contains("Token has been revoked");
        verify(filterChain, never()).doFilter(any(), any());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    void missingAuthorizationHeader_shouldContinueWithoutAuth() throws ServletException, IOException {
        // Arrange
        when(request.getHeader("Authorization")).thenReturn(null);

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        verify(tokenParser, never()).parseUserId(anyString());
        verify(tokenBlacklist, never()).isBlacklisted(anyString());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    void invalidToken_shouldContinueWithoutAuth() throws ServletException, IOException {
        // Arrange
        String token = "invalid-token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenParser.parseUserId(token)).thenReturn(Optional.empty());

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        verify(tokenBlacklist, never()).isBlacklisted(anyString());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    void malformedAuthorizationHeader_shouldContinueWithoutAuth() throws ServletException, IOException {
        // Arrange
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert
        verify(filterChain).doFilter(request, response);
        verify(tokenParser, never()).parseUserId(anyString());
        verify(tokenBlacklist, never()).isBlacklisted(anyString());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    void validToken_shouldNotCallBlacklistCheckForInvalidToken() throws ServletException, IOException {
        // Arrange: token parses but is invalid (e.g. expired signature)
        String token = "parsed-but-invalid";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenParser.parseUserId(token)).thenReturn(Optional.empty());

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert: blacklist not consulted for tokens that fail parsing
        verify(tokenBlacklist, never()).isBlacklisted(anyString());
    }
}
