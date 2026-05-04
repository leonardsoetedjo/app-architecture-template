package com.example.orderservice.infrastructure.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * Order Service specific aspect for adding domain-level logging.
 *
 * This aspect complements the common PerformanceLoggingAspect by adding
 * domain-specific context to log entries.
 */
@Slf4j
@Aspect
@Component
public class OrderServiceLoggingAspect {

    /**
     * Pointcut for all domain service methods.
     */
    @Pointcut("within(com.example.orderservice.domain.services..*)")
    public void domainServiceLayer() {}

    /**
     * Log domain service execution with business context.
     */
    @Around("domainServiceLayer()")
    public Object logDomainServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        log.info("DOMAIN - Executing {}.{} with traceId: {}", className, methodName, getTraceId());
        try {
            Object result = joinPoint.proceed();
            log.info("DOMAIN - Completed {}.{} - traceId: {}", className, methodName, getTraceId());
            return result;
        } catch (Exception e) {
            log.error("DOMAIN - Error in {}.{} - traceId: {} - Exception: {}", className, methodName, getTraceId(), e.getMessage());
            throw e;
        }
    }

    /**
     * Helper method to get traceId from MDC.
     */
    private String getTraceId() {
        return org.slf4j.MDC.get("traceId");
    }
}
