package com.example.orderservice.domain.services;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

class OrderPlacementServiceTest {

    private static final OrderRepository DUMMY_REPO = new OrderRepository() {
        @Override public Optional<Order> findById(OrderId id) {
            return Optional.empty();
        }
        @Override public Optional<Order> findByIdIncludingDeleted(OrderId id) {
            return Optional.empty();
        }
        @Override public Order save(Order order) {
            return order;
        }
        @Override public List<Order> findAll() {
            return List.of();
        }
        @Override public List<Order> findAllIncludingDeleted() {
            return List.of();
        }
        @Override public List<Order> findByCustomerId(UUID customerId, OrderState status, int page, int size) {
            return List.of();
        }
        @Override public long countByCustomerId(UUID customerId, OrderState status) {
            return 0;
        }
        @Override public void deleteById(OrderId id) {
        }
        @Override public long count() {
            return 0;
        }
        @Override public boolean existsById(OrderId id) {
            return false;
        }
    };

    private final OrderPlacementService service = new OrderPlacementService(DUMMY_REPO);

    @Test
    void placeOrder_createsOrder_whenValidItems() {
        UUID customerId = UUID.randomUUID();
        List<OrderItem> items = List.of(
            new OrderItem(UUID.randomUUID(), 2, BigDecimal.valueOf(29.99))
        );

        Order result = service.placeOrder(customerId, items);

        assertThat(result).isNotNull();
        assertThat(result.getCustomerId()).isEqualTo(customerId);
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getStatus()).isEqualTo(OrderState.PENDING);
    }

    @Test
    void placeOrder_throws_whenItemsEmpty() {
        UUID customerId = UUID.randomUUID();

        assertThatThrownBy(() -> service.placeOrder(customerId, List.of()))
            .isInstanceOf(InvalidOrderException.class)
            .hasMessageContaining("at least one item");
    }

    @Test
    void placeOrder_throws_whenItemsNull() {
        UUID customerId = UUID.randomUUID();

        assertThatThrownBy(() -> service.placeOrder(customerId, null))
            .isInstanceOf(InvalidOrderException.class)
            .hasMessageContaining("at least one item");
    }
}
