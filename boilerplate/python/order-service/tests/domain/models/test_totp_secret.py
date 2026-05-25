"""Tests for TotpSecret value object."""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import pytest
from domain.models.totp_secret import TotpSecret


def test_totp_secret_creation():
    """Verify TotpSecret can be created with valid Base32 secret."""
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    assert secret.secret == "JBSWY3DPEHPK3PXP"
    assert secret.verified is False


def test_totp_secret_requires_valid_base32():
    """Verify TotpSecret validates Base32 encoding."""
    with pytest.raises(ValueError, match="must be valid Base32"):
        TotpSecret("invalid-secret!")
    
    with pytest.raises(ValueError, match="must be valid Base32"):
        TotpSecret("lowercase")


def test_totp_secret_mark_verified():
    """Verify mark_verified returns new instance (immutability)."""
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    verified = secret.mark_verified()
    
    assert verified.verified is True
    assert secret.verified is False  # Original unchanged
    assert verified is not secret  # New instance


def test_totp_secret_with_padding():
    """Verify TotpSecret accepts Base32 with padding."""
    secret = TotpSecret("JBSWY3DPEHPK3PXP====")
    assert secret.secret == "JBSWY3DPEHPK3PXP===="
    assert secret.verified is False
