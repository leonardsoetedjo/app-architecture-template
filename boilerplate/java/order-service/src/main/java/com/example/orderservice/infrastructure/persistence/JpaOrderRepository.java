package com.example.orderservice.infrastructure.persistence;

import java.time.ZoneOffset;
import com.example.orderservice.domain.models.*;
import com.example.orderservice.domain.ports.OrderRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
            itemEntities.add(new OrderItemEntity(
                UUID.randomUUID(), null,
                item.getProductId(), item.getQuantity(), item.getUnitPrice()
            ));
        }
        OrderEntity entity = new OrderEntity(
            order.getId().getValue(),
            order.getCustomerId(),
            order.getCreatedAt(),
            order.getConfirmedAt(),
            order.getDeletedAt(),
            order.getStatus(),
            itemEntities
        );
        for (OrderItemEntity i : entity.getItems()) {
            i.setOrder(entity);
        }

        OrderEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpaRepository.findByIdAndDeletedAtIsNull(id.getValue())
            .map(this::toDomain);
    }

    @Override
    public Optional<Order> findByIdIncludingDeleted(OrderId id) {
        return jpaRepository.findById(id.getValue())
            .map(this::toDomain);
    }

    @Override
    public List<Order> findAll() {
        return jpaRepository.findAll().stream()
            .filter(e -> e.getDeletedAt() == null)
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public List<Order> findAllIncludingDeleted() {
        return jpaRepository.findAll().stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByCustomerId(UUID customerId, OrderState status, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<OrderEntity> entities;
        if (status != null) {
            entities = jpaRepository.findByCustomerIdAndStatusAndDeletedAtIsNull(customerId, status, pageable);
        } else {
            entities = jpaRepository.findByCustomerIdAndDeletedAtIsNull(customerId, pageable);
        }
        return entities.stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public long countByCustomerId(UUID customerId, OrderState status) {
        if (status != null) {
            return jpaRepository.countByCustomerIdAndStatusAndDeletedAtIsNull(customerId, status);
        }
        return jpaRepository.countByCustomerIdAndDeletedAtIsNull(customerId);
    }

    @Override
    public void deleteById(OrderId id) {
        jpaRepository.softDeleteById(id.getValue(), java.time.OffsetDateTime.now(ZoneOffset.UTC));
    }

    @Override
    public long count() {
        return jpaRepository.countByDeletedAtIsNull();
    }

    @Override
    public boolean existsById(OrderId id) {
        return jpaRepository.existsByIdAndDeletedAtIsNull(id.getValue());
    }

    private Order toDomain(OrderEntity entity) {
        return new Order(
            new OrderId(entity.getId()),
            entity.getCustomerId(),
            entity.getItems().stream()
                .map(i -> new OrderItem(i.getProductId(), i.getQuantity(), i.getUnitPrice()))
                .toList(),
            entity.getCreatedAt(),
            entity.getStatus(),
            entity.getConfirmedAt(),
            entity.getDeletedAt()
        );
    }
}