package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import java.util.Optional;

public interface OrderRepository {
    Optional<Order> findById(OrderId id);
    Order save(Order order);
}
