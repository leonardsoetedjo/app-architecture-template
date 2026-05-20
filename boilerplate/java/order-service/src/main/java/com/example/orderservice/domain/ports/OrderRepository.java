package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(OrderId id);
    List<Order> findAll();
    List<Order> findByCustomerId(UUID customerId);
    void deleteById(OrderId id);
    long count();
    boolean existsById(OrderId id);
}
