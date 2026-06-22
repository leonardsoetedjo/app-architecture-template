package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.ChangePasswordCommand;
import com.example.orderservice.domain.events.PasswordChanged;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.UserRepository;

public class ChangePasswordUseCaseImpl implements ChangePasswordUseCase {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;
    private final EventPublisher eventPublisher;

    public ChangePasswordUseCaseImpl(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            EventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void execute(String userId, ChangePasswordCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("command must not be null");
        }

        UserId id = UserId.from(java.util.UUID.fromString(userId));
        User user = userRepository.findById(id)
            .orElseThrow(() -> new AuthenticationException("AUTH_USER_NOT_FOUND",
                "User not found"));

        if (!user.authenticate(command.currentPassword(), passwordHasher)) {
            throw new AuthenticationException("AUTH_INVALID_CURRENT_PASSWORD",
                "Current password is incorrect");
        }

        Password.validatePlaintext(command.newPassword());
        String hashed = passwordHasher.hash(command.newPassword());
        user.changePassword(new Password(hashed));
        userRepository.save(user);

        eventPublisher.publish(new PasswordChanged(user.getId()));
    }
}
