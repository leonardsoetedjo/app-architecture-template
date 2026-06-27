package com.example.orderservice.contract;

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

/**
 * Pact Provider Verification Test for Order Service.
 *
 * Validates that the actual Spring Boot implementation satisfies the contract
 * defined by the ReactJS frontend consumer.
 *
 * @see boilerplate/reactjs/tests/pact/orders.pact.test.ts (consumer)
 * @see docs/01-agnostic/01-standards/06-api-contract.md §5 (contract testing)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Provider("order-service")
@PactFolder("../reactjs/tests/pact/contracts")
class OrderContractVerificationTest {

    @LocalServerPort
    int port;

    @BeforeEach
    void setUp(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", port));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        context.verifyInteraction();
    }

    @State("order with ID 550e8400-e29b-41d4-a716-446655440000 exists")
    void orderExistsState() {
        // Seed the database with the expected order
        // In a real implementation, use a test data builder
    }

    @State("no order with ID non-existent-order exists")
    void orderDoesNotExistState() {
        // Ensure no order exists with this ID
        // Database is cleaned between tests by @Transactional or manual cleanup
    }

    @State("products are available")
    void productsAvailableState() {
        // Seed products so the order can be placed
    }
}
