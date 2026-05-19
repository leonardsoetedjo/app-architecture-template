package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    public OrderController(PlaceOrderUseCase placeOrderUseCase) {
        this.placeOrderUseCase = placeOrderUseCase;
    }

    @PostMapping
    public ResponseEntity<OrderResult> createOrder(@Valid @RequestBody CreateOrderCommand command) {
        OrderResult result = placeOrderUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
