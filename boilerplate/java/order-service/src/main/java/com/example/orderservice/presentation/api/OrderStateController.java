package com.example.orderservice.presentation.api;

import com.example.orderservice.application.services.OrderStateService;
import com.example.orderservice.domain.models.OrderEvent;
import com.example.orderservice.domain.models.OrderState;
import com.example.orderservice.domain.order_id.OrderId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST API for order state management.
 */
@RestController
@RequestMapping("/api/v1/orders/{orderId}/state")
@Tag(name = "Order State", description = "Order state machine management")
public class OrderStateController {
    
    private final OrderStateService orderStateService;
    
    public OrderStateController(OrderStateService orderStateService) {
        this.orderStateService = orderStateService;
    }
    
    @GetMapping
    @Operation(summary = "Get current order state")
    public ResponseEntity<Map<String, String>> getCurrentState(@PathVariable UUID orderId) {
        OrderState state = orderStateService.getCurrentState(OrderId.from(orderId));
        return ResponseEntity.ok(Map.of(
            "orderId", orderId.toString(),
            "state", state.name(),
            "isTerminal", String.valueOf(isTerminalState(state))
        ));
    }
    
    @PostMapping("/confirm-payment")
    @Operation(summary = "Confirm payment - transitions from PENDING to CONFIRMED")
    public ResponseEntity<Map<String, Object>> confirmPayment(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.CONFIRM_PAYMENT, "Payment confirmed");
    }
    
    @PostMapping("/start-processing")
    @Operation(summary = "Start processing - transitions from CONFIRMED to PROCESSING")
    public ResponseEntity<Map<String, Object>> startProcessing(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.START_PROCESSING, "Processing started");
    }
    
    @PostMapping("/ship")
    @Operation(summary = "Ship order - transitions from PROCESSING to SHIPPED")
    public ResponseEntity<Map<String, Object>> shipOrder(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.SHIP_ORDER, "Order shipped");
    }
    
    @PostMapping("/deliver")
    @Operation(summary = "Deliver order - transitions from SHIPPED to DELIVERED")
    public ResponseEntity<Map<String, Object>> deliverOrder(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.DELIVER_ORDER, "Order delivered");
    }
    
    @PostMapping("/complete")
    @Operation(summary = "Complete order - transitions from DELIVERED to COMPLETED")
    public ResponseEntity<Map<String, Object>> completeOrder(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.COMPLETE_ORDER, "Order completed");
    }
    
    @PostMapping("/cancel")
    @Operation(summary = "Cancel order - transitions to CANCELLED from PENDING/CONFIRMED/PROCESSING")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.CANCEL_ORDER, "Order cancelled");
    }
    
    @PostMapping("/return")
    @Operation(summary = "Initiate return - transitions from SHIPPED/DELIVERED to RETURNED")
    public ResponseEntity<Map<String, Object>> initiateReturn(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.INITIATE_RETURN, "Return initiated");
    }
    
    @PostMapping("/refund")
    @Operation(summary = "Process refund - transitions from RETURNED to REFUNDED")
    public ResponseEntity<Map<String, Object>> processRefund(@PathVariable UUID orderId) {
        return processTransition(orderId, OrderEvent.PROCESS_REFUND, "Refund processed");
    }
    
    private ResponseEntity<Map<String, Object>> processTransition(
        UUID orderId, 
        OrderEvent event, 
        String successMessage
    ) {
        boolean success = orderStateService.triggerEvent(OrderId.from(orderId), event);
        
        if (success) {
            OrderState newState = orderStateService.getCurrentState(OrderId.from(orderId));
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", successMessage,
                "newState", newState.name()
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "error", "Invalid state transition",
                "currentState", orderStateService.getCurrentState(OrderId.from(orderId)).name()
            ));
        }
    }
    
    private boolean isTerminalState(OrderState state) {
        return state == OrderState.COMPLETED || 
               state == OrderState.CANCELLED || 
               state == OrderState.REFUNDED;
    }
}
