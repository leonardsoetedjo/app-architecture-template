package com.example.orderservice.infrastructure.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
public class BusinessTransactionLoggingAspect {

    private static final Logger LOG = LoggerFactory.getLogger(BusinessTransactionLoggingAspect.class);

    @Pointcut("within(com.example.orderservice.application.usecases..*)")
    public void useCaseLayer() {}

    @Pointcut("within(com.example.orderservice.domain.services..*)")
    public void domainServiceLayer() {}

    @Pointcut("within(com.example.orderservice.infrastructure.persistence..*)")
    public void repositoryLayer() {}

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

    private String startTransaction(String layer, ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String traceId = org.slf4j.MDC.get("traceId");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
            org.slf4j.MDC.put("traceId", traceId);
        }

        LOG.info("TX_START {} - {}.{} | traceId: {}", layer, className, methodName, traceId);
        return traceId;
    }

    private void endTransaction(String layer, ProceedingJoinPoint joinPoint, String transactionId) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        LOG.info("TX_END {} - {}.{} | traceId: {}", layer, className, methodName, transactionId);
    }

    private void failTransaction(String layer, ProceedingJoinPoint joinPoint, String transactionId, Exception e) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        LOG.error("TX_FAIL {} - {}.{} | traceId: {} | error: {}",
                layer, className, methodName, transactionId, e.getMessage());
    }
}
