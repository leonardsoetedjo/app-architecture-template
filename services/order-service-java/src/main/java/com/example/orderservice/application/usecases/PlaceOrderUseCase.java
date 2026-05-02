package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;

    @Transactional
    public OrderResult execute(CreateOrderCommand command) {
        // Map DTO to Domain
        List<<OrderItemOrderItem> items = command.items().stream()
            .map(dto -> new OrderItem(dto.productId(), dto.quantity(), dto.unitPrice()))
            .collect(Collectors.toList());

        // Domain Entity handles semantic validation in constructor
        Order order = Order.create(command.customerId(), items);

        // Persist
        Order savedOrder = orderRepository.save(order);

        return new OrderResult(
            savedOrder.id().value(),
            savedOrder.status(),
            savedOrder.createdAt()
        );
    }
}
