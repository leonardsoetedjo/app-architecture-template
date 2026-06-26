package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.RefreshTokenCommand;
import com.example.orderservice.application.dtos.RefreshTokenResult;
import com.example.orderservice.domain.models.AuthenticationException;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenGenerator;
import com.example.orderservice.domain.ports.TokenParser;
import com.example.orderservice.domain.ports.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RefreshTokenUseCaseImpl implements RefreshTokenUseCase {

    private final TokenParser tokenParser;
    private final TokenGenerator tokenGenerator;
    private final UserRepository userRepository;

    public RefreshTokenUseCaseImpl(
            TokenParser tokenParser,
            TokenGenerator tokenGenerator,
            UserRepository userRepository) {
        this.tokenParser = tokenParser;
        this.tokenGenerator = tokenGenerator;
        this.userRepository = userRepository;
    }

    @Override
    public RefreshTokenResult execute(RefreshTokenCommand command) {
        if (command == null || command.refreshToken() == null || command.refreshToken().isBlank()) {
            throw new IllegalArgumentException("refreshToken must not be null or blank");
        }

        // Validate the refresh token and extract user ID
        if (!tokenParser.isValid(command.refreshToken())) {
            throw new AuthenticationException("AUTH_INVALID_TOKEN", "Invalid or expired refresh token");
        }

        Optional<UserId> userIdOpt = tokenParser.parseUserId(command.refreshToken());
        if (userIdOpt.isEmpty()) {
            throw new AuthenticationException("AUTH_INVALID_TOKEN", "Could not parse user from token");
        }

        UserId userId = userIdOpt.get();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AuthenticationException("AUTH_USER_NOT_FOUND", "User not found"));

        // Generate new token pair (token rotation)
        String newAccessToken = tokenGenerator.generateAccessToken(user);
        String newRefreshToken = tokenGenerator.generateRefreshToken(user);

        Set<String> roles = user.getRoles().stream()
            .map(r -> r.getCode())
            .collect(Collectors.toSet());

        return new RefreshTokenResult(
            newAccessToken,
            newRefreshToken,
            user.getEmail().getValue(),
            roles,
            "Bearer"
        );
    }
}
