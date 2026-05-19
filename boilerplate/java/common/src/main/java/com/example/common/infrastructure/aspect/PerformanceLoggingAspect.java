package com.example.common.infrastructure.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive logging aspect for measuring method execution times across layers.
 */
@Aspect
@Component
public class PerformanceLoggingAspect {

    private static final Logger LOG = LoggerFactory.getLogger(PerformanceLoggingAspect.class);

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerLayer() {}

    @Pointcut("within(com.example..application.usecases..*)")
    public void useCaseLayer() {}

    @Pointcut("within(com.example..domain.services..*)")
    public void domainServiceLayer() {}

    @Pointcut("within(@org.springframework.stereotype.Repository *)")
    public void repositoryLayer() {}

    @Around("controllerLayer()")
    public Object logControllerExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("CONTROLLER", joinPoint);
    }

    @Around("useCaseLayer()")
    public Object logUseCaseExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("USECASE", joinPoint);
    }

    @Around("domainServiceLayer()")
    public Object logDomainServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("DOMAIN", joinPoint);
    }

    @Around("repositoryLayer()")
    public Object logRepositoryExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        return logMethodExecution("REPOSITORY", joinPoint);
    }

    private Object logMethodExecution(String layer, ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        String traceId = MDC.get("traceId");
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
            MDC.put("traceId", traceId);
        }

        long startTime = System.nanoTime();
        try {
            LOG.info("START {} - {}.{} | traceId: {} | args: {}", layer, className, methodName, traceId, joinPoint.getArgs());
            Object result = joinPoint.proceed();
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);

            LOG.info("END {} - {}.{} | traceId: {} | duration: {}ms", layer, className, methodName, traceId, durationMs);
            return result;
        } catch (Throwable throwable) {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);

            LOG.error("FAIL {} - {}.{} | traceId: {} | duration: {}ms | error: {}",
                    layer, className, methodName, traceId, durationMs, throwable.getMessage());
            throw throwable;
        }
    }
}
