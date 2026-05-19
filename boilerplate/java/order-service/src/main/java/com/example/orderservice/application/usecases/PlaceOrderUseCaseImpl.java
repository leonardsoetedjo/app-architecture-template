package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.services.OrderPlacementService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {

    private final OrderPlacementService orderPlacementService;

    public PlaceOrderUseCaseImpl(OrderPlacementService orderPlacementService) {
        this.orderPlacementService = orderPlacementService;
    }

    @Override
    public OrderResult execute(CreateOrderCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("command must not be null");
        }
        List<OrderItem> items = command.items().stream()
            .map(dto -> new OrderItem(dto.productId(), dto.quantity(), dto.unitPrice()))
            .collect(Collectors.toList());
        Order order = orderPlacementService.placeOrder(command.customerId(), items);
        return new OrderResult(order.id().value(), order.status(), order.createdAt());
    }
}
