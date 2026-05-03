package com.example.common.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.aop.aspectj.Aspect;
import org.springframework.aop.aspectj.annotation.Around;
import org.springframework.aop.aspectj.annotation.Pointcut;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Pointcut("execution(* com.example..application.usecases.*.*(..))")
    public void applicationLayer() {}

    @Around("applicationLayer()")
    public Object logUseCaseExecution(org.aspectj.lang.ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        if (MDC.get("traceId") == null) {
            MDC.put("traceId", UUID.randomUUID().toString());
        }

        long start = System.currentTimeMillis();
        try {
            log.info("Executing UseCase: {}.{} - Params: {}", className, methodName, joinPoint.getArgs());
            Object result = joinPoint.proceed();
            log.info("Completed UseCase: {}.{} in {}ms", className, methodName, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("Error in UseCase: {}.{} - Message: {}", className, methodName, e.getMessage());
            throw e;
        }
    }
}
