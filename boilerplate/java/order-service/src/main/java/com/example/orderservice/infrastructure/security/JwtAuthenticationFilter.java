package com.example.orderservice.infrastructure.security;

import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenParser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenParser tokenParser;

    public JwtAuthenticationFilter(TokenParser tokenParser) {
        this.tokenParser = tokenParser;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        Optional<UserId> userIdOpt = tokenParser.parseUserId(token);

        if (userIdOpt.isPresent() && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserId userId = userIdOpt.get();
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userId.getValue().toString(), null, Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"))
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
