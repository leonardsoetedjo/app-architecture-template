package com.example.common.infrastructure.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive logging aspect for measuring method execution times.
 *
 * This aspect provides timing for all layers:
 * - CONTROLLER: REST endpoints
 * - USECASE: Application use cases (orchestration)
 * - DOMAIN: Domain services (business logic)
 * - REPOSITORY: Data access layer
 *
 * All timing entries include the traceId from MDC for distributed tracing.
 *
 * Example log output:
 * ```
 * INFO  CONTROLLER - OrderController.createOrder | traceId: abc123 | args: CreateOrderCommand(...)
 * INFO  USECASE    - PlaceOrderUseCaseImpl.execute | traceId: abc123 | args: CreateOrderCommand(...)
 * INFO  DOMAIN     - OrderPlacementService.placeOrder | traceId: abc123 | args: (customerId, items...)
 * INFO  REPOSITORY - JpaOrderRepository.save | traceId: abc123 | args: Order(...)
 * INFO  REPOSITORY - JpaOrderRepository.save | traceId: abc123 | duration: 45ms
 * INFO  DOMAIN     - OrderPlacementService.placeOrder | traceId: abc123 | duration: 52ms
 * INFO  USECASE    - PlaceOrderUseCaseImpl.execute | traceId: abc123 | duration: 68ms
 * INFO  CONTROLLER - OrderController.createOrder | traceId: abc123 | duration: 75ms
 * ```
 */
@Slf4j
@Aspect
@Component
public class PerformanceLoggingAspect {

    /**
     * Pointcut for controller layer (REST endpoints).
     */
    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerLayer() {}

    /**
     * Pointcut for use case layer (application orchestration).
     */
    @Pointcut("within(com.example..application.usecases..*)")
    public void useCaseLayer() {}

    /**
     * Pointcut for domain services.
     */
    @Pointcut("within(com.example..domain.services..*)")
    public void domainServiceLayer() {}

    /**
     * Pointcut for repository layer (data access).
     */
    @Pointcut("within(@org.springframework.stereotype.Repository *)")
    public void repositoryLayer() {}

    /**
     * Log controller method execution time.
     */
    @Around("controllerLayer()")
    public Object logControllerExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("CONTROLLER", joinPoint);
    }

    /**
     * Log use case method execution time.
     */
    @Around("useCaseLayer()")
    public Object logUseCaseExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("USECASE", joinPoint);
    }

    /**
     * Log domain service method execution time.
     */
    @Around("domainServiceLayer()")
    public Object logDomainServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("DOMAIN", joinPoint);
    }

    /**
     * Log repository method execution time.
     */
    @Around("repositoryLayer()")
    public Object logRepositoryExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("REPOSITORY", joinPoint);
    }

    /**
     * Core method execution timing logic.
     *
     * @param layer The layer name (CONTROLLER, USECASE, DOMAIN, REPOSITORY)
     * @param joinPoint The join point being logged
     * @return The method result
     * @throws Throwable If the method throws an exception
     */
    private Object logMethodExecution(String layer, ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        // Ensure we have a traceId even for internal calls
        String traceId = MDC.get("traceId");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
            MDC.put("traceId", traceId);
        }

        long startTime = System.nanoTime();
        try {
            log.info("START {} - {}.{} | traceId: {} | args: {}", layer, className, methodName, traceId, joinPoint.getArgs());
            Object result = joinPoint.proceed();
            long durationNanos = System.nanoTime() - startTime;
            long durationMs = TimeUnit.NANOSECONDS.toMillis(durationNanos);

            log.info("END {} - {}.{} | traceId: {} | duration: {}ms | result: {}", layer, className, methodName, traceId, durationMs, result);
            return result;
        } catch (Throwable throwable) {
            long durationNanos = System.nanoTime() - startTime;
            long durationMs = TimeUnit.NANOSECONDS.toMillis(durationNanos);

            log.error("FAIL {} - {}.{} | traceId: {} | duration: {}ms | error: {}", layer, className, methodName, traceId, durationMs, throwable.getMessage());
            throw throwable;
        }
        // MDC is managed by CorrelationFilter at request boundary
        // We don't clear it here to maintain correlation across layers
    }
}
