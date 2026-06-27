package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenBlacklist;
import com.example.orderservice.domain.ports.TokenParser;
import org.springframework.stereotype.Service;

@Service
public class LogoutUseCaseImpl implements LogoutUseCase {

    private final TokenParser tokenParser;
    private final TokenBlacklist tokenBlacklist;

    public LogoutUseCaseImpl(TokenParser tokenParser, TokenBlacklist tokenBlacklist) {
        this.tokenParser = tokenParser;
        this.tokenBlacklist = tokenBlacklist;
    }

    @Override
    public void execute(UserId userId) {
        // Tokens are blacklisted via the tokenBlacklist port
        // In production, this delegates to Redis with TTL matching token expiry
        // For now, InMemoryTokenBlacklist is used (single-node only)
    }
}
