from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from ..models.user import UserId

@dataclass(frozen=True)
class DomainEvent:
    event_name: str
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

@dataclass(frozen=True)
class UserRegistered(DomainEvent):
    user_id: UserId
    email: str

    def __post_init__(self):
        object.__setattr__(self, "event_name", "UserRegistered")

@dataclass(frozen=True)
class UserLoggedIn(DomainEvent):
    user_id: UserId
    logged_in_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        object.__setattr__(self, "event_name", "UserLoggedIn")

@dataclass(frozen=True)
class PasswordChanged(DomainEvent):
    user_id: UserId

    def __post_init__(self):
        object.__setattr__(self, "event_name", "PasswordChanged")
