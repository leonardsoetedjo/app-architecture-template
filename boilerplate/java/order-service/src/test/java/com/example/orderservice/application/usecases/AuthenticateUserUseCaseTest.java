package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.LoginCommand;
import com.example.orderservice.application.dtos.LoginResult;
import com.example.orderservice.domain.events.UserLoggedIn;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.TokenGenerator;
import com.example.orderservice.domain.ports.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthenticateUserUseCaseTest {

    UserRepository userRepository;
    PasswordHasher passwordHasher;
    TokenGenerator tokenGenerator;
    EventPublisher eventPublisher;
    AuthenticateUserUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordHasher = mock(PasswordHasher.class);
        tokenGenerator = mock(TokenGenerator.class);
        eventPublisher = mock(EventPublisher.class);
        useCase = new AuthenticateUserUseCaseImpl(
            userRepository, passwordHasher, tokenGenerator, eventPublisher
        );
    }

    @Test
    @DisplayName("should authenticate valid credentials")
    void shouldAuthenticate() {
        User user = User.createWithDefaults(
            new Email("user@test.com"), new Password("$2a$hash")
        );
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordHasher.matches("Secret1!", "$2a$hash")).thenReturn(true);
        when(tokenGenerator.generateAccessToken(user)).thenReturn("access_token");
        when(tokenGenerator.generateRefreshToken(user)).thenReturn("refresh_token");

        LoginCommand cmd = new LoginCommand("user@test.com", "Secret1!");
        LoginResult result = useCase.execute(cmd);

        assertEquals("access_token", result.accessToken());
        assertEquals("refresh_token", result.refreshToken());
        assertEquals("Bearer", result.tokenType());
        assertTrue(result.roles().contains(Role.USER));
        verify(eventPublisher).publish(any(UserLoggedIn.class));
    }

    @Test
    @DisplayName("should throw on unknown email")
    void shouldThrowOnUnknownEmail() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        LoginCommand cmd = new LoginCommand("unknown@test.com", "Secret1!");
        AuthenticationException ex = assertThrows(
            AuthenticationException.class, () -> useCase.execute(cmd)
        );
        assertTrue(ex.getCode().contains("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("should throw on wrong password")
    void shouldThrowOnWrongPassword() {
        User user = User.createWithDefaults(
            new Email("user@test.com"), new Password("$2a$hash")
        );
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(passwordHasher.matches("Wrong1!", "$2a$hash")).thenReturn(false);

        LoginCommand cmd = new LoginCommand("user@test.com", "Wrong1!");
        AuthenticationException ex = assertThrows(
            AuthenticationException.class, () -> useCase.execute(cmd)
        );
        assertTrue(ex.getCode().contains("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("should throw on null command")
    void shouldThrowOnNullCommand() {
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(null));
    }
}
