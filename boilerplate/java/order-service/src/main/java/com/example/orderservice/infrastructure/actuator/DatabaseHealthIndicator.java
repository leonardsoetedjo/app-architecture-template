package com.example.orderservice.infrastructure.actuator;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHealthIndicator implements HealthIndicator {

  private final DataSource dataSource;

  public DatabaseHealthIndicator(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @Override
  public Health health() {
    try (Connection conn = dataSource.getConnection()) {
      if (conn.isValid(5)) {
        return Health.up()
            .withDetail("database", "PostgreSQL")
            .withDetail("status", "connected")
            .build();
      }
    } catch (SQLException e) {
      return Health.down()
          .withDetail("database", "PostgreSQL")
          .withDetail("error", e.getMessage())
          .build();
    }
    return Health.down()
        .withDetail("database", "PostgreSQL")
        .withDetail("status", "connection invalid")
        .build();
  }
}
