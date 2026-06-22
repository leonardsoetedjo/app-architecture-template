package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderNotFoundException;
import com.example.orderservice.domain.ports.OrderRepository;

public class SoftDeleteOrderUseCaseImpl {
    private final OrderRepository orderRepository;

    public SoftDeleteOrderUseCaseImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void execute(OrderId id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + id.getValue()));
        order.softDelete();
        orderRepository.save(order);
    }
}
