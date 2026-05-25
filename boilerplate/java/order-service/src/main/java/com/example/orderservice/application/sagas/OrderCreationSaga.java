package com.example.orderservice.application.sagas;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Order Creation Saga - Orchestrates distributed transaction for order creation.
 * 
 * Saga Flow:
 * 1. Create Order (PENDING)
 * 2. Reserve Inventory
 *    ├─ Success → Continue
 *    └─ Failure → Compensate: Cancel Order
 * 3. Authorize Payment
 *    ├─ Success → Confirm Order (CONFIRMED)
 *    └─ Failure → Compensate: Release Inventory → Cancel Order
 * 
 * This implements the **Orchestration Pattern** where a central coordinator
 * manages the saga execution and compensation.
 */
@Component
public class OrderCreationSaga {
    
    private static final Logger log = LoggerFactory.getLogger(OrderCreationSaga.class);
    
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final OrderStateService orderStateService;
    
    public OrderCreationSaga(
        InventoryService inventoryService,
        PaymentService paymentService,
        OrderStateService orderStateService
    ) {
        this.inventoryService = inventoryService;
        this.paymentService = paymentService;
        this.orderStateService = orderStateService;
    }
    
    /**
     * Execute order creation saga.
     * 
     * @param order Order to create
     * @return true if saga completed successfully
     */
    public boolean execute(Order order) {
        OrderId orderId = order.getId();
        
        try {
            log.info("Starting OrderCreationSaga for order: {}", orderId);
            
            // Step 1: Create order in PENDING state
            createOrder(order);
            
            // Step 2: Reserve inventory
            if (!reserveInventory(order)) {
                log.warn("Inventory reservation failed for order: {}", orderId);
                compensateInventoryReservation(order);
                cancelOrder(order);
                return false;
            }
            
            // Step 3: Authorize payment
            if (!authorizePayment(order)) {
                log.warn("Payment authorization failed for order: {}", orderId);
                compensatePaymentAuthorization(order);
                compensateInventoryReservation(order);
                cancelOrder(order);
                return false;
            }
            
            // Step 4: Confirm order
            confirmOrder(order);
            
            log.info("OrderCreationSaga completed successfully for order: {}", orderId);
            return true;
            
        } catch (Exception e) {
            log.error("OrderCreationSaga failed for order: {}", orderId, e);
            rollback(order);
            return false;
        }
    }
    
    // ============== Saga Steps ==============
    
    private void createOrder(Order order) {
        log.info("Step 1: Creating order {}", order.getId());
        // Order already created by this point
    }
    
    private boolean reserveInventory(Order order) {
        log.info("Step 2: Reserving inventory for order {}", order.getId());
        return inventoryService.reserveItems(
            order.getId(),
            order.getItems()
        );
    }
    
    private boolean authorizePayment(Order order) {
        log.info("Step 3: Authorizing payment for order {}", order.getId());
        return paymentService.authorizePayment(
            order.getId(),
            order.getCustomerId(),
            order.getTotalAmount()
        );
    }
    
    private void confirmOrder(Order order) {
        log.info("Step 4: Confirming order {}", order.getId());
        orderStateService.triggerEvent(order.getId(), com.example.orderservice.domain.models.OrderEvent.CONFIRM_PAYMENT);
    }
    
    private void cancelOrder(Order order) {
        log.info("Compensation: Cancelling order {}", order.getId());
        orderStateService.triggerEvent(order.getId(), com.example.orderservice.domain.models.OrderEvent.CANCEL_ORDER);
    }
    
    // ============== Compensation Actions ==============
    
    private void compensateInventoryReservation(Order order) {
        log.info("Compensation: Releasing inventory for order {}", order.getId());
        inventoryService.releaseReservation(order.getId());
    }
    
    private void compensatePaymentAuthorization(Order order) {
        log.info("Compensation: Voiding payment authorization for order {}", order.getId());
        paymentService.voidAuthorization(order.getId());
    }
    
    private void rollback(Order order) {
        log.info("Rolling back all changes for order {}", order.getId());
        try {
            compensatePaymentAuthorization(order);
        } catch (Exception e) {
            log.error("Failed to void payment: {}", e.getMessage());
        }
        try {
            compensateInventoryReservation(order);
        } catch (Exception e) {
            log.error("Failed to release inventory: {}", e.getMessage());
        }
        try {
            cancelOrder(order);
        } catch (Exception e) {
            log.error("Failed to cancel order: {}", e.getMessage());
        }
    }
    
    // ============== Service Interfaces (Ports) ==============
    
    /**
     * Inventory service port.
     * Implemented by infrastructure adapter.
     */
    public interface InventoryService {
        boolean reserveItems(OrderId orderId, java.util.List<com.example.orderservice.domain.models.OrderItem> items);
        void releaseReservation(OrderId orderId);
    }
    
    /**
     * Payment service port.
     * Implemented by infrastructure adapter.
     */
    public interface PaymentService {
        boolean authorizePayment(OrderId orderId, String customerId, java.math.BigDecimal amount);
        void voidAuthorization(OrderId orderId);
    }
}
