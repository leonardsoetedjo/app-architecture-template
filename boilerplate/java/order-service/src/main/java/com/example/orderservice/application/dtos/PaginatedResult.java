package com.example.orderservice.application.dtos;

import java.util.List;

public record PaginatedResult<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public PaginatedResult {
        totalPages = (int) Math.ceil((double) totalElements / size);
    }
}
