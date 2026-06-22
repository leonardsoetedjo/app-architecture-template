package com.example.orderservice.infrastructure.exception;

import com.example.orderservice.domain.models.DomainException;
import com.example.orderservice.infrastructure.api.UnauthenticatedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String BASE_URI = "https://api.example.com/errors";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "One or more fields failed validation");
        problem.setType(URI.create(BASE_URI + "/validation-failed"));
        problem.setTitle("Validation Failed");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "VAL_001");

        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
            .toList();
        problem.setProperty("fieldErrors", fieldErrors);

        return problem;
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ProblemDetail handleUnauthenticated(UnauthenticatedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setType(URI.create(BASE_URI + "/unauthenticated"));
        problem.setTitle("Unauthenticated");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "AUTH_001");
        return problem;
    }

    @ExceptionHandler(DomainException.class)
    public ProblemDetail handleDomain(DomainException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setType(URI.create(BASE_URI + "/business-rule-violation"));
        problem.setTitle("Business Rule Violation");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", ex.getCode());
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleMissingBody(HttpMessageNotReadableException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Request body is missing or unreadable");
        problem.setType(URI.create(BASE_URI + "/bad-request"));
        problem.setTitle("Bad Request");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "REQ_001");
        return problem;
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content type not supported");
        problem.setType(URI.create(BASE_URI + "/unsupported-media-type"));
        problem.setTitle("Unsupported Media Type");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "REQ_002");
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        problem.setType(URI.create(BASE_URI + "/internal-error"));
        problem.setTitle("Internal Server Error");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "ERR_500");
        return problem;
    }
}
