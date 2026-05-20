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
        for (OrderItem item : order.getItems()) {
            itemEntities.add(new OrderItemEntity(UUID.randomUUID(), null, item.getProductId(), item.getQuantity(), item.getUnitPrice()));
        }
        OrderEntity entity = new OrderEntity(order.getId().getValue(), order.getCustomerId(), order.getCreatedAt(), order.getStatus(), itemEntities);
        for (OrderItemEntity i : entity.getItems()) {
            i.setOrder(entity);
        }

        OrderEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpaRepository.findById(id.getValue()).map(this::toDomain);
    }

    @Override
    public List<Order> findAll() {
        return jpaRepository.findAll().stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCustomerId(UUID customerId) {
        return jpaRepository.findByCustomerId(customerId).stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public void deleteById(OrderId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public boolean existsById(OrderId id) {
        return jpaRepository.existsById(id.getValue());
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
