package com.example.orderservice.domain.models;

public class InvalidOrderException extends RuntimeException {
    private final String code;

    public InvalidOrderException(String message) {
        super(message);
        this.code = "INVALID_ORDER";
    }

    public String getCode() {
        return code;
    }
}
