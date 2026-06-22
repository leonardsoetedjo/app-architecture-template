package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.RegisterCommand;
import com.example.orderservice.application.dtos.RegisterResult;
import com.example.orderservice.domain.events.UserRegistered;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RegisterUserUseCaseTest {

    UserRepository userRepository;
    PasswordHasher passwordHasher;
    EventPublisher eventPublisher;
    RegisterUserUseCaseImpl useCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordHasher = mock(PasswordHasher.class);
        eventPublisher = mock(EventPublisher.class);
        useCase = new RegisterUserUseCaseImpl(userRepository, passwordHasher, eventPublisher);
    }

    @Test
    @DisplayName("should register new user")
    void shouldRegister() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordHasher.hash("StrongP@ss1")).thenReturn("$2a$new_hash");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RegisterCommand cmd = new RegisterCommand("new@test.com", "StrongP@ss1", null);
        RegisterResult result = useCase.execute(cmd);

        assertNotNull(result.userId());
        assertEquals("new@test.com", result.email());
        assertTrue(result.roles().contains(Role.USER));
        verify(eventPublisher).publish(any(UserRegistered.class));
    }

    @Test
    @DisplayName("should throw on duplicate email")
    void shouldThrowOnDuplicate() {
        when(userRepository.existsByEmail(any())).thenReturn(true);

        RegisterCommand cmd = new RegisterCommand("exists@test.com", "StrongP@ss1", null);
        AuthenticationException ex = assertThrows(
            AuthenticationException.class, () -> useCase.execute(cmd)
        );
        assertTrue(ex.getCode().contains("EMAIL_EXISTS"));
    }

    @Test
    @DisplayName("should reject weak password")
    void shouldRejectWeakPassword() {
        when(userRepository.existsByEmail(any())).thenReturn(false);

        RegisterCommand cmd = new RegisterCommand("weak@test.com", "weak", null);
        AuthenticationException ex = assertThrows(
            AuthenticationException.class, () -> useCase.execute(cmd)
        );
        assertTrue(ex.getCode().contains("TOO_SHORT"));
    }

    @Test
    @DisplayName("should throw on null command")
    void shouldThrowOnNullCommand() {
        assertThrows(IllegalArgumentException.class, () -> useCase.execute(null));
    }
}
