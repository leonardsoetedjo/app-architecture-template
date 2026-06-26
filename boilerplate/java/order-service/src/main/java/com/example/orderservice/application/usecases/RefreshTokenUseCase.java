package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.RefreshTokenCommand;
import com.example.orderservice.application.dtos.RefreshTokenResult;

public interface RefreshTokenUseCase {
    RefreshTokenResult execute(RefreshTokenCommand command);
}
