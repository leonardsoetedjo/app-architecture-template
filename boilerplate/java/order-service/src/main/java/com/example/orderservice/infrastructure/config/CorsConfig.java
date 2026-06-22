package com.example.orderservice.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS configuration for local development and cross-origin requests.
 *
 * Configures allowed origins, methods, and headers for the API.
 * In production / fleet mode (Tailscale), tighten origins to the deployed frontend URL.
 *
 * Default allowed origins (dev):
 *   http://localhost:5173, http://127.0.0.1:5173, http://localhost:3000
 * Fleet mode (override via CORS_ALLOWED_ORIGINS env var):
 *   https://hermes.piranha-broadnose.ts.net, https://*.ts.net
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String originsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        String[] allowedOrigins = (originsEnv != null && !originsEnv.isBlank())
            ? originsEnv.split(",")
            : new String[]{
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000"
              };

        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
