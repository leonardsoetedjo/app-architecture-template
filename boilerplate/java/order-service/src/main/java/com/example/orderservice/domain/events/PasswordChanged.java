package com.example.orderservice.domain.events;

import com.example.orderservice.domain.models.UserId;

import java.util.UUID;

/**
 * Domain event published when a user changes their password.
 */
public class PasswordChanged extends DomainEvent {

    private final UserId userId;

    public PasswordChanged(UserId userId) {
        super("PasswordChanged");
        this.userId = userId;
    }

    @Override
    public UUID getAggregateId() {
        return userId.getValue();
    }

    public UserId getUserId() {
        return userId;
    }
}
