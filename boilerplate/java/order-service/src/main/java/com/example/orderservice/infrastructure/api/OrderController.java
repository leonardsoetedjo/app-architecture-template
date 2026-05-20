package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    public OrderController(PlaceOrderUseCase placeOrderUseCase) {
        this.placeOrderUseCase = placeOrderUseCase;
    }

    @Operation(
        summary = "Place a new order",
        description = "Creates an order from the provided items and customer id",
        responses = {
            @ApiResponse(responseCode = "201", description = "Order created", content = @Content(schema = @Schema(implementation = OrderResult.class))),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "422", description = "Semantic validation error")
        }
    )
    @PostMapping
    public ResponseEntity<OrderResult> createOrder(@Valid @RequestBody CreateOrderCommand command) {
        OrderResult result = placeOrderUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
