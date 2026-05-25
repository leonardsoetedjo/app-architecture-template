package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.OrderState;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for order state persistence.
 */
@Entity
@Table(name = "order_state")
public class OrderStateEntity {
    
    @Id
    @Column(name = "order_id")
    private UUID orderId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 50)
    private OrderState currentState;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", length = 50)
    private OrderState previousState;
    
    @Column(name = "state_changed_at", nullable = false)
    @CreationTimestamp
    private Instant stateChangedAt;
    
    @Version
    @Column(name = "version", nullable = false)
    private int version;
    
    // Default constructor for JPA
    public OrderStateEntity() {}
    
    public OrderStateEntity(UUID orderId, OrderState currentState) {
        this.orderId = orderId;
        this.currentState = currentState;
        this.stateChangedAt = Instant.now();
        this.version = 0;
    }
    
    // Getters and setters
    public UUID getOrderId() { return orderId; }
    public OrderState getCurrentState() { return currentState; }
    public OrderState getPreviousState() { return previousState; }
    public Instant getStateChangedAt() { return stateChangedAt; }
    public int getVersion() { return version; }
    
    public void setCurrentState(OrderState currentState) {
        this.previousState = this.currentState;
        this.currentState = currentState;
        this.stateChangedAt = Instant.now();
    }
    
    public void setPreviousState(OrderState previousState) {
        this.previousState = previousState;
    }
}
