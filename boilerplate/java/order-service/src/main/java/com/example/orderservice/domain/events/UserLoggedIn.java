package com.example.orderservice.domain.events;

import com.example.orderservice.domain.models.UserId;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Domain event published when a user successfully logs in.
 */
public class UserLoggedIn extends DomainEvent {

    private final UserId userId;
    private final OffsetDateTime loggedInAt;

    public UserLoggedIn(UserId userId) {
        super("UserLoggedIn");
        this.userId = userId;
        this.loggedInAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    @Override
    public UUID getAggregateId() {
        return userId.getValue();
    }

    public UserId getUserId() {
        return userId;
    }

    public OffsetDateTime getLoggedInAt() {
        return loggedInAt;
    }
}