package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CreateOrderCommand;
import com.example.orderservice.application.dtos.OrderResult;

import java.util.UUID;

public interface PlaceOrderUseCase {
    OrderResult execute(UUID customerId, CreateOrderCommand command);
}
