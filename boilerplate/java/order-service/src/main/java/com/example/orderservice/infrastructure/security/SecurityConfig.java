package com.example.orderservice.infrastructure.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Minimal Spring Security configuration.
 *
 * Demonstrates auth boundary pattern. Secures all API endpoints
 * except /api/v1/auth/** and actuator/health. Uses HTTP Basic
 * for simplicity — teams can swap in JWT/OAuth/session without
 * changing the route security model.
 *
 * DISABLE: Remove @EnableWebSecurity or exclude this class from
 * component scan if auth is not needed.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/actuator/health", "/error").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {});
        return http.build();
    }
}
