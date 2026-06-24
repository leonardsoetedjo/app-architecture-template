package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.*;
import com.example.orderservice.application.usecases.*;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderState;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

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
    private final ListOrdersUseCase listOrdersUseCase;
    private final GetOrderUseCaseImpl getOrderUseCase;
    private final UpdateOrderStatusUseCaseImpl updateOrderStatusUseCase;
    private final SoftDeleteOrderUseCaseImpl softDeleteOrderUseCase;

    public OrderController(
            PlaceOrderUseCase placeOrderUseCase,
            ListOrdersUseCase listOrdersUseCase,
            GetOrderUseCaseImpl getOrderUseCase,
            UpdateOrderStatusUseCaseImpl updateOrderStatusUseCase,
            SoftDeleteOrderUseCaseImpl softDeleteOrderUseCase) {
        this.placeOrderUseCase = placeOrderUseCase;
        this.listOrdersUseCase = listOrdersUseCase;
        this.getOrderUseCase = getOrderUseCase;
        this.updateOrderStatusUseCase = updateOrderStatusUseCase;
        this.softDeleteOrderUseCase = softDeleteOrderUseCase;
    }

    @Operation(summary = "Place a new order")
    @PostMapping
    public ResponseEntity<OrderResult> createOrder(
            @Valid @RequestBody CreateOrderCommand command,
            Authentication authentication) {
        UUID customerId = extractCustomerId(authentication);
        OrderResult result = placeOrderUseCase.execute(customerId, command);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @Operation(summary = "List authenticated user's orders with pagination")
    @GetMapping
    public ResponseEntity<PaginatedResult<OrderListItemResult>> listOrders(
            @RequestParam(required = false) OrderState status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID customerId = extractCustomerId(authentication);
        return ResponseEntity.ok(listOrdersUseCase.execute(customerId, status, page, size));
    }

    @Operation(summary = "Get order detail by ID")
    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailResult> getOrder(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID customerId = extractCustomerId(authentication);
        OrderDetailResult result = getOrderUseCase.execute(new OrderId(id));
        if (!result.customerId().equals(customerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Update order status")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusCommand command,
            Authentication authentication) {
        UUID customerId = extractCustomerId(authentication);
        OrderDetailResult order = getOrderUseCase.execute(new OrderId(id));
        if (!order.customerId().equals(customerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        updateOrderStatusUseCase.execute(new OrderId(id), command.status());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Soft-delete an order")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID customerId = extractCustomerId(authentication);
        OrderDetailResult order = getOrderUseCase.execute(new OrderId(id));
        if (!order.customerId().equals(customerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        softDeleteOrderUseCase.execute(new OrderId(id));
        return ResponseEntity.noContent().build();
    }

    private UUID extractCustomerId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("Authentication required");
        }
        String name = authentication.getName();
        // If the principal is our UserDetails with subject UUID
        if (authentication.getPrincipal() instanceof UserDetails) {
            return UUID.fromString(name);
        }
        return UUID.fromString(name);
    }
}
