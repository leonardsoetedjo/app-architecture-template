package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.LoginCommand;
import com.example.orderservice.application.dtos.LoginResult;
import com.example.orderservice.domain.events.UserLoggedIn;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.TokenGenerator;
import com.example.orderservice.domain.ports.UserRepository;

public class AuthenticateUserUseCaseImpl implements AuthenticateUserUseCase {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final TokenGenerator tokenGenerator;
    private final EventPublisher eventPublisher;

    public AuthenticateUserUseCaseImpl(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            TokenGenerator tokenGenerator,
            EventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenGenerator = tokenGenerator;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public LoginResult execute(LoginCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("command must not be null");
        }

        Email email = new Email(command.email());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new AuthenticationException("AUTH_INVALID_CREDENTIALS",
                "Invalid email or password"));

        if (!user.authenticate(command.password(), passwordHasher)) {
            throw new AuthenticationException("AUTH_INVALID_CREDENTIALS",
                "Invalid email or password");
        }

        user.recordLogin();
        userRepository.save(user);

        String accessToken = tokenGenerator.generateAccessToken(user);
        String refreshToken = tokenGenerator.generateRefreshToken(user);

        eventPublisher.publish(new UserLoggedIn(user.getId()));

        return new LoginResult(
            accessToken,
            refreshToken,
            user.getEmail().getValue(),
            user.getRoles(),
            "Bearer"
        );
    }
}
