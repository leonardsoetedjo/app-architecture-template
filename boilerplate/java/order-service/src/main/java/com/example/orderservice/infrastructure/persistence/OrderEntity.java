package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderEntity {
    @Id
    private UUID id;
    private UUID customerId;
    private OffsetDateTime createdAt;
    private String status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items;
}

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemEntity {
    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    private UUID productId;
    private int quantity;
    private double unitPrice;
}
