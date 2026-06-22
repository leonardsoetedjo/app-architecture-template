package com.example.orderservice.infrastructure.config;

import com.example.orderservice.application.usecases.AuthenticateUserUseCase;
import com.example.orderservice.application.usecases.AuthenticateUserUseCaseImpl;
import com.example.orderservice.application.usecases.GetCurrentUserUseCase;
import com.example.orderservice.application.usecases.GetCurrentUserUseCaseImpl;
import com.example.orderservice.application.usecases.GetOrderUseCaseImpl;
import com.example.orderservice.application.usecases.ListOrdersUseCase;
import com.example.orderservice.application.usecases.ListOrdersUseCaseImpl;
import com.example.orderservice.application.usecases.PlaceOrderUseCase;
import com.example.orderservice.application.usecases.PlaceOrderUseCaseImpl;
import com.example.orderservice.application.usecases.RegisterUserUseCase;
import com.example.orderservice.application.usecases.RegisterUserUseCaseImpl;
import com.example.orderservice.application.usecases.SoftDeleteOrderUseCaseImpl;
import com.example.orderservice.application.usecases.UpdateOrderStatusUseCaseImpl;
import com.example.orderservice.domain.ports.EventPublisher;
import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.PasswordHasher;
import com.example.orderservice.domain.ports.TokenGenerator;
import com.example.orderservice.domain.ports.UserRepository;
import com.example.orderservice.domain.services.OrderPlacementService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationConfig {

    @Bean
    public OrderPlacementService orderPlacementService(OrderRepository orderRepository) {
        return new OrderPlacementService(orderRepository);
    }

    @Bean
    public PlaceOrderUseCase placeOrderUseCase(
            OrderPlacementService orderPlacementService,
            EventPublisher eventPublisher) {
        return new PlaceOrderUseCaseImpl(orderPlacementService, eventPublisher);
    }

    @Bean
    public ListOrdersUseCase listOrdersUseCase(OrderRepository orderRepository) {
        return new ListOrdersUseCaseImpl(orderRepository);
    }

    @Bean
    public GetOrderUseCaseImpl getOrderUseCase(OrderRepository orderRepository) {
        return new GetOrderUseCaseImpl(orderRepository);
    }

    @Bean
    public UpdateOrderStatusUseCaseImpl updateOrderStatusUseCase(OrderRepository orderRepository) {
        return new UpdateOrderStatusUseCaseImpl(orderRepository);
    }

    @Bean
    public SoftDeleteOrderUseCaseImpl softDeleteOrderUseCase(OrderRepository orderRepository) {
        return new SoftDeleteOrderUseCaseImpl(orderRepository);
    }

    @Bean
    public AuthenticateUserUseCase authenticateUserUseCase(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            TokenGenerator tokenGenerator,
            EventPublisher eventPublisher) {
        return new AuthenticateUserUseCaseImpl(userRepository, passwordHasher, tokenGenerator, eventPublisher);
    }

    @Bean
    public RegisterUserUseCase registerUserUseCase(
            UserRepository userRepository,
            PasswordHasher passwordHasher,
            EventPublisher eventPublisher) {
        return new RegisterUserUseCaseImpl(userRepository, passwordHasher, eventPublisher);
    }

    @Bean
    public GetCurrentUserUseCase getCurrentUserUseCase(UserRepository userRepository) {
        return new GetCurrentUserUseCaseImpl(userRepository);
    }
}
