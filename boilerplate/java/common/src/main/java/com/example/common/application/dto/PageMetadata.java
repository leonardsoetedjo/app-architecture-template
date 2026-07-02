package com.example.common.application.dto;

import java.time.Instant;
import java.util.Objects;

/**
 * Base DTO for paginated responses.
 * Provides consistent pagination metadata across all APIs.
 */
public class PageMetadata {
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final Instant timestamp;

    public PageMetadata(int page, int size, long totalElements) {
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = (int) Math.ceil((double) totalElements / size);
        this.timestamp = Instant.now();
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public boolean hasNextPage() {
        return page < totalPages - 1;
    }

    public boolean hasPreviousPage() {
        return page > 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PageMetadata that = (PageMetadata) o;
        return page == that.page && size == that.size && totalElements == that.totalPages;
    }

    @Override
    public int hashCode() {
        return Objects.hash(page, size, totalElements);
    }
}
