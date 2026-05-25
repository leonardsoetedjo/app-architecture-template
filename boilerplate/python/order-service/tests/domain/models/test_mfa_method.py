"""Tests for MfaMethod enum."""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.mfa_method import MfaMethod


def test_mfa_method_has_three_types():
    """Verify MfaMethod enum has TOTP, WEBAUTHN, and BACKUP_CODE."""
    assert MfaMethod.TOTP.value == "TOTP"
    assert MfaMethod.WEBAUTHN.value == "WEBAUTHN"
    assert MfaMethod.BACKUP_CODE.value == "BACKUP_CODE"


def test_mfa_method_is_string_enum():
    """Verify MfaMethod is a string enum for easy serialization."""
    assert isinstance(MfaMethod.TOTP, str)
    assert MfaMethod.TOTP == "TOTP"
