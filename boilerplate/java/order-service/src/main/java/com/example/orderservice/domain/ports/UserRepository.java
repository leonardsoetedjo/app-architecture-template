package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.Email;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.models.UserId;

import java.util.Optional;
import java.util.UUID;

/**
 * Port for user persistence operations.
 * Defined in domain layer to maintain dependency rule.
 * Infrastructure provides concrete implementations (JPA, MongoDB, etc.).
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(UserId id);

    Optional<User> findByEmail(Email email);

    boolean existsByEmail(Email email);

    void deleteById(UserId id);

    long count();
}
