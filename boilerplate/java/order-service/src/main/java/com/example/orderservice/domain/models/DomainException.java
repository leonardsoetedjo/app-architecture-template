package com.example.orderservice.domain.models;

public class DomainException extends RuntimeException {
    private final String code;

    public DomainException(String message) {
        super(message);
        this.code = "DOMAIN_ERROR";
    }

    public DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
