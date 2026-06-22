package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.AuthenticateUserUseCase;
import com.example.orderservice.application.usecases.GetCurrentUserUseCase;
import com.example.orderservice.application.usecases.RegisterUserUseCase;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenParser;
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
    private final TokenParser tokenParser;

    public AuthController(
            AuthenticateUserUseCase authenticateUserUseCase,
            RegisterUserUseCase registerUserUseCase,
            GetCurrentUserUseCase getCurrentUserUseCase,
            TokenParser tokenParser) {
        this.authenticateUserUseCase = authenticateUserUseCase;
        this.registerUserUseCase = registerUserUseCase;
        this.getCurrentUserUseCase = getCurrentUserUseCase;
        this.tokenParser = tokenParser;
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
