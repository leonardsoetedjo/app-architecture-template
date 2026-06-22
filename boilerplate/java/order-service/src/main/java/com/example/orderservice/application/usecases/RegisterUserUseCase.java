package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.RegisterCommand;
import com.example.orderservice.application.dtos.RegisterResult;

public interface RegisterUserUseCase {
    RegisterResult execute(RegisterCommand command);
}
