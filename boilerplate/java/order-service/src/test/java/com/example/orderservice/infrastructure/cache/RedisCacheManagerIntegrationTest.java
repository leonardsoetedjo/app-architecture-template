package com.example.orderservice.infrastructure.cache;

import com.example.orderservice.domain.ports.CacheManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for RedisCacheManager with Testcontainers.
 */
@Testcontainers
@SpringBootTest
class RedisCacheManagerIntegrationTest {
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>(
        DockerImageName.parse("redis:7-alpine")
    ).withExposedPorts(6379);
    
    @DynamicPropertySource
    static void configureRedis(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379).toString());
    }
    
    @Autowired
    private CacheManager cacheManager;
    
    @BeforeEach
    void setUp() {
        // Clear cache before each test
        cacheManager.clearAll();
    }
    
    @Test
    @DisplayName("Should put and get value from cache")
    void shouldPutAndGetFromCache() {
        // Arrange
        String key = "test:key";
        String value = "test-value";
        
        // Act
        cacheManager.put(key, value);
        Optional<String> result = cacheManager.get(key, String.class);
        
        // Assert
        assertThat(result).isPresent().hasValue(value);
    }
    
    @Test
    @DisplayName("Should return empty optional for non-existent key")
    void shouldReturnEmptyForNonExistentKey() {
        // Act
        Optional<String> result = cacheManager.get("non-existent", String.class);
        
        // Assert
        assertThat(result).isEmpty();
    }
    
    @Test
    @DisplayName("Should respect TTL")
    void shouldRespectTTL() throws InterruptedException {
        // Arrange
        String key = "test:ttl";
        String value = "ttl-value";
        Duration ttl = Duration.ofSeconds(2);
        
        // Act
        cacheManager.put(key, value, ttl);
        
        // Assert: Initially present
        assertThat(cacheManager.get(key, String.class)).isPresent();
        
        // Wait for TTL to expire
        Thread.sleep(2500);
        
        // Assert: Expired
        assertThat(cacheManager.get(key, String.class)).isEmpty();
    }
    
    @Test
    @DisplayName("Should evict key from cache")
    void shouldEvictKey() {
        // Arrange
        String key = "test:evict";
        cacheManager.put(key, "value");
        
        // Act
        cacheManager.evict(key);
        
        // Assert
        assertThat(cacheManager.get(key, String.class)).isEmpty();
    }
    
    @Test
    @DisplayName("Should check if key exists")
    void shouldCheckIfExists() {
        // Arrange
        String key = "test:exists";
        cacheManager.put(key, "value");
        
        // Act & Assert
        assertThat(cacheManager.contains(key)).isTrue();
        assertThat(cacheManager.contains("non-existent")).isFalse();
    }
    
    @Test
    @DisplayName("Should clear pattern")
    void shouldClearPattern() {
        // Arrange
        cacheManager.put("order:1:full", "order1");
        cacheManager.put("order:2:full", "order2");
        cacheManager.put("user:1:profile", "user1");
        
        // Act
        cacheManager.clearPattern("order:*");
        
        // Assert
        assertThat(cacheManager.get("order:1:full", String.class)).isEmpty();
        assertThat(cacheManager.get("order:2:full", String.class)).isEmpty();
        assertThat(cacheManager.get("user:1:profile", String.class)).isPresent();
    }
    
    @Test
    @DisplayName("Should handle complex objects")
    void shouldHandleComplexObjects() {
        // Arrange
        TestObject obj = new TestObject("id-123", "Test Name", 42);
        String key = "test:object";
        
        // Act
        cacheManager.put(key, obj);
        Optional<TestObject> result = cacheManager.get(key, TestObject.class);
        
        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().id).isEqualTo("id-123");
        assertThat(result.get().name).isEqualTo("Test Name");
        assertThat(result.get().value).isEqualTo(42);
    }
    
    // Simple test DTO
    public static class TestObject {
        public String id;
        public String name;
        public int value;
        
        public TestObject() {} // Default constructor for JSON deserialization
        
        public TestObject(String id, String name, int value) {
            this.id = id;
            this.name = name;
            this.value = value;
        }
    }
}
