from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Set
from datetime import datetime
from ..domain.models.user import Role

@dataclass(frozen=True)
class LoginCommand:
    email: str
    password: str

@dataclass(frozen=True)
class LoginResult:
    access_token: str
    refresh_token: str
    email: str
    roles: Set[Role]
    token_type: str = "Bearer"

@dataclass(frozen=True)
class RegisterCommand:
    email: str
    password: str
    roles: Optional[Set[Role]] = None

@dataclass(frozen=True)
class RegisterResult:
    user_id: str
    email: str
    roles: Set[Role]

@dataclass(frozen=True)
class ChangePasswordCommand:
    current_password: str
    new_password: str

@dataclass(frozen=True)
class UserProfileResult:
    user_id: str
    email: str
    roles: Set[Role]
    enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime]
