package com.example.orderservice.infrastructure.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.aop.aspectj.Aspect;
import org.springframework.aop.aspectj.annotation.AfterReturning;
import org.springframework.aop.aspectj.annotation.Around;
import org.springframework.aop.aspectj.annotation.ProceedingJoinPoint;
import org.springframework.aop.aspectj.annotation.Pointcut;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Pointcut("execution(* com.example.orderservice.application.usecases.*.*(..))")
    public void applicationLayer() {}

    @Around("applicationLayer()")
    public Object logUseCaseExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        // Ensure we have a traceId even for internal calls not triggered by HTTP
        if (MDC.get("traceId") == null) {
            MDC.put("traceId", UUID.randomUUID().toString());
        }

        long start = System.currentTimeMillis();
        try {
            log.info("Executing UseCase: {}.{} - Params: {}", className, methodName, joinPoint.getArgs());
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            log.info("Completed UseCase: {}.{} in {}ms", className, methodName, duration);
            return result;
        } catch (Exception e) {
            log.error("Error in UseCase: {}.{} - Message: {}", className, methodName, e.getMessage());
            throw e;
        } finally {
            // We do NOT clear the MDC here because it's managed by the Filter at the request boundary
        }
    }
}
