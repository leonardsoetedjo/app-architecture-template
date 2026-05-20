package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.domain.ports.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test using real PostgreSQL via Testcontainers.
 * Skipped if Docker is not available (CI environments without Docker).
 * Run locally with: mvn test -Dtest=JpaOrderRepositoryTestcontainersTest -DDOCKER_AVAILABLE=true
 */
@DataJpaTest
@Testcontainers
@Import({JpaOrderRepository.class})
@EnabledIfSystemProperty(named = "DOCKER_AVAILABLE", matches = "true")
class JpaOrderRepositoryTestcontainersTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void shouldSaveAndRetrieveOrder() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 2, 29.99)));
        Order saved = orderRepository.save(order);
        Optional<Order> found = orderRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getItems()).hasSize(1);
    }

    @Test
    void shouldFindByCustomerId() {
        UUID customerId = UUID.randomUUID();
        orderRepository.save(Order.create(customerId, List.of(new OrderItem(UUID.randomUUID(), 1, 15.0))));
        orderRepository.save(Order.create(customerId, List.of(new OrderItem(UUID.randomUUID(), 3, 25.0))));
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        assertThat(orders).hasSize(2);
    }
}
