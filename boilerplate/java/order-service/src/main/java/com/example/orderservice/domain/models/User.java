package com.example.orderservice.domain.models;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import com.example.orderservice.domain.ports.PasswordHasher;

public class User {
    private final UserId id;
    private final Email email;
    private Password password;
    private final Set<Role> roles;
    private boolean enabled;
    private final OffsetDateTime createdAt;
    private OffsetDateTime lastLoginAt;

    public User(UserId id, Email email, Password password, Set<Role> roles, boolean enabled, OffsetDateTime createdAt) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (email == null) {
            throw new IllegalArgumentException("Email cannot be null");
        }
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("User must have at least one role");
        }
        this.id = id;
        this.email = email;
        this.password = password;
        this.roles = new HashSet<>(roles);
        this.enabled = enabled;
        this.createdAt = Objects.requireNonNullElse(createdAt, OffsetDateTime.now());
    }

    public static User create(Email email, Password password, Set<Role> roles) {
        return new User(
            UserId.generate(),
            email,
            password,
            roles,
            true,
            OffsetDateTime.now()
        );
    }

    public static User createWithDefaults(Email email, Password password) {
        return create(email, password, Set.of(Role.USER));
    }

    public boolean authenticate(String plaintextPassword, PasswordHasher passwordHasher) {
        if (!enabled) {
            throw new AuthenticationException("AUTH_USER_DISABLED", "User account is disabled");
        }
        return passwordHasher.matches(plaintextPassword, password.getHashedValue());
    }

    public void recordLogin() {
        this.lastLoginAt = OffsetDateTime.now();
    }

    public void changePassword(Password newPassword) {
        this.password = newPassword;
    }

    public void disable() {
        this.enabled = false;
    }

    public void enable() {
        this.enabled = true;
    }

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }

    public boolean hasAnyRole(Role... requiredRoles) {
        for (Role role : requiredRoles) {
            if (roles.contains(role)) {
                return true;
            }
        }
        return false;
    }

    public boolean hasPermission(Permission permission) {
        return roles.stream().anyMatch(role ->
            Permission.valuesForRole(role).contains(permission)
        );
    }

    public UserId getId() {
        return id;
    }

    public Email getEmail() {
        return email;
    }

    public Password getPassword() {
        return password;
    }

    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id.equals(user.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    @Override
    public String toString() {
        return "User{"
            + "id=" + id
            + ", email=" + email
            + ", roles=" + roles
            + ", enabled=" + enabled
            + '}';
    }
}
