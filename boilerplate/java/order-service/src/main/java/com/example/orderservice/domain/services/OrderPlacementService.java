package com.example.orderservice.domain.services;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderPlacementService {
    private final OrderRepository orderRepository;

    /**
     * Core business logic for placing an order.
     * Pure domain logic: no DTOs, no HTTP, no framework dependencies.
     */
    public Order placeOrder(UUID customerId, List<OrderItem> items) {
        // 1. Semantic Domain Validation
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderException("Order must have at least one item");
        }

        // 2. Create Domain Entity (Logic inside Order.create)
        Order order = Order.create(customerId, items);

        // 3. Persist via Port
        return orderRepository.save(order);
    }
}
