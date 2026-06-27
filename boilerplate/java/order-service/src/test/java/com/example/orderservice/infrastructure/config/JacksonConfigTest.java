package com.example.orderservice.infrastructure.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verify that BigDecimal serializes as JSON string.
 *
 * <p>Prevents IEEE 754 precision loss when Java {@code BigDecimal}
 * crosses the wire to TypeScript / JavaScript frontends.
 */
class JacksonConfigTest {

    private final ObjectMapper objectMapper;

    JacksonConfigTest() {
        // Build ObjectMapper with the same module registered by JacksonConfig
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JacksonConfig().bigDecimalAsStringModule());
    }

    @Test
    void bigDecimalSerializesAsString_notNumber() throws JsonProcessingException {
        BigDecimal value = new BigDecimal("1000.99");
        String json = objectMapper.writeValueAsString(value);
        assertEquals("\"1000.99\"", json,
            "BigDecimal must serialize as JSON string, not number, to preserve precision");
    }

    @Test
    void bigDecimalWithManyDecimals_serializesAsString() throws JsonProcessingException {
        BigDecimal value = new BigDecimal("0.00000001");
        String json = objectMapper.writeValueAsString(value);
        assertEquals("\"0.00000001\"", json);
    }

    @Test
    void bigDecimalInRecord_serializesCorrectly() throws JsonProcessingException {
        TestDto dto = new TestDto(new BigDecimal("9999999999.99"));
        String json = objectMapper.writeValueAsString(dto);
        assertTrue(json.contains("\"9999999999.99\""),
            "BigDecimal field in record must serialize as JSON string");
    }

    @Test
    void bigDecimalNegative_serializesAsString() throws JsonProcessingException {
        BigDecimal value = new BigDecimal("-123.45");
        String json = objectMapper.writeValueAsString(value);
        assertEquals("\"-123.45\"", json);
    }

    @Test
    void bigDecimalZero_serializesAsString() throws JsonProcessingException {
        BigDecimal value = BigDecimal.ZERO;
        String json = objectMapper.writeValueAsString(value);
        assertEquals("\"0\"", json);
    }

    // Test record with BigDecimal field
    public record TestDto(BigDecimal amount) {}
}
