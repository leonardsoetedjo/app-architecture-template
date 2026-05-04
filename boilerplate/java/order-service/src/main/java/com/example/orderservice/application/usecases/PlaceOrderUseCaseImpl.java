package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.services.OrderPlacementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
    private final OrderPlacementService orderPlacementService;

    @Override
    public OrderResult execute(CreateOrderCommand command) {
        // Map DTO to Domain
        List<OrderItem> items = command.items().stream()
            .map(dto -> new OrderItem(dto.productId(), dto.quantity(), dto.unitPrice()))
            .collect(Collectors.toList());

        // Delegate to Domain Service for business logic
        Order savedOrder = orderPlacementService.placeOrder(command.customerId(), items);

        return new OrderResult(
            savedOrder.id().value(),
            savedOrder.status(),
            savedOrder.createdAt()
        );
    }
}
