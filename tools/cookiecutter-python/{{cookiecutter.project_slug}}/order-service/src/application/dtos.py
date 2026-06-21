"""Application DTOs for boundary data transfer.

Immutability: frozen dataclasses ensure DTOs do not leak mutable state.
Financial data uses Decimal for precision.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID


@dataclass(frozen=True)
class OrderItemDTO:
    """DTO for order item within a command."""
    product_id: UUID
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True)
class CreateOrderCommand:
    """Command to create a new order.

    Invariant: customer_id is non-null; items is non-empty.
    """
    customer_id: UUID
    items: List[OrderItemDTO]


@dataclass(frozen=True)
class OrderResult:
    """Result returned after placing an order."""
    order_id: UUID
    status: str
    created_at: datetime


@dataclass(frozen=True)
class HealthStatus:
    """Health check response DTO (infrastructure)."""
    status: str
    components: dict


# MFA DTOs


@dataclass(frozen=True)
class MfaMethod:
    """Enumeration of MFA methods."""
    TOTP = "totp"
    BACKUP_CODES = "backup_codes"
    WEBAUTHN = "webauthn"


@dataclass(frozen=True)
class MfaSetupRequest:
    """Request to set up MFA."""
    method: str


@dataclass(frozen=True)
class MfaVerificationRequest:
    """Request to verify MFA code."""
    method: str
    code: str


@dataclass(frozen=True)
class MfaSetupResult:
    """Result returned after setting up MFA."""
    user_id: UUID
    method: str
    enabled: bool
    # TOTP-specific
    totp_secret: str | None = None
    totp_qr_code_url: str | None = None
    # Backup codes (only shown once during setup)
    backup_codes: list[str] | None = None
    # WebAuthn-specific
    webauthn_challenge: str | None = None
    webauthn_options: dict | None = None


@dataclass(frozen=True)
class MfaVerificationResult:
    """Result returned after verifying MFA code."""
    success: bool
    user_id: UUID
    method_used: str | None = None
    remaining_backup_codes: int | None = None


@dataclass(frozen=True)
class MfaStatusResult:
    """Current MFA status for a user."""
    user_id: UUID
    enabled: bool
    methods_configured: list[str]
    totp_verified: bool
    backup_codes_remaining: int
    webauthn_credentials_count: int
