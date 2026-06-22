package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.LoginCommand;
import com.example.orderservice.application.dtos.LoginResult;

public interface AuthenticateUserUseCase {
    LoginResult execute(LoginCommand command);
}
