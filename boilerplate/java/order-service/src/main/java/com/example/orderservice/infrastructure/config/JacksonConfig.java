package com.example.orderservice.infrastructure.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.math.BigDecimal;

/**
 * Jackson configuration that serializes BigDecimal as string (not number).
 *
 * <p>Prevents IEEE 754 precision loss when Java {@code BigDecimal} values
 * cross the wire to TypeScript / JavaScript frontends.
 *
 * <p>Example:
 * <pre>{@code
 *   // Before (default Jackson): 1000.99 → 1000.9899999999999 (JSON number)
 *   // After (this config):      1000.99 → "1000.99" (JSON string)
 * }</pre>
 */
@Configuration
public class JacksonConfig {

    /**
     * Register a global serializer so every {@code BigDecimal} field in
     * every DTO is emitted as a JSON string without annotating each field.
     */
    @Bean
    @Primary
    public SimpleModule bigDecimalAsStringModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(BigDecimal.class, new JsonSerializer<>() {
            @Override
            public void serialize(BigDecimal value, JsonGenerator gen, SerializerProvider serializers)
                    throws IOException {
                gen.writeString(value.toPlainString());
            }
        });
        return module;
    }
}
