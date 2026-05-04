package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.CreateOrderCommand;
import com.example.orderservice.application.dtos.OrderResult;

public interface PlaceOrderUseCase {
    OrderResult execute(CreateOrderCommand command);
}
