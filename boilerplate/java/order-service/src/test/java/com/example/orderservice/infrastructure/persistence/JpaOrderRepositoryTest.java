package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderItem;
import com.example.orderservice.domain.ports.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@Import({JpaOrderRepository.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class JpaOrderRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void shouldSaveOrder() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(29.99))));
        Order saved = orderRepository.save(order);
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
    }

    @Test
    void shouldFindOrderById() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(9.99))));
        Order saved = orderRepository.save(order);
        OrderId id = saved.getId();

        Optional<Order> found = orderRepository.findById(id);
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(id);
    }

    @Test
    void shouldFindAllOrders() {
        orderRepository.save(Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(10.0)))));
        orderRepository.save(Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(20.0)))));

        List<Order> orders = orderRepository.findAll();
        assertThat(orders).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void shouldDeleteOrder() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(5.0))));
        Order saved = orderRepository.save(order);
        OrderId id = saved.getId();

        orderRepository.deleteById(id);
        assertThat(orderRepository.existsById(id)).isFalse();
    }

    @Test
    void shouldExistById() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(15.0))));
        Order saved = orderRepository.save(order);
        assertThat(orderRepository.existsById(saved.getId())).isTrue();
    }

    @Test
    void shouldUpdateOrderStatus() {
        Order order = Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(25.0))));
        Order saved = orderRepository.save(order);
        OrderId id = saved.getId();

        Order current = orderRepository.findById(id).orElseThrow();
        OffsetDateTime before = current.getConfirmedAt();
        current.confirm();
        orderRepository.save(current);

        Order updated = orderRepository.findById(id).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("CONFIRMED");
        assertThat(updated.getConfirmedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void shouldSaveOrderWithMultipleItems() {
        List<OrderItem> items = List.of(
            new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(10.0)),
            new OrderItem(UUID.randomUUID(), 3, BigDecimal.valueOf(5.0))
        );
        Order order = Order.create(UUID.randomUUID(), items);
        Order saved = orderRepository.save(order);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getItems()).hasSize(2);
    }

    @Test
    void shouldCalculateTotalValue() {
        List<OrderItem> items = List.of(
            new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(15.0)),
            new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(30.0))
        );
        Order order = Order.create(UUID.randomUUID(), items);
        assertThat(order.calculateTotalValue()).isEqualTo(BigDecimal.valueOf(60.0));
    }

    @Test
    void shouldFindByCustomerId() {
        UUID customerId = UUID.randomUUID();
        orderRepository.save(Order.create(customerId, List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(5.0)))));
        orderRepository.save(Order.create(customerId, List.of(new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(10.0)))));

        List<Order> orders = orderRepository.findByCustomerId(customerId);
        assertThat(orders).hasSize(2);
    }

    @Test
    void shouldCountOrders() {
        long before = orderRepository.count();
        orderRepository.save(Order.create(UUID.randomUUID(), List.of(new OrderItem(UUID.randomUUID(), 1, BigDecimal.valueOf(1.0)))));
        assertThat(orderRepository.count()).isEqualTo(before + 1);
    }
}
