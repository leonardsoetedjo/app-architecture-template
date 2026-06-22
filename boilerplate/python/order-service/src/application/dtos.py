from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Set, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from domain.models.user import Role

# Auth DTOs

@dataclass(frozen=True)
class LoginCommand:
    email: str
    password: str

@dataclass(frozen=True)
class LoginResult:
    accessToken: str
    refreshToken: str
    email: str
    roles: Set[str]
    tokenType: str = "Bearer"

@dataclass(frozen=True)
class RegisterCommand:
    email: str
    password: str
    roles: Optional[Set[Role]] = None

@dataclass(frozen=True)
class RegisterResult:
    userId: str
    email: str
    roles: Set[str]

@dataclass(frozen=True)
class ChangePasswordCommand:
    current_password: str
    new_password: str

@dataclass(frozen=True)
class UserProfileResult:
    userId: str
    email: str
    roles: Set[str]
    enabled: bool
    createdAt: datetime
    lastLoginAt: Optional[datetime]

# Order DTOs

@dataclass(frozen=True)
class OrderItemDTO:
    product_id: str
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True)
class CreateOrderCommand:
    customer_id: str
    items: List[OrderItemDTO]


@dataclass(frozen=True)
class OrderResult:
    order_id: UUID
    status: str
    created_at: datetime