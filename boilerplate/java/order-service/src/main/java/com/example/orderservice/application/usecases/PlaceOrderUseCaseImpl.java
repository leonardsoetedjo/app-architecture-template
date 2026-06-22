package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.domain.events.OrderPlaced;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.services.OrderPlacementService;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {

    private final OrderPlacementService orderPlacementService;
    private final EventPublisher eventPublisher;

    public PlaceOrderUseCaseImpl(
        OrderPlacementService orderPlacementService,
        EventPublisher eventPublisher
    ) {
        this.orderPlacementService = orderPlacementService;
        this.eventPublisher = eventPublisher;
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
        
        // Publish domain event
        OrderPlaced.OrderItemEventData[] itemData = order.getItems().stream()
            .map(item -> new OrderPlaced.OrderItemEventData(
                item.getProductId(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalAmount()
            ))
            .toArray(OrderPlaced.OrderItemEventData[]::new);
        
        OrderPlaced event = new OrderPlaced(
            order.getId(),
            order.getCustomerId(),
            List.of(itemData),
            order.getTotalAmount()
        );
        eventPublisher.publish(event);
        
        return new OrderResult(order.getId().getValue(), order.getStatus().name(), order.getCreatedAt());
    }
}
