package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.OrderListItemResult;
import com.example.orderservice.application.dtos.PaginatedResult;
import com.example.orderservice.domain.models.OrderState;

import java.util.UUID;

public interface ListOrdersUseCase {
    PaginatedResult<OrderListItemResult> execute(UUID customerId, OrderState status, int page, int size);
}
