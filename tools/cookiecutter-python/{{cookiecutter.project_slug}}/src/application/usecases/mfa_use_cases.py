"""MFA use case interfaces for multi-factor authentication operations."""

from abc import ABC, abstractmethod
from typing import Tuple
from uuid import UUID

from application.dtos import MfaSetupResult, MfaVerificationResult


class SetupMfaUseCase(ABC):
    """Application layer port for setting up MFA."""

    @abstractmethod
    def execute(self, user_id: UUID, method: str) -> MfaSetupResult:
        """Set up MFA for a user.

        Args:
            user_id: User's unique identifier
            method: MFA method ('TOTP', 'WEBAUTHN', 'BACKUP_CODE')

        Returns:
            MfaSetupResult with method-specific setup data

        Raises:
            MfaAlreadyEnabledError: If MFA already enabled
        """
        ...


class VerifyMfaUseCase(ABC):
    """Application layer port for verifying MFA codes."""

    @abstractmethod
    def execute(self, user_id: UUID, code: str, method: str) -> MfaVerificationResult:
        """Verify MFA code during login.

        Args:
            user_id: User's unique identifier
            code: MFA code (TOTP, backup code, or WebAuthn response)
            method: MFA method used

        Returns:
            MfaVerificationResult with success status

        Raises:
            MfaInvalidCodeError: If code is invalid or expired
            MfaNotFoundError: If user has no MFA configured
        """
        ...


class DisableMfaUseCase(ABC):
    """Application layer port for disabling MFA."""

    @abstractmethod
    def execute(self, user_id: UUID) -> bool:
        """Disable MFA for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            True if disabled, False if not found
        """
        ...
