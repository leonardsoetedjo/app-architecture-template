package com.example.orderservice.infrastructure.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class CorrelationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Extract or generate traceId
        String traceId = request.getHeader("X-Correlation-ID");
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        // 2. Populate MDC
        try (MDC.MDCCloseable closeable = MDC.putCloseable("traceId", traceId)) {
            // In a real app, extract userId/tenantId from JWT using a SecurityContext
            MDC.put("userId", request.getHeader("X-User-Id"));
            MDC.put("tenantId", request.getHeader("X-Tenant-Id"));

            log.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());

            filterChain.doFilter(request, response);

            // Add traceId to response header for client-side tracking
            response.setHeader("X-Correlation-ID", traceId);
        }
    }
}
