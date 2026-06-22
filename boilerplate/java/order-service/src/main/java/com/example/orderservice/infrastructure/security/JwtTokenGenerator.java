package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.Role;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.ports.TokenGenerator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenGenerator implements TokenGenerator {

    private final SecretKeySpec signingKey;
    private final long accessTokenTtlSeconds;
    private final long refreshTokenTtlSeconds;

    public JwtTokenGenerator(
            @Value("${jwt.secret:change-me-in-production-change-me-in-production-change-me-now}") String secret,
            @Value("${jwt.access-token-ttl:3600}") long accessTokenTtlSeconds,
            @Value("${jwt.refresh-token-ttl:86400}") long refreshTokenTtlSeconds) {
        this.signingKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), SignatureAlgorithm.HS256.getJcaName());
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    @Override
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        String roles = user.getRoles().stream()
            .map(Role::getCode)
            .collect(Collectors.joining(","));

        return Jwts.builder()
            .setSubject(user.getId().getValue().toString())
            .claim("email", user.getEmail().getValue())
            .claim("roles", roles)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(accessTokenTtlSeconds, ChronoUnit.SECONDS)))
            .signWith(signingKey, SignatureAlgorithm.HS256)
            .compact();
    }

    @Override
    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setSubject(user.getId().getValue().toString())
            .claim("type", "refresh")
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(refreshTokenTtlSeconds, ChronoUnit.SECONDS)))
            .signWith(signingKey, SignatureAlgorithm.HS256)
            .compact();
    }
}
