package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.RegisterCommand;
import com.example.orderservice.application.dtos.RegisterResult;
import com.example.orderservice.domain.events.UserRegistered;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.UserRepository;

import java.util.Set;

public class RegisterUserUseCaseImpl implements RegisterUserUseCase {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final EventPublisher eventPublisher;

    public RegisterUserUseCaseImpl(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            EventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public RegisterResult execute(RegisterCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("command must not be null");
        }

        Email email = new Email(command.email());

        if (userRepository.existsByEmail(email)) {
            throw new AuthenticationException("AUTH_EMAIL_EXISTS",
                "An account with this email already exists");
        }

        Password.validatePlaintext(command.password());
        String hashed = passwordHasher.hash(command.password());
        Password password = new Password(hashed);

        Set<Role> roles = command.roles() != null && !command.roles().isEmpty()
            ? Set.copyOf(command.roles())
            : Set.of(Role.USER);

        User user = User.create(email, password, roles);
        User saved = userRepository.save(user);

        eventPublisher.publish(new UserRegistered(saved.getId(), saved.getEmail().getValue()));

        return new RegisterResult(
            saved.getId().getValue().toString(),
            saved.getEmail().getValue(),
            saved.getRoles()
        );
    }
}
