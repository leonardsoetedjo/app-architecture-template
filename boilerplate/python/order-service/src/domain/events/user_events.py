"""Domain events for user lifecycle."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone

from domain.models.user import UserId


@dataclass(frozen=True, kw_only=True)
class DomainEvent:
    event_name: str = ""
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(frozen=True, kw_only=True)
class UserRegistered(DomainEvent):
    user_id: UserId
    email: str

    def __post_init__(self):
        object.__setattr__(self, "event_name", "UserRegistered")


@dataclass(frozen=True, kw_only=True)
class UserLoggedIn(DomainEvent):
    user_id: UserId

    def __post_init__(self):
        object.__setattr__(self, "event_name", "UserLoggedIn")


@dataclass(frozen=True, kw_only=True)
class PasswordChanged(DomainEvent):
    user_id: UserId

    def __post_init__(self):
        object.__setattr__(self, "event_name", "PasswordChanged")
