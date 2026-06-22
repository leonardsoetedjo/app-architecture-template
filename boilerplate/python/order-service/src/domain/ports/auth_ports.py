from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Optional
from domain.models.user import User, UserId, Email

class UserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> User:
        pass

    @abstractmethod
    def find_by_id(self, user_id: UserId) -> Optional[User]:
        pass

    @abstractmethod
    def find_by_email(self, email: Email) -> Optional[User]:
        pass

    @abstractmethod
    def exists_by_email(self, email: Email) -> bool:
        pass

    @abstractmethod
    def delete_by_id(self, user_id: UserId) -> None:
        pass

    @abstractmethod
    def count(self) -> int:
        pass

class PasswordHasher(ABC):
    @abstractmethod
    def hash(self, plaintext: str) -> str:
        pass

    @abstractmethod
    def matches(self, plaintext: str, hashed: str) -> bool:
        pass

class TokenGenerator(ABC):
    @abstractmethod
    def generate_access_token(self, user: User) -> str:
        pass

    @abstractmethod
    def generate_refresh_token(self, user: User) -> str:
        pass

class TokenParser(ABC):
    @abstractmethod
    def parse_user_id(self, token: str) -> Optional[UserId]:
        pass

    @abstractmethod
    def is_valid(self, token: str) -> bool:
        pass

class EventPublisher(ABC):
    @abstractmethod
    def publish(self, event) -> None:
        pass
