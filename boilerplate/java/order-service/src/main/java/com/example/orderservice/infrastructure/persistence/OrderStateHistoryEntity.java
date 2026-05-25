package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.OrderState;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * JPA entity for order state transition history.
 */
@Entity
@Table(name = "order_state_history")
public class OrderStateHistoryEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "order_id", nullable = false)
    private UUID orderId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "from_state", length = 50)
    private OrderState fromState;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "to_state", nullable = false, length = 50)
    private OrderState toState;
    
    @Column(name = "event", nullable = false, length = 50)
    private String event;
    
    @Column(name = "triggered_by", length = 100)
    private String triggeredBy;
    
    @Column(name = "metadata")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;
    
    // Default constructor for JPA
    public OrderStateHistoryEntity() {}
    
    public OrderStateHistoryEntity(
        UUID orderId,
        OrderState fromState,
        OrderState toState,
        String event,
        String triggeredBy,
        Map<String, Object> metadata
    ) {
        this.orderId = orderId;
        this.fromState = fromState;
        this.toState = toState;
        this.event = event;
        this.triggeredBy = triggeredBy;
        this.metadata = metadata;
        this.createdAt = Instant.now();
    }
    
    // Getters
    public UUID getId() { return id; }
    public UUID getOrderId() { return orderId; }
    public OrderState getFromState() { return fromState; }
    public OrderState getToState() { return toState; }
    public String getEvent() { return event; }
    public String getTriggeredBy() { return triggeredBy; }
    public Map<String, Object> getMetadata() { return metadata; }
    public Instant getCreatedAt() { return createdAt; }
}
