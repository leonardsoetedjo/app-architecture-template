package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.Role;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.ports.TokenGenerator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * JWT token generator using HMAC-SHA256.
 *
 * Fails fast at startup if the configured secret is missing or too short,
 * preventing the deeply-nested UnsatisfiedDependencyException / WeakKeyException
 * that users otherwise spend 10+ minutes debugging.
 */
@Component
public class JwtTokenGenerator implements TokenGenerator {

    private static final int MIN_SECRET_BYTES = 32; // 256 bits for HS256
    private static final String GENERATE_COMMAND = "openssl rand -base64 32";

    private final SecretKeySpec signingKey;
    private final long accessTokenTtlSeconds;
    private final long refreshTokenTtlSeconds;
    private final String secret;

    public JwtTokenGenerator(
            @Value("${jwt.secret:change-me-in-production-change-me-in-production-change-me-now}") String secret,
            @Value("${jwt.access-token-ttl:3600}") long accessTokenTtlSeconds,
            @Value("${jwt.refresh-token-ttl:86400}") long refreshTokenTtlSeconds) {
        this.secret = secret;
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = new SecretKeySpec(secretBytes, SignatureAlgorithm.HS256.getJcaName());
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank() || "change-me-in-production-change-me-in-production-change-me-now".equals(secret)) {
            throw new IllegalStateException(
                "JWT_SECRET is not set. Generate one: openssl rand -base64 32"
            );
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be at least 32 bytes (256 bits). Current: " + secret.getBytes(StandardCharsets.UTF_8).length + " bytes. " +
                "Generate a new one: openssl rand -base64 32"
            );
        }
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
 boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/security/JwtTokenGeneratorTest.java boilerplate/nestjs/order-service/src/app.module.ts boilerplate/nestjs/order-service/src/application/dtos/pagination.dto.ts boilerplate/nestjs/order-service/src/application/dtos/place-order.dto.ts boilerplate/nestjs/order-service/src/application/services/order-state-machine.service.ts boilerplate/nestjs/order-service/src/application/services/order.application-service.ts boilerplate/nestjs/order-service/src/application/usecases/authenticate-user.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/get-current-user.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/get-current-user.use-case.interface.ts boilerplate/nestjs/order-service/src/application/usecases/get-order.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/get-order.use-case.interface.ts boilerplate/nestjs/order-service/src/application/usecases/list-orders.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/list-orders.use-case.interface.ts boilerplate/nestjs/order-service/src/application/usecases/logout.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/place-order.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/place-order.use-case.interface.ts boilerplate/nestjs/order-service/src/application/usecases/refresh-token.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/register-user.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/soft-delete-order.use-case.impl.ts boilerplate/nestjs/order-service/src/application/usecases/update-order-status.use-case.impl.ts boilerplate/nestjs/order-service/src/domain/models/order-item.value-object.ts boilerplate/nestjs/order-service/src/domain/models/order.aggregate.ts boilerplate/nestjs/order-service/src/domain/models/user.aggregate.ts boilerplate/nestjs/order-service/src/domain/ports/order-repository.port.ts boilerplate/nestjs/order-service/src/domain/ports/user-repository.port.ts boilerplate/nestjs/order-service/src/domain/services/order-placement.service.ts boilerplate/nestjs/order-service/src/domain/services/order-state-machine.service.ts boilerplate/nestjs/order-service/src/infrastructure/api/auth.controller.ts boilerplate/nestjs/order-service/src/infrastructure/api/order-state.controller.ts boilerplate/nestjs/order-service/src/infrastructure/api/order.controller.ts boilerplate/nestjs/order-service/src/infrastructure/cache/cache-invalidation.service.ts boilerplate/nestjs/order-service/src/infrastructure/cache/redis-cache.adapter.ts boilerplate/nestjs/order-service/src/infrastructure/events/event-emitter-publisher.adapter.ts boilerplate/nestjs/order-service/src/infrastructure/events/order-event.listeners.ts boilerplate/nestjs/order-service/src/infrastructure/events/outbox-relay.service.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/order-item.entity.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/order.entity.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/order.mapper.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/order.typeorm-repository.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/seed-data.service.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/user.entity.ts boilerplate/nestjs/order-service/src/infrastructure/persistence/user.typeorm-repository.ts boilerplate/nestjs/order-service/src/infrastructure/ratelimit/rate-limit.interceptor.ts boilerplate/nestjs/order-service/src/infrastructure/security/auth.module.ts boilerplate/nestjs/order-service/src/infrastructure/security/bcrypt-password-hasher.ts boilerplate/nestjs/order-service/src/infrastructure/security/jwt-auth.guard.ts boilerplate/nestjs/order-service/src/infrastructure/security/jwt-token.service.ts boilerplate/nestjs/order-service/src/main.ts
