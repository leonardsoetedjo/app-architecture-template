package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.OrderState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA repository for order state persistence.
 */
@Repository
public interface OrderStateRepository extends JpaRepository<OrderStateEntity, UUID> {
    
    Optional<OrderStateEntity> findByOrderId(UUID orderId);
    
    @Modifying
    @Query("UPDATE OrderStateEntity e SET e.currentState = :state, e.version = e.version + 1 " +
           "WHERE e.orderId = :orderId AND e.version = :expectedVersion")
    int updateStateWithOptimisticLocking(UUID orderId, OrderState state, int expectedVersion);
}
