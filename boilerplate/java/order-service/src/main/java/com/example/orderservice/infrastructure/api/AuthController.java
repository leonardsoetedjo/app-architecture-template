package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.usecases.AuthenticateUserUseCase;
import com.example.orderservice.application.usecases.GetCurrentUserUseCase;
import com.example.orderservice.application.usecases.RegisterUserUseCase;
import com.example.orderservice.application.usecases.RefreshTokenUseCase;
import com.example.orderservice.application.usecases.LogoutUseCase;
import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenParser;
import com.example.orderservice.domain.ports.TokenBlacklist;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login, registration, and user profile")
public class AuthController {

    private final AuthenticateUserUseCase authenticateUserUseCase;
    private final RegisterUserUseCase registerUserUseCase;
    private final GetCurrentUserUseCase getCurrentUserUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final TokenParser tokenParser;
    private final TokenBlacklist tokenBlacklist;

    public AuthController(
            AuthenticateUserUseCase authenticateUserUseCase,
            RegisterUserUseCase registerUserUseCase,
            GetCurrentUserUseCase getCurrentUserUseCase,
            RefreshTokenUseCase refreshTokenUseCase,
            LogoutUseCase logoutUseCase,
            TokenParser tokenParser,
            TokenBlacklist tokenBlacklist) {
        this.authenticateUserUseCase = authenticateUserUseCase;
        this.registerUserUseCase = registerUserUseCase;
        this.getCurrentUserUseCase = getCurrentUserUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.tokenParser = tokenParser;
        this.tokenBlacklist = tokenBlacklist;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<RegisterResult> register(@Valid @RequestBody RegisterCommand command) {
        RegisterResult result = registerUserUseCase.execute(command);
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user")
    public ResponseEntity<LoginResult> login(@Valid @RequestBody LoginCommand command) {
        LoginResult result = authenticateUserUseCase.execute(command);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<RefreshTokenResult> refresh(@Valid @RequestBody RefreshTokenCommand command) {
        RefreshTokenResult result = refreshTokenUseCase.execute(command);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate tokens and logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String userId = authentication.getName();
            logoutUseCase.execute(new UserId(UUID.fromString(userId)));
        }
        // Note: Actual token blacklisting is handled by LogoutUseCase via TokenBlacklist port.
        // The auth filter (JwtAuthenticationFilter) should check tokenBlacklist.isBlacklisted()
        // on every request. See InMemoryTokenBlacklist for dev; use Redis in production.
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile")
    public ResponseEntity<UserProfileResult> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        UserId userId = new UserId(UUID.fromString(authentication.getName()));
        UserProfileResult result = getCurrentUserUseCase.execute(userId);
        return ResponseEntity.ok(result);
    }
}
