package com.example.orderservice.application.usecases;

import com.example.orderservice.application.dtos.UserProfileResult;
import com.example.orderservice.domain.models.UserId;

public interface GetCurrentUserUseCase {
    UserProfileResult execute(UserId userId);
}
