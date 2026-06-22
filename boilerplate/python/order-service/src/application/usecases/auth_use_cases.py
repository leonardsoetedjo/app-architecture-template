from __future__ import annotations
from abc import ABC, abstractmethod
from .dtos import LoginCommand, LoginResult, RegisterCommand, RegisterResult, ChangePasswordCommand, UserProfileResult
from ..domain.models.user import UserId

class AuthenticateUserUseCase(ABC):
    @abstractmethod
    def execute(self, command: LoginCommand) -> LoginResult:
        pass

class RegisterUserUseCase(ABC):
    @abstractmethod
    def execute(self, command: RegisterCommand) -> RegisterResult:
        pass

class ChangePasswordUseCase(ABC):
    @abstractmethod
    def execute(self, user_id: str, command: ChangePasswordCommand) -> None:
        pass

class GetCurrentUserUseCase(ABC):
    @abstractmethod
    def execute(self, user_id: UserId) -> UserProfileResult:
        pass
