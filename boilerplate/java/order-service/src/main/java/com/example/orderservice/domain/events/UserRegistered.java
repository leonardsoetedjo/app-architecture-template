package com.example.orderservice.domain.events;

import com.example.orderservice.domain.models.UserId;

import java.util.UUID;

/**
 * Domain event published when a new user registers.
 */
public class UserRegistered extends DomainEvent {

    private final UserId userId;
    private final String email;

    public UserRegistered(UserId userId, String email) {
        super("UserRegistered");
        this.userId = userId;
        this.email = email;
    }

    @Override
    public UUID getAggregateId() {
        return userId.getValue();
    }

    public UserId getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }
}
