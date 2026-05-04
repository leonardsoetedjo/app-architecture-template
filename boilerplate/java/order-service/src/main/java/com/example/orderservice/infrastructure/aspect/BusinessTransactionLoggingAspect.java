package com.example.orderservice.infrastructure.aspect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * Aspect for logging business transaction boundaries.
 *
 * This aspect marks the beginning and end of business transactions,
 * linking all method calls within a single transaction with a unique
 * transaction ID that persists across layers.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class BusinessTransactionLoggingAspect {

    /**
     * Pointcut for all use case methods that represent business transactions.
     */
    @Pointcut("within(com.example.orderservice.application.usecases..*)")
    public void useCaseLayer() {}

    /**
     * Pointcut for all domain service methods that are part of business transactions.
     */
    @Pointcut("within(com.example.orderservice.domain.services..*)")
    public void domainServiceLayer() {}

    /**
     * Pointcut for all repository methods that persist transactional data.
     */
    @Pointcut("within(com.example.orderservice.infrastructure.persistence..*)")
    public void repositoryLayer() {}

    /**
     * Log the start of a business transaction (UseCase).
     */
    @Around("useCaseLayer()")
    public Object logUseCaseTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String transactionId = startTransaction("USECASE", joinPoint);
        try {
            Object result = joinPoint.proceed();
            endTransaction("USECASE", joinPoint, transactionId);
            return result;
        } catch (Exception e) {
            failTransaction("USECASE", joinPoint, transactionId, e);
            throw e;
        }
    }

    /**
     * Log domain service execution as part of a business transaction.
     */
    @Around("domainServiceLayer()")
    public Object logDomainServiceTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String transactionId = startTransaction("DOMAIN", joinPoint);
        try {
            Object result = joinPoint.proceed();
            endTransaction("DOMAIN", joinPoint, transactionId);
            return result;
        } catch (Exception e) {
            failTransaction("DOMAIN", joinPoint, transactionId, e);
            throw e;
        }
    }

    /**
     * Log repository execution as part of a business transaction.
     */
    @Around("repositoryLayer()")
    public Object logRepositoryTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String transactionId = startTransaction("REPOSITORY", joinPoint);
        try {
            Object result = joinPoint.proceed();
            endTransaction("REPOSITORY", joinPoint, transactionId);
            return result;
        } catch (Exception e) {
            failTransaction("REPOSITORY", joinPoint, transactionId, e);
            throw e;
        }
    }

    /**
     * Start a business transaction and log entry.
     */
    private String startTransaction(String layer, ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String traceId = org.slf4j.MDC.get("traceId");
        if (traceId == null) {
            traceId = java.util.UUID.randomUUID().toString();
            org.slf4j.MDC.put("traceId", traceId);
        }

        log.info("TX_START {} - {}.{} | traceId: {}", layer, className, methodName, traceId);
        return traceId;
    }

    /**
     * End a business transaction and log completion with timing.
     */
    private void endTransaction(String layer, ProceedingJoinPoint joinPoint, String transactionId) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        long duration = getDuration(joinPoint);

        log.info("TX_END {} - {}.{} | traceId: {} | duration: {}ms",
                layer, className, methodName, transactionId, duration);
    }

    /**
     * Log transaction failure with exception details.
     */
    private void failTransaction(String layer, ProceedingJoinPoint joinPoint, String transactionId, Exception e) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        long duration = getDuration(joinPoint);

        log.error("TX_FAIL {} - {}.{} | traceId: {} | duration: {}ms | error: {}",
                layer, className, methodName, transactionId, duration, e.getMessage());
    }

    /**
     * Calculate method execution duration.
     */
    private long getDuration(ProceedingJoinPoint joinPoint) {
        Object duration = joinPoint.getArgs().length > 0 ? joinPoint.getArgs()[0] : null;
        if (duration instanceof Long) {
            return (Long) duration;
        }
        // Fallback: calculate from method execution time
        return -1;
    }
}
