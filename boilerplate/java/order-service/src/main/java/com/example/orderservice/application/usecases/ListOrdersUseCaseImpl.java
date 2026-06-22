package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.OrderListItemResult;
import com.example.orderservice.application.dtos.PaginatedResult;
import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.ports.OrderRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class ListOrdersUseCaseImpl implements ListOrdersUseCase {
    private final OrderRepository orderRepository;

    public ListOrdersUseCaseImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public PaginatedResult<OrderListItemResult> execute(UUID customerId, OrderState status, int page, int size) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;

        List<Order> orders = orderRepository.findByCustomerId(customerId, status, page, size);
        long total = orderRepository.countByCustomerId(customerId, status);

        List<OrderListItemResult> results = orders.stream()
            .map(o -> new OrderListItemResult(
                o.getId().getValue(),
                o.getCustomerId(),
                o.getStatus(),
                o.calculateTotalValue(),
                o.getCreatedAt(),
                o.getItems().size()
            ))
            .toList();

        return new PaginatedResult<>(results, page, size, total, 0);
    }
}
