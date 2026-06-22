package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginCommand(
    @NotBlank String email,
    @NotBlank String password
) {}
