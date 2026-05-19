package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class JpaOrderRepository implements OrderRepository {
    private final OrderJpaRepository jpaRepository;

    public JpaOrderRepository(OrderJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Order save(Order order) {
        List<OrderItemEntity> itemEntities = new ArrayList<>();
        for (OrderItem item : order.items()) {
            itemEntities.add(new OrderItemEntity(UUID.randomUUID(), null, item.productId(), item.quantity(), item.unitPrice()));
        }
        OrderEntity entity = new OrderEntity(order.id().value(), order.customerId(), order.createdAt(), order.status(), itemEntities);
        for (OrderItemEntity i : entity.getItems()) {
            i.setOrder(entity);
        }

        OrderEntity saved = jpaRepository.save(entity);

        return toDomain(saved);
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpaRepository.findById(id.value()).map(this::toDomain);
    }

    private Order toDomain(OrderEntity entity) {
        return new Order(
            new OrderId(entity.getId()),
            entity.getCustomerId(),
            entity.getItems().stream()
                .map(i -> new OrderItem(i.getProductId(), i.getQuantity(), i.getUnitPrice()))
                .toList(),
            entity.getCreatedAt(),
            entity.getStatus()
        );
    }
}
