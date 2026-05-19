package com.example.orderservice.infrastructure.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class OrderServiceLoggingAspect {

    private static final Logger LOG = LoggerFactory.getLogger(OrderServiceLoggingAspect.class);

    @Pointcut("within(com.example.orderservice.domain.services..*)")
    public void domainServiceLayer() {}

    @Around("domainServiceLayer()")
    public Object logDomainServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String traceId = org.slf4j.MDC.get("traceId");

        LOG.info("DOMAIN - Executing {}.{} with traceId: {}", className, methodName, traceId);
        try {
            Object result = joinPoint.proceed();
            LOG.info("DOMAIN - Completed {}.{} - traceId: {}", className, methodName, traceId);
            return result;
        } catch (Exception e) {
            LOG.error("DOMAIN - Error in {}.{} - traceId: {} - Exception: {}", className, methodName, traceId, e.getMessage());
            throw e;
        }
    }
}
