package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.UserId;

public interface LogoutUseCase {
    void execute(UserId userId, String token);
}
 boilerplate/java/order-service/src/main/java/com/example/orderservice/application/usecases/LogoutUseCaseImpl.java boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/api/AuthController.java boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/security/JwtAuthenticationFilter.java boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/api/AuthControllerTest.java boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/security/JwtAuthenticationFilterTest.java boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/security/TestFilterConfig.java boilerplate/java/order-service/src/test/java/com/example/orderservice/infrastructure/security/TokenBlacklistIntegrationTest.java docs/02-java/04-adrs/04-jwt-security.md
