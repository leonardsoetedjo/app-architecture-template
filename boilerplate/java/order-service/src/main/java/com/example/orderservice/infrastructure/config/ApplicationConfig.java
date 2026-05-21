package com.example.orderservice.infrastructure.config;

import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import com.example.orderservice.application.usecases.PlaceOrderUseCaseImpl;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.services.OrderPlacementService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Application bean wiring.
 * Keeps Spring annotations out of domain and application layers.
 */
@Configuration
public class ApplicationConfig {

    @Bean
    public OrderPlacementService orderPlacementService(OrderRepository orderRepository) {
        return new OrderPlacementService(orderRepository);
    }

    @Bean
    public PlaceOrderUseCase placeOrderUseCase(OrderPlacementService orderPlacementService) {
        return new PlaceOrderUseCaseImpl(orderPlacementService);
    }
}
