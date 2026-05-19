package com.example.common.infrastructure.http;

/**
 * Exception thrown for MTLS certificate failures.
 */
public class MTLSException extends RuntimeException {
    public MTLSException(String message) {
        super(message);
    }
}
