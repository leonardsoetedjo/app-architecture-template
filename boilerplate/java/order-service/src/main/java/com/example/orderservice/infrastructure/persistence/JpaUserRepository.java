package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.Email;
import com.example.orderservice.domain.models.Password;
import com.example.orderservice.domain.models.Role;
import com.example.orderservice.domain.models.User;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class JpaUserRepository implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public JpaUserRepository(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public User save(User user) {
        UserEntity entity = fromDomain(user);
        UserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<User> findById(UserId id) {
        return jpaRepository.findById(id.getValue()).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(Email email) {
        return jpaRepository.findByEmail(email.getValue()).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(Email email) {
        return jpaRepository.existsByEmail(email.getValue());
    }

    @Override
    public void deleteById(UserId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    private UserEntity fromDomain(User user) {
        return new UserEntity(
            user.getId().getValue(),
            user.getEmail().getValue(),
            user.getPassword().getHashedValue(),
            user.getRoles().stream().map(Role::name).collect(Collectors.joining(",")),
            user.isEnabled(),
            user.getCreatedAt(),
            user.getLastLoginAt()
        );
    }

    private User toDomain(UserEntity entity) {
        User user = new User(
            new UserId(entity.getId()),
            new Email(entity.getEmail()),
            new Password(entity.getPasswordHash()),
            entity.getRoles().isBlank()
                ? Collections.singleton(Role.USER)
                : java.util.Arrays.stream(entity.getRoles().split(","))
                    .map(String::trim)
                    .map(Role::valueOf)
                    .collect(Collectors.toSet()),
            entity.isEnabled(),
            entity.getCreatedAt()
        );
        if (entity.getLastLoginAt() != null) {
            user.recordLogin();
        }
        return user;
    }
}
