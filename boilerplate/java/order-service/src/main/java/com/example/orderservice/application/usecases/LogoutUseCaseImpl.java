package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenBlacklist;
import com.example.orderservice.domain.ports.TokenParser;

// No @Service annotation - application layer is Spring-free (Clean Architecture)
public class LogoutUseCaseImpl implements LogoutUseCase {

    private final TokenParser tokenParser;
    private final TokenBlacklist tokenBlacklist;

    public LogoutUseCaseImpl(TokenParser tokenParser, TokenBlacklist tokenBlacklist) {
        this.tokenParser = tokenParser;
        this.tokenBlacklist = tokenBlacklist;
    }

    @Override
    public void execute(UserId userId, String token) {
        // Blacklist the token with TTL matching access token expiry (default 3600s)
        tokenBlacklist.blacklist(token, 3600);
    }
}
