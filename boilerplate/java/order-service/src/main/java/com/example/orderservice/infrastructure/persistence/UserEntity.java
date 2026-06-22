package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    private UUID id;

    private String email;

    private String passwordHash;

    private String roles;

    private boolean enabled;

    private OffsetDateTime createdAt;

    private OffsetDateTime lastLoginAt;

    public UserEntity(UUID id, String email, String passwordHash, String roles,
                      boolean enabled, OffsetDateTime createdAt, OffsetDateTime lastLoginAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.roles = roles;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.lastLoginAt = lastLoginAt;
    }
}
