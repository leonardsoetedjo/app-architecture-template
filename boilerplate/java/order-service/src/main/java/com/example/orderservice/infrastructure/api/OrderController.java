package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<OrderResult> createOrder(@Valid @RequestBody CreateOrderCommand command) {
        try {
            OrderResult result = placeOrderUseCase.execute(command);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // In a real app, use @ControllerAdvice to map domain exceptions to HTTP codes
            // as defined in docs/01-agnostic/01-standards/resilience.md
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).build();
        }
    }
}
