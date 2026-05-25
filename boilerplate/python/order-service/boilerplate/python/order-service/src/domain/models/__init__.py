# src/domain/models/__init__.py
from .mfa_method import MfaMethod
from .totp_secret import TotpSecret

__all__ = ["MfaMethod", "TotpSecret"]
