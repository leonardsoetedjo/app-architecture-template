package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "outbox_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String eventType;  // e.g., "OrderPlaced"
    private String payload;    // JSON payload
    private String correlationId;  // For tracing across services
    private OffsetDateTime createdAt;
    private boolean published;
}
