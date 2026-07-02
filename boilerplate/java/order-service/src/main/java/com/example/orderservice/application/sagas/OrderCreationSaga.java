package com.example.orderservice.application.sagas;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.infrastructure.services.OrderStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Order Creation Saga — Orchestration pattern for distributed order creation.
 * 
 * Flow:
 *   1. Create Order (PENDING)
 *   2. Reserve Inventory
 *      ├─ Success → Continue
 *      └─ Failure → Compensate: Cancel Order
 *   3. Authorize Payment
 *      ├─ Success → Confirm Order (CONFIRMED)
 *      └─ Failure → Compensate: Release Inventory → Cancel Order
 * 
 * Compensation guarantees eventual consistency across distributed services.
 * 
 * Mirrors NestJS OrderCreationSaga and Python order_creation_saga.
 */
public class OrderCreationSaga {
    
    private static final Logger log = LoggerFactory.getLogger(OrderCreationSaga.class);
    
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final Supplier<OrderStateMachine> stateMachineFactory;
    
    public OrderCreationSaga(
            InventoryService inventoryService,
            PaymentService paymentService,
            Supplier<OrderStateMachine> stateMachineFactory) {
        this.inventoryService = inventoryService;
        this.paymentService = paymentService;
        this.stateMachineFactory = stateMachineFactory;
    }
    
    /**
     * Execute the order creation saga.
     * 
     * @param order The order to process
     * @param customerId The customer ID for payment authorization
     * @return SagaResult with success status and details
     */
    public SagaResult execute(Order order, String customerId) {
        OrderId orderId = order.getId();
        OrderStateMachine sm = stateMachineFactory.get();
        sm.load(order);
        
        try {
            log.info("Starting order creation saga for order {}", orderId);
            
            // Step 1: Reserve inventory
            List<UUID> productIds = order.getItems().stream()
                    .map(item -> item.getProductId())
                    .toList();
            
            boolean reserved = inventoryService.reserveItems(orderId, productIds);
            if (!reserved) {
                log.warn("Inventory reservation failed for order {}", orderId);
                return SagaResult.failure(orderId, "Inventory reservation failed", "RESERVE_INVENTORY");
            }
            log.info("Inventory reserved for order {}", orderId);
            
            // Step 2: Authorize payment
            BigDecimal totalAmount = order.getTotalAmount();
            boolean authorized = paymentService.authorizePayment(orderId, customerId, totalAmount);
            if (!authorized) {
                log.warn("Payment authorization failed for order {}", orderId);
                // Compensate: Release inventory
                inventoryService.releaseReservation(orderId);
                sm.transitionToCancelled();
                return SagaResult.failure(orderId, "Payment authorization failed", "AUTHORIZE_PAYMENT");
            }
            log.info("Payment authorized for order {}", orderId);
            
            // Success: Transition to CONFIRMED
            sm.transitionToConfirmed();
            log.info("Order creation saga completed successfully for order {}", orderId);
            return SagaResult.success(orderId);
            
        } catch (Exception e) {
            log.error("Saga failed for order {}: {}", orderId, e.getMessage());
            rollback(orderId, sm);
            return SagaResult.failure(orderId, "Saga failed: " + e.getMessage(), "UNKNOWN");
        }
    }
    
    /**
     * Rollback all compensating transactions.
     */
    private void rollback(OrderId orderId, OrderStateMachine sm) {
        try {
            inventoryService.releaseReservation(orderId);
            log.info("Released inventory reservation for order {}", orderId);
        } catch (Exception e) {
            log.error("Failed to release inventory for order {}: {}", orderId, e.getMessage());
        }
        
        try {
            sm.transitionToCancelled();
        } catch (Exception e) {
            log.error("Failed to transition order {} to cancelled: {}", orderId, e.getMessage());
        }
    }
    
    /**
     * Result of saga execution.
     */
    public record SagaResult(
            boolean success,
            OrderId orderId,
            String message,
            String failedStep
    ) {
        public static SagaResult success(OrderId orderId) {
            return new SagaResult(true, orderId, "Saga completed successfully", null);
        }
        
        public static SagaResult failure(OrderId orderId, String message, String failedStep) {
            return new SagaResult(false, orderId, message, failedStep);
        }
    }
    
    /**
     * Inventory service port — to be implemented by infrastructure adapter.
     */
    public interface InventoryService {
        boolean reserveItems(OrderId orderId, List<UUID> productIds);
        void releaseReservation(OrderId orderId);
    }
    
    /**
     * Payment service port — to be implemented by infrastructure adapter.
     */
    public interface PaymentService {
        boolean authorizePayment(OrderId orderId, String customerId, BigDecimal amount);
        void voidAuthorization(OrderId orderId);
    }
}
