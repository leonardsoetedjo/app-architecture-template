package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.models.UserId;

public interface LogoutUseCase {
    void execute(UserId userId);
}
