from __future__ import annotations
from .auth_use_cases import AuthenticateUserUseCase, RegisterUserUseCase, ChangePasswordUseCase, GetCurrentUserUseCase
from .dtos import LoginCommand, LoginResult, RegisterCommand, RegisterResult, ChangePasswordCommand, UserProfileResult
from ..domain.models.user import Email, Password, Role, User, UserId, AuthenticationException, USER_ROLE

from ..domain.events.user_events import UserLoggedIn, UserRegistered, PasswordChanged
from ..domain.ports.auth_ports import UserRepository, PasswordHasher, TokenGenerator, EventPublisher
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

        self.event_publisher.publish(UserLoggedIn(user.id))

        return LoginResult(
            access_token=access_token,
            refresh_token=refresh_token,
            email=user.email.value,
            roles=user.roles,
            token_type="Bearer"
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

        self.event_publisher.publish(UserRegistered(saved.id, saved.email.value))

        return RegisterResult(
            user_id=str(saved.id.value),
            email=saved.email.value,
            roles=saved.roles
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

        self.event_publisher.publish(PasswordChanged(user.id))

class GetCurrentUserUseCaseImpl(GetCurrentUserUseCase):
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def execute(self, user_id: UserId) -> UserProfileResult:
        user = self.user_repository.find_by_id(user_id)
        if not user:
            raise AuthenticationException("AUTH_USER_NOT_FOUND", "User not found")

        return UserProfileResult(
            user_id=str(user.id.value),
            email=user.email.value,
            roles=user.roles,
            enabled=user.enabled,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )
