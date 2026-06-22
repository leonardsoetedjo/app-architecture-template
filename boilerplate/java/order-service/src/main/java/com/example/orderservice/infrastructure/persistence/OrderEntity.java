package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.example.orderservice.domain.models.OrderState;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity {
    @Id
    private UUID id;
    private UUID customerId;
    private OffsetDateTime createdAt;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderState status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items;
}
