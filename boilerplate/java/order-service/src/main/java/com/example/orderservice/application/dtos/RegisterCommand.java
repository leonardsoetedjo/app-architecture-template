package com.example.orderservice.application.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

import com.example.orderservice.domain.models.Role;

public record RegisterCommand(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 128) String password,
    Set<Role> roles
) {}
