package com.example.orderservice.infrastructure.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Integer.MIN_VALUE + 10) // Run early, but after security filter
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Correlation-ID";
    private static final String TRACE_ID_KEY = "traceId";
    private static final String USER_ID_KEY = "userId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        MDC.put(TRACE_ID_KEY, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);

        // Extract userId from Spring Security context (set by JwtAuthenticationFilter)
        // JwtAuthenticationFilter runs before this because it has higher priority
        // or is declared in SecurityConfig before this filter.
        // Alternatively, we can read it from the request attribute set by JwtAuthenticationFilter.
        String userId = (String) request.getAttribute("userId");
        if (userId != null) {
            MDC.put(USER_ID_KEY, userId);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_KEY);
            MDC.remove(USER_ID_KEY);
            // Never call MDC.clear() here — other filters/aspects may still need MDC on the way out
        }
    }
}
