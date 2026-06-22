package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.UserProfileResult;
import com.example.orderservice.domain.models.AuthenticationException;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.UserRepository;

public class GetCurrentUserUseCaseImpl implements GetCurrentUserUseCase {

    private final UserRepository userRepository;

    public GetCurrentUserUseCaseImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserProfileResult execute(UserId userId) {
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new AuthenticationException("AUTH_USER_NOT_FOUND", "User not found"));

        return new UserProfileResult(
            user.getId().getValue().toString(),
            user.getEmail().getValue(),
            user.getRoles(),
            user.isEnabled(),
            user.getCreatedAt(),
            user.getLastLoginAt()
        );
    }
}
