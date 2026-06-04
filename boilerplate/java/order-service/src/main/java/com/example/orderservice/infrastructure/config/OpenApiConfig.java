package com.example.orderservice.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for SpringDoc.
 * 
 * Provides API documentation at:
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8080/v3/api-docs
 * 
 * Features:
 * - JWT Bearer authentication support
 * - Tagged endpoint groups
 * - Contact and license info
 */
@Configuration
public class OpenApiConfig {

    @Value("${app.name:Order Service}")
    private String appName;

    @Value("${app.version:1.0.0}")
    private String appVersion;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
            .info(new Info()
                .title(appName + " API")
                .version(appVersion)
                .description("Order Service implementing Clean Architecture with Spring Boot 3.4+" +
                    "\n\nFeatures:" +
                    "\n- Order management (create, list)" +
                    "\n- MFA configuration (TOTP, WebAuthn)" +
                    "\n- Batch job tracking" +
                    "\n- Workflow execution monitoring" +
                    "\n\n**Authentication:** JWT Bearer token required for order endpoints. " +
                    "Obtain token from `/api/v1/auth/token` endpoint.")
                .contact(new Contact()
                    .name("API Support")
                    .email("api-support@example.com")
                    .url("https://github.com/example/order-service"))
                .license(new License()
                    .name("MIT License")
                    .url("https://opensource.org/licenses/MIT")))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName,
                    new SecurityScheme()
                        .name(securitySchemeName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("JWT access token obtained from `/api/v1/auth/token` endpoint. " +
                            "In production, replace with actual authentication flow.")))
            .tags(List.of(
                new Tag().name("Orders").description("Order management endpoints"),
                new Tag().name("MFA").description("Multi-factor authentication configuration"),
                new Tag().name("Batch Jobs").description("Batch job status tracking"),
                new Tag().name("Health").description("Health check endpoints")
            ));
    }
}
