package com.example.orderservice.infrastructure.health;

import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthIndicator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            builder.up().withDetail("database", "PostgreSQL").withDetail("validationQuery", "SELECT 1");
        } catch (Exception e) {
            builder.down().withDetail("database", "PostgreSQL").withDetail("error", e.getMessage());
        }
    }
}
