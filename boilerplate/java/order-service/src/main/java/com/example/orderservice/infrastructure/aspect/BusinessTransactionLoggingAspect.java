package com.example.orderservice.infrastructure.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class BusinessTransactionLoggingAspect {

    private static final Logger LOG = LoggerFactory.getLogger(BusinessTransactionLoggingAspect.class);

    @Pointcut("within(com.example.orderservice.application.usecases..*) || " +
              "within(com.example.orderservice.domain.services..*) || " +
              "within(com.example.orderservice.infrastructure.persistence..*)")
    public void monitoredLayer() {}

    @Around("monitoredLayer()")
    public Object logTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String traceId = MDC.get("traceId");
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        LOG.info("TX_START {}.{} | traceId: {}", className, methodName, traceId);
        long start = System.nanoTime();
        try {
            Object result = joinPoint.proceed();
            long duration = (System.nanoTime() - start) / 1_000_000;
            LOG.info("TX_END {}.{} | traceId: {} | durationMs: {}",
                    className, methodName, traceId, duration);
            return result;
        } catch (Exception e) {
            long duration = (System.nanoTime() - start) / 1_000_000;
            LOG.error("TX_FAIL {}.{} | traceId: {} | durationMs: {} | error: {}",
                    className, methodName, traceId, duration, e.getMessage());
            throw e;
        }
    }
}
