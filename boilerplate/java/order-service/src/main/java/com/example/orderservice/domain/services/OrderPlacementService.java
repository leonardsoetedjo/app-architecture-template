package com.example.orderservice.domain.services;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;

import java.util.List;
import java.util.UUID;

public class OrderPlacementService {
    private final OrderRepository orderRepository;

    public OrderPlacementService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order placeOrder(UUID customerId, List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }
        Order order = Order.create(customerId, items);
        return orderRepository.save(order);
    }
}
