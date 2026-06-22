package com.example.orderservice.application.dtos;

import com.example.orderservice.domain.models.Role;

import java.util.Set;

public record RegisterResult(
    String userId,
    String email,
    Set<Role> roles
) {}
