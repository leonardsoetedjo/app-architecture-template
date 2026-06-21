"""Tests for WebAuthnCredential value object."""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import pytest
from domain.models.webauthn_credential import WebAuthnCredential


def test_webauthn_credential_creation():
    """Verify WebAuthnCredential can be created."""
    cred = WebAuthnCredential(
        credential_id="cred-123",
        public_key="public-key-bytes",
        sign_count=0
    )
    assert cred.credential_id == "cred-123"
    assert cred.public_key == "public-key-bytes"
    assert cred.sign_count == 0
    assert cred.enabled is True


def test_webauthn_credential_requires_credential_id():
    """Verify WebAuthnCredential validates credential_id."""
    with pytest.raises(ValueError, match="Credential ID cannot be empty"):
        WebAuthnCredential(
            credential_id="",
            public_key="pk",
            sign_count=0
        )


def test_webauthn_credential_requires_public_key():
    """Verify WebAuthnCredential validates public_key."""
    with pytest.raises(ValueError, match="Public key cannot be empty"):
        WebAuthnCredential(
            credential_id="cred-123",
            public_key="",
            sign_count=0
        )


def test_webauthn_credential_requires_non_negative_sign_count():
    """Verify WebAuthnCredential validates sign_count."""
    with pytest.raises(ValueError, match="Sign count cannot be negative"):
        WebAuthnCredential(
            credential_id="cred-123",
            public_key="pk",
            sign_count=-1
        )


def test_webauthn_credential_update_sign_count():
    """Verify update_sign_count returns new instance with updated count."""
    cred = WebAuthnCredential("cred-123", "pk", 5)
    updated = cred.update_sign_count(10)
    
    assert updated.sign_count == 10
    assert cred.sign_count == 5  # Original unchanged
    assert updated is not cred  # New instance


def test_webauthn_credential_update_sign_count_must_increase():
    """Verify update_sign_count requires higher count."""
    cred = WebAuthnCredential("cred-123", "pk", 5)
    
    with pytest.raises(ValueError, match="New sign count must be greater"):
        cred.update_sign_count(5)  # Same count
    
    with pytest.raises(ValueError, match="New sign count must be greater"):
        cred.update_sign_count(3)  # Lower count


def test_webauthn_credential_disable():
    """Verify disable returns new instance with enabled=False."""
    cred = WebAuthnCredential("cred-123", "pk", 0)
    disabled = cred.disable()
    
    assert disabled.enabled is False
    assert cred.enabled is True  # Original unchanged
    assert disabled is not cred  # New instance


def test_webauthn_credential_with_initial_sign_count():
    """Verify WebAuthnCredential can be created with non-zero sign count."""
    cred = WebAuthnCredential("cred-123", "pk", 100)
    assert cred.sign_count == 100
    assert cred.enabled is True
