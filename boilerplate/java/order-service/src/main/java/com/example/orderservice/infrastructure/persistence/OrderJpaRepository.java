package com.example.orderservice.infrastructure.persistence;

import com.example.orderservice.domain.models.OrderState;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderJpaRepository extends JpaRepository<OrderEntity, UUID> {

    Optional<OrderEntity> findByIdAndDeletedAtIsNull(UUID id);

    List<OrderEntity> findByCustomerIdAndDeletedAtIsNull(UUID customerId, Pageable pageable);

    List<OrderEntity> findByCustomerIdAndStatusAndDeletedAtIsNull(UUID customerId, OrderState status, Pageable pageable);

    long countByCustomerIdAndDeletedAtIsNull(UUID customerId);

    long countByCustomerIdAndStatusAndDeletedAtIsNull(UUID customerId, OrderState status);

    long countByDeletedAtIsNull();

    boolean existsByIdAndDeletedAtIsNull(UUID id);

    @Modifying
    @Query("UPDATE OrderEntity o SET o.status = :status WHERE o.id = :id AND o.deletedAt IS NULL")
    int updateStatusById(@Param("id") UUID id, @Param("status") OrderState status);

    @Modifying
    @Query("UPDATE OrderEntity o SET o.deletedAt = :deletedAt WHERE o.id = :id AND o.deletedAt IS NULL")
    int softDeleteById(@Param("id") UUID id, @Param("deletedAt") OffsetDateTime deletedAt);
}
