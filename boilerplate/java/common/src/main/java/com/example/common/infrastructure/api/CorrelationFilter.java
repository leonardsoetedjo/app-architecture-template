package com.example.common.infrastructure.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Adds X-Correlation-ID to requests/responses and populates MDC.
 */
@Component
public class CorrelationFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(CorrelationFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String traceId = request.getHeader("X-Correlation-ID");
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        try (MDC.MDCCloseable closeable = MDC.putCloseable("traceId", traceId)) {
            MDC.put("userId", request.getHeader("X-User-Id"));
            MDC.put("tenantId", request.getHeader("X-Tenant-Id"));

            LOG.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            response.setHeader("X-Correlation-ID", traceId);
        }
    }
}
