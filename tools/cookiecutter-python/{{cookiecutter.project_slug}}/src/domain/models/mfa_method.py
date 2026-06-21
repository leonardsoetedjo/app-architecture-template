"""MFA method types."""

from enum import Enum


class MfaMethod(str, Enum):
    """Multi-factor authentication methods.
    
    String enum for easy serialization to/from JSON.
    """
    
    TOTP = "TOTP"
    WEBAUTHN = "WEBAUTHN"
    BACKUP_CODE = "BACKUP_CODE"
