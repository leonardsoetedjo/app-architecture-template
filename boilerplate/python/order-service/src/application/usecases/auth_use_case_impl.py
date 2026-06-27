from __future__ import annotations
from .auth_use_cases import AuthenticateUserUseCase, RegisterUserUseCase, ChangePasswordUseCase, GetCurrentUserUseCase
from application.dtos import LoginCommand, LoginResult, RegisterCommand, RegisterResult, ChangePasswordCommand, UserProfileResult
from domain.models.user import Email, Password, Role, User, UserId, AuthenticationException, USER_ROLE

from application.usecases.auth_use_cases import (
    AuthenticateUserUseCase, RegisterUserUseCase, ChangePasswordUseCase,
    GetCurrentUserUseCase, RefreshTokenUseCase, LogoutUseCase,
)
from domain.events.user_events import UserLoggedIn, UserRegistered, PasswordChanged
from domain.ports.auth_ports import UserRepository, PasswordHasher, TokenGenerator, EventPublisher
import uuid

class AuthenticateUserUseCaseImpl(AuthenticateUserUseCase):
    def __init__(self, user_repository: UserRepository, password_hasher: PasswordHasher, 
                 token_generator: TokenGenerator, event_publisher: EventPublisher):
        self.user_repository = user_repository
        self.password_hasher = password_hasher
        self.token_generator = token_generator
        self.event_publisher = event_publisher

    def execute(self, command: LoginCommand) -> LoginResult:
        email = Email(command.email)
        user = self.user_repository.find_by_email(email)
        if not user:
            raise AuthenticationException("AUTH_INVALID_CREDENTIALS", "Invalid email or password")

        if not user.authenticate(command.password, self.password_hasher):
            raise AuthenticationException("AUTH_INVALID_CREDENTIALS", "Invalid email or password")

        user.record_login()
        self.user_repository.save(user)

        access_token = self.token_generator.generate_access_token(user)
        refresh_token = self.token_generator.generate_refresh_token(user)

        self.event_publisher.publish(UserLoggedIn(user_id=user.id))

        return LoginResult(
            accessToken=access_token,
            refreshToken=refresh_token,
            email=user.email.value,
            roles={r.code for r in user.roles},
            tokenType="Bearer"
        )

class RegisterUserUseCaseImpl(RegisterUserUseCase):
    def __init__(self, user_repository: UserRepository, password_hasher: PasswordHasher, event_publisher: EventPublisher):
        self.user_repository = user_repository
        self.password_hasher = password_hasher
        self.event_publisher = event_publisher

    def execute(self, command: RegisterCommand) -> RegisterResult:
        email = Email(command.email)
        if self.user_repository.exists_by_email(email):
            raise AuthenticationException("AUTH_EMAIL_EXISTS", "An account with this email already exists")

        Password.validate_plaintext(command.password)
        hashed = self.password_hasher.hash(command.password)
        password = Password(hashed)

        roles = command.roles if command.roles else {USER_ROLE}

        user = User.create(email, password, roles)
        saved = self.user_repository.save(user)

        self.event_publisher.publish(UserRegistered(user_id=saved.id, email=saved.email.value))

        return RegisterResult(
            userId=str(saved.id.value),
            email=saved.email.value,
            roles={r.code for r in saved.roles}
        )

class ChangePasswordUseCaseImpl(ChangePasswordUseCase):
    def __init__(self, user_repository: UserRepository, password_hasher: PasswordHasher, event_publisher: EventPublisher):
        self.user_repository = user_repository
        self.password_hasher = password_hasher
        self.event_publisher = event_publisher

    def execute(self, user_id_str: str, command: ChangePasswordCommand) -> None:
        user_id = UserId(user_id_str)
        user = self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationException("AUTH_USER_NOT_FOUND", "User not found")

        if not user.authenticate(command.current_password, self.password_hasher):
            raise AuthenticationException("AUTH_INVALID_CURRENT_PASSWORD", "Current password is incorrect")

        Password.validate_plaintext(command.new_password)
        hashed = self.password_hasher.hash(command.new_password)
        user.change_password(Password(hashed))
        self.user_repository.save(user)

        self.event_publisher.publish(PasswordChanged(user_id=user.id))

class GetCurrentUserUseCaseImpl(GetCurrentUserUseCase):
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def execute(self, user_id: UserId) -> UserProfileResult:
        user = self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationException("AUTH_USER_NOT_FOUND", "User not found")

        return UserProfileResult(
            userId=str(user.id.value),
            email=user.email.value,
            roles={r.code for r in user.roles},
            enabled=user.enabled,
            createdAt=user.created_at,
            lastLoginAt=user.last_login_at
        )

class RefreshTokenUseCaseImpl(RefreshTokenUseCase):
    def __init__(self, token_parser, token_generator, user_repository):
        self.token_parser = token_parser
        self.token_generator = token_generator
        self.user_repository = user_repository

    def execute(self, refresh_token: str) -> LoginResult:
        if not refresh_token:
            raise AuthenticationException("AUTH_INVALID_TOKEN", "Refresh token is required")

        user_id = self.token_parser.parse_user_id(refresh_token)
        if not user_id:
            raise AuthenticationException("AUTH_INVALID_TOKEN", "Invalid or expired refresh token")

        user = self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationException("AUTH_USER_NOT_FOUND", "User not found")

        # Token rotation: generate new pair
        access_token = self.token_generator.generate_access_token(user)
        new_refresh_token = self.token_generator.generate_refresh_token(user)

        return LoginResult(
            accessToken=access_token,
            refreshToken=new_refresh_token,
            email=user.email.value,
            roles={r.code for r in user.roles},
            tokenType="Bearer"
        )

class LogoutUseCaseImpl(LogoutUseCase):
    def __init__(self):
        pass

    def execute(self, user_id: UserId) -> None:
        # TODO: Add token to Redis blacklist with TTL matching token expiry
        # For now, tokens expire naturally via JWT expiration
        pass
