package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.ChangePasswordCommand;

public interface ChangePasswordUseCase {
    void execute(String userId, ChangePasswordCommand command);
}
