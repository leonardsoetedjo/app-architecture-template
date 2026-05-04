package com.example.common.infrastructure.http;

/**
 * Custom exception for mTLS-related errors.
 */
public class MTLSException extends RuntimeException {

    public MTLSException(String message) {
        super(message);
    }

    public MTLSException(String message, Throwable cause) {
        super(message, cause);
    }
}
