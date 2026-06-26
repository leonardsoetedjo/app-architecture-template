package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.UserId;
import org.springframework.stereotype.Service;

@Service
public class LogoutUseCaseImpl implements LogoutUseCase {

    @Override
    public void execute(UserId userId) {
        // TODO: Add token blacklist implementation (e.g., Redis)
        // For now, tokens expire naturally via JWT expiration.
        // In production, add the user's tokens to a blacklist/revocation store.
    }
}
