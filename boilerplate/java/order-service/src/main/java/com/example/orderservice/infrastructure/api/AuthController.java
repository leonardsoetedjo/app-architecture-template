package com.example.orderservice.infrastructure.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth Controller — demonstrates login/logout boundary.
 *
 * Uses Spring Security's built-in session authentication.
 * Teams can replace this with JWT/OAuth without changing
 * the frontend contract: POST /login → 200 + profile, POST /logout → 204.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login and logout endpoints")
public class AuthController {

    private final AuthenticationManager authenticationManager;

    public AuthController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> credentials,
            HttpServletRequest request,
            HttpServletResponse response) {

        String username = credentials.getOrDefault("username", "");
        String password = credentials.getOrDefault("password", "");

        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            return ResponseEntity.ok(Map.of(
                "username", username,
                "roles", "USER",
                "message", "Authenticated successfully"
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Invalid username or password"
            ));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Terminate session")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "roles", "USER"
        ));
    }
}
