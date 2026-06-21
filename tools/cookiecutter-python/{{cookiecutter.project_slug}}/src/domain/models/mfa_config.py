"""MFA configuration aggregate root."""

from dataclasses import dataclass, field
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
import secrets
import string

from .totp_secret import TotpSecret
from .backup_code import BackupCode
from .webauthn_credential import WebAuthnCredential


@dataclass(frozen=True)
class MfaConfig:
    """MFA configuration aggregate root.
    
    Immutable aggregate managing a user's multi-factor authentication setup.
    Supports multiple MFA methods simultaneously (TOTP, WebAuthn, Backup Codes).
    """
    
    user_id: UUID
    enabled: bool = False
    totp_secret: Optional[TotpSecret] = None
    backup_codes: List[BackupCode] = field(default_factory=list)
    webauthn_credentials: List[WebAuthnCredential] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    @staticmethod
    def create(user_id: UUID) -> "MfaConfig":
        """Factory method to create new MFA configuration."""
        return MfaConfig(user_id=user_id)
    
    def with_totp(self, secret: TotpSecret) -> "MfaConfig":
        """Enable TOTP authentication."""
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=secret,
            backup_codes=self.backup_codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def without_totp(self) -> "MfaConfig":
        """Disable TOTP authentication."""
        return MfaConfig(
            user_id=self.user_id,
            enabled=self._recalculate_enabled(
                has_totp=False,
                has_webauthn=len(self.webauthn_credentials) > 0,
                has_backup_codes=self._has_unused_backup_codes()
            ),
            totp_secret=None,
            backup_codes=self.backup_codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def with_backup_codes(self, count: int = 10) -> "MfaConfig":
        """Generate new backup codes (replaces existing)."""
        codes = self._generate_backup_codes(count)
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=self.totp_secret,
            backup_codes=codes,
            webauthn_credentials=self.webauthn_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def with_webauthn_credential(self, credential: WebAuthnCredential) -> "MfaConfig":
        """Add a WebAuthn credential."""
        new_credentials = self.webauthn_credentials + [credential]
        return MfaConfig(
            user_id=self.user_id,
            enabled=True,
            totp_secret=self.totp_secret,
            backup_codes=self.backup_codes,
            webauthn_credentials=new_credentials,
            created_at=self.created_at,
            updated_at=datetime.now(timezone.utc)
        )
    
    def _recalculate_enabled(self, has_totp: bool, has_webauthn: bool, has_backup_codes: bool) -> bool:
        """Recalculate whether MFA is enabled based on active methods."""
        return has_totp or has_webauthn or has_backup_codes
    
    def _has_unused_backup_codes(self) -> bool:
        """Check if there are any unused backup codes."""
        return any(not code.used for code in self.backup_codes)
    
    @staticmethod
    def _generate_backup_codes(count: int) -> List[BackupCode]:
        """Generate random backup codes."""
        chars = string.ascii_uppercase + string.digits
        codes = []
        for _ in range(count):
            parts = [''.join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
            code = '-'.join(parts)
            codes.append(BackupCode(code))
        return codes
    
    def get_unused_backup_codes(self) -> List[BackupCode]:
        """Get all unused backup codes."""
        return [code for code in self.backup_codes if not code.used]
    
    def get_enabled_webauthn_credentials(self) -> List[WebAuthnCredential]:
        """Get all enabled WebAuthn credentials."""
        return [cred for cred in self.webauthn_credentials if cred.enabled]
