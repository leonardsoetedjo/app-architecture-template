package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.ports.PasswordHasher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordHasher implements PasswordHasher {

    private final BCryptPasswordEncoder encoder;

    public BCryptPasswordHasher() {
        this.encoder = new BCryptPasswordEncoder();
    }

    @Override
    public String hash(String plaintext) {
        return encoder.encode(plaintext);
    }

    @Override
    public boolean matches(String plaintext, String hashed) {
        return encoder.matches(plaintext, hashed);
    }
}
