package com.example.common.infrastructure.http;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Simple HTTP Client Configuration with WebClient.
 *
 * For mTLS, add an SslContext bean and wire it into the WebClient builder.
 */
@Configuration
public class ExternalHttpClientConfig {

    @Bean
    @ConditionalOnProperty(name = "external-api.enabled", havingValue = "true", matchIfMissing = false)
    public WebClient externalWebClient() {
        return WebClient.builder()
                .baseUrl("https://api.example.com")
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "external-api.enabled", havingValue = "true", matchIfMissing = false)
    public ExternalServiceClient externalServiceClient(WebClient webClient) {
        return new ExternalServiceClient(webClient);
    }
}
