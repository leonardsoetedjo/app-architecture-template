"""TOTP secret value object."""

from dataclasses import dataclass
import re


@dataclass(frozen=True)
class TotpSecret:
    """TOTP secret value object.
    
    Immutable (frozen) with validation for Base32 encoding.
    Used for time-based one-time password authentication.
    
    Example:
        secret = TotpSecret("JBSWY3DPEHPK3PXP")
        verified = secret.mark_verified()
    """
    
    secret: str
    verified: bool = False
    
    def __post_init__(self):
        if not self._is_valid_base32(self.secret):
            raise ValueError("Secret must be valid Base32 encoded string")
    
    @staticmethod
    def _is_valid_base32(value: str) -> bool:
        """Validate Base32 encoding (RFC 4648)."""
        return bool(re.match(r'^[A-Z2-7]+=*$', value))
    
    def mark_verified(self) -> "TotpSecret":
        """Return new instance with verified=True."""
        return TotpSecret(self.secret, verified=True)
