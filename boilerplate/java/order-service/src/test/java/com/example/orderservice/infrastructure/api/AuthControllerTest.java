package com.example.orderservice.infrastructure.api;

import com.example.orderservice.application.dtos.LoginCommand;
import com.example.orderservice.application.dtos.LoginResult;
import com.example.orderservice.application.dtos.RegisterCommand;
import com.example.orderservice.application.dtos.RegisterResult;
import com.example.orderservice.application.dtos.UserProfileResult;
import com.example.orderservice.application.usecases.AuthenticateUserUseCase;
import com.example.orderservice.application.usecases.GetCurrentUserUseCase;
import com.example.orderservice.application.usecases.RegisterUserUseCase;
import com.example.orderservice.domain.models.Role;
import com.example.orderservice.domain.models.UserId;
import com.example.orderservice.domain.ports.TokenParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthenticateUserUseCase authenticateUserUseCase;
    @MockBean RegisterUserUseCase registerUserUseCase;
    @MockBean GetCurrentUserUseCase getCurrentUserUseCase;
    @MockBean TokenParser tokenParser;
    @MockBean com.example.orderservice.application.usecases.RefreshTokenUseCase refreshTokenUseCase;
    @MockBean com.example.orderservice.application.usecases.LogoutUseCase logoutUseCase;
    @MockBean com.example.orderservice.domain.ports.TokenBlacklist tokenBlacklist;

    @Test
    void shouldRegisterUser() throws Exception {
        RegisterResult result = new RegisterResult(
            UUID.randomUUID().toString(), "user@test.com", Set.of(Role.USER)
        );
        when(registerUserUseCase.execute(any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterCommand("user@test.com", "StrongP@ss1", null)
                )))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("user@test.com"));
    }

    @Test
    void shouldLoginUser() throws Exception {
        LoginResult result = new LoginResult(
            "token_xyz", "refresh_xyz", "user@test.com", Set.of(Role.USER), "Bearer"
        );
        when(authenticateUserUseCase.execute(any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new LoginCommand("user@test.com", "StrongP@ss1")
                )))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("token_xyz"))
            .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldReturnUserProfile() throws Exception {
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        UserProfileResult result = new UserProfileResult(
            userId.toString(), "user@test.com", Set.of(Role.USER), true, null, null
        );
        when(getCurrentUserUseCase.execute(any())).thenReturn(result);

        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("user@test.com"));
    }

    @Test
    void shouldReturn401WithoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized());
    }
}
