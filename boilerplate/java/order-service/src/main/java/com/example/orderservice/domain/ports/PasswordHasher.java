package com.example.orderservice.domain.ports;

/**
 * Port for password hashing operations.
 * Defined in domain layer to keep authentication logic
 * independent of infrastructure hashing implementations.
 */
public interface PasswordHasher {

    /**
     * Hash a plaintext password.
     *
     * @param plaintext the raw password to hash
     * @return the hashed password string
     */
    String hash(String plaintext);

    /**
     * Verify a plaintext password against a stored hash.
     *
     * @param plaintext the raw password to check
     * @param hashed the stored hash
     * @return true if the password matches the hash
     */
    boolean matches(String plaintext, String hashed);
}
