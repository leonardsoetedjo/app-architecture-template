package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class JpaOrderRepository implements OrderRepository {
    private final OrderJpaRepository jpaRepository;

    @Override
    public Order save(Order order) {
        // Map Domain -> Entity
        OrderEntity entity = OrderEntity.builder()
            .id(order.id().value())
            .customerId(order.customerId())
            .createdAt(order.createdAt())
            .status(order.status())
            .items(order.items().stream()
                .map(item -> OrderItemEntity.builder()
                    .id(UUID.randomUUID())
                    .order(null) // set in loop
                    .productId(item.productId())
                    .quantity(item.quantity())
                    .unitPrice(item.unitPrice())
                    .build())
                .collect(Collectors.toList()))
            .build();

        // Set back-references
        entity.getItems().forEach(i -> i.setOrder(entity));

        OrderEntity saved = jpaRepository.save(entity);

        // Map Entity -> Domain
        return new Order(
            new OrderId(saved.getId()),
            saved.getCustomerId(),
            saved.getItems().stream()
                .map(i -> new OrderItem(i.getProductId(), i.getQuantity(), i.getUnitPrice()))
                .collect(Collectors.toList()),
            saved.getCreatedAt(),
            saved.getStatus()
        );
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpaRepository.findById(id.value())
            .map(entity -> new Order(
                new OrderId(entity.getId()),
                entity.getCustomerId(),
                entity.getItems().stream()
                    .map(i -> new OrderItem(i.getProductId(), i.getQuantity(), i.getUnitPrice()))
                    .collect(Collectors.toList()),
                entity.getCreatedAt(),
                entity.getStatus()
            ));
    }

    public interface OrderJpaRepository extends org.springframework.data.jpa.repository.JpaRepository<OrderEntity, UUID> {}
}
