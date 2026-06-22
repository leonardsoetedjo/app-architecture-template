from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timezone

@dataclass(frozen=True)
class Role:
    name: str
    code: str

# We define these as a separate mapping or just use the class itself
# Since we need them as constants, we'll define them outside the class 
# or use a static factory.
USER_ROLE = Role("User", "USER")
ADMIN_ROLE = Role("Administrator", "ADMIN")

class DomainException(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(self.message)

class AuthenticationException(DomainException):
    pass

@dataclass(frozen=True)
class UserId:
    value: str

    @classmethod
    def generate(cls) -> UserId:
        import uuid
        return cls(str(uuid.uuid4()))

    def __str__(self) -> str:
        return self.value

@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self):
        import re
        pattern = r"^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
        if not self.value or not re.match(pattern, self.value):
            raise ValueError(f"Invalid email format: {self.value}")
        object.__setattr__(self, "value", self.value.lower().strip())

@dataclass(frozen=True)
class Password:
    hashed_value: str

    @staticmethod
    def validate_plaintext(plaintext: str) -> None:
        if not plaintext:
            raise AuthenticationException("AUTH_PASSWORD_EMPTY", "Password cannot be empty")
        if len(plaintext) < 8:
            raise AuthenticationException("AUTH_PASSWORD_TOO_SHORT", "Password must be at least 8 characters")
        if len(plaintext) > 128:
            raise AuthenticationException("AUTH_PASSWORD_TOO_LONG", "Password must be at most 128 characters")
        
        import re
        if not re.search(r"[A-Z]", plaintext):
            raise AuthenticationException("AUTH_PASSWORD_NO_UPPER", "Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", plaintext):
            raise AuthenticationException("AUTH_PASSWORD_NO_LOWER", "Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", plaintext):
            raise AuthenticationException("AUTH_PASSWORD_NO_DIGIT", "Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*()\-_\+=\|\[\]{};:'\",.<>/?]", plaintext):
            raise AuthenticationException("AUTH_PASSWORD_NO_SPECIAL", "Password must contain at least one special character")

@dataclass
class User:
    id: UserId
    email: Email
    password: Password
    roles: set[Role]
    enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    @classmethod
    def create(cls, email: Email, password: Password, roles: set[Role]) -> User:
        return cls(
            id=UserId.generate(),
            email=email,
            password=password,
            roles=roles,
            enabled=True,
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    def create_with_defaults(cls, email: Email, password: Password) -> User:
        return cls.create(email, password, {USER_ROLE})

    def authenticate(self, plaintext_password: str, password_hasher) -> bool:
        if not self.enabled:
            raise AuthenticationException("AUTH_USER_DISABLED", "User account is disabled")
        return password_hasher.matches(plaintext_password, self.password.hashed_value)

    def record_login(self) -> None:
        self.last_login_at = datetime.now(timezone.utc)

    def change_password(self, new_password: Password) -> None:
        self.password = new_password

    def disable(self) -> None:
        self.enabled = False

    def enable(self) -> None:
        self.enabled = True

    def has_role(self, role: Role) -> bool:
        return role in self.roles

    def has_any_role(self, required_roles: list[Role]) -> bool:
        return any(role in self.roles for role in required_roles)
