package com.example.orderservice.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
