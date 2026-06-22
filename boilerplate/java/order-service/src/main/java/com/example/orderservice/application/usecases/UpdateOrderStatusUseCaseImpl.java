package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderNotFoundException;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.ports.OrderRepository;

public class UpdateOrderStatusUseCaseImpl {
    private final OrderRepository orderRepository;

    public UpdateOrderStatusUseCaseImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void execute(OrderId id, OrderState newStatus) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + id.getValue()));
        transition(order, newStatus);
        orderRepository.save(order);
    }

    private void transition(Order order, OrderState newStatus) {
        switch (newStatus) {
            case CONFIRMED -> order.confirm();
            case PROCESSING -> order.markAsProcessing();
            case SHIPPED -> order.markAsShipped();
            case DELIVERED -> order.markAsDelivered();
            case COMPLETED -> order.markAsCompleted();
            case CANCELLED -> order.cancel();
            case RETURNED -> order.markAsReturned();
            case REFUNDED -> order.markAsRefunded();
            default -> throw new IllegalArgumentException("Unsupported status transition to: " + newStatus);
        }
    }
}
