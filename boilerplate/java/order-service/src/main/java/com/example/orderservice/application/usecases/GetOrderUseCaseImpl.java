package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.OrderDetailResult;
import com.example.orderservice.application.dtos.OrderItemResult;
import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderNotFoundException;
import com.example.orderservice.domain.ports.OrderRepository;

import java.util.UUID;

public class GetOrderUseCaseImpl {
    private final OrderRepository orderRepository;

    public GetOrderUseCaseImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public OrderDetailResult execute(OrderId id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException("Order not found: " + id.getValue()));

        return new OrderDetailResult(
            order.getId().getValue(),
            order.getCustomerId(),
            order.getStatus(),
            order.getItems().stream()
                .map(i -> new OrderItemResult(
                    i.getProductId(), i.getQuantity(), i.getUnitPrice(), i.getTotalAmount()
                ))
                .toList(),
            order.calculateTotalValue(),
            order.getCreatedAt(),
            order.getConfirmedAt(),
            order.isDeleted()
        );
    }
}
