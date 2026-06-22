package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenParser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtTokenParser implements TokenParser {

    private final SecretKey signingKey;

    public JwtTokenParser(
            @Value("${jwt.secret:change-me-in-production-change-me-in-production-change-me-now}") String secret) {
        this.signingKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
        );
    }

    @Override
    public Optional<UserId> parseUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            String subject = claims.getSubject();
            if (subject == null || subject.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new UserId(UUID.fromString(subject)));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public boolean isValid(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
