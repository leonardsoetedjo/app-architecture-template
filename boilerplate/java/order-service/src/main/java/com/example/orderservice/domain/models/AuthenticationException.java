package com.example.orderservice.domain.models;

public class AuthenticationException extends DomainException {

    public AuthenticationException(String message) {
        super("AUTH_ERROR", message);
    }

    public AuthenticationException(String code, String message) {
        super(code, message);
    }
}
