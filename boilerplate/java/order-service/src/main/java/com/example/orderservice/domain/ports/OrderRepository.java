package com.example.orderservice.domain.ports;

import com.example.orderservice.domain.models.Order;
import com.example.orderservice.domain.models.OrderId;
import com.example.orderservice.domain.models.OrderState;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository port for Order aggregate.
 *
 * All queries excluding {@link #findByIdIncludingDeleted} filter out
 * soft-deleted orders (deleted_at IS NULL).
 */
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(OrderId id);
    Optional<Order> findByIdIncludingDeleted(OrderId id);
    List<Order> findAll();
    List<Order> findAllIncludingDeleted();

    /**
     * Find paginated orders for a customer, filtering by status and excluding soft-deleted.
     *
     * @param customerId the owning customer
     * @param status     optional status filter (null = all statuses)
     * @param page       0-based page number
     * @param size       page size
     * @return page of orders sorted by createdAt descending
     */
    List<Order> findByCustomerId(UUID customerId, OrderState status, int page, int size);

    long countByCustomerId(UUID customerId, OrderState status);
    void deleteById(OrderId id);
    long count();
    boolean existsById(OrderId id);
}
