package com.example.orderservice.infrastructure.config;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Set;

/**
 * Seed data for development — creates a demo user so login works immediately.
 * Active only when profile "dev" or "local" is set (or when no explicit profile excludes it).
 */
@Configuration
@Profile("!prod")
public class SeedDataConfig {

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository, PasswordHasher passwordHasher) {
        return args -> {
            Email demoEmail = new Email("demo@example.com");
            if (userRepository.findByEmail(demoEmail).isPresent()) {
                return; // Already seeded
            }

            User demoUser = new User(
                new UserId(java.util.UUID.randomUUID()),
                demoEmail,
                new Password(passwordHasher.hash("DemoPass1!")),
                Set.of(Role.USER),
                true,
                null
            );
            userRepository.save(demoUser);
        };
    }
}
