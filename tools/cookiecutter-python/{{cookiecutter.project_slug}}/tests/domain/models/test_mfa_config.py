"""Tests for MfaConfig aggregate root."""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import pytest
from uuid import uuid4
from domain.models.mfa_config import MfaConfig
from domain.models.totp_secret import TotpSecret
from domain.models.backup_code import BackupCode
from domain.models.webauthn_credential import WebAuthnCredential


def test_mfa_config_creation():
    """Verify MfaConfig can be created for a user."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    
    assert config.user_id == user_id
    assert config.enabled is False
    assert config.totp_secret is None
    assert config.backup_codes == []
    assert config.webauthn_credentials == []


def test_mfa_config_enable_totp():
    """Verify enabling TOTP sets enabled=True."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    
    config = config.with_totp(secret)
    
    assert config.enabled is True
    assert config.totp_secret.secret == "JBSWY3DPEHPK3PXP"
    assert config.totp_secret.verified is False


def test_mfa_config_disable_totp():
    """Verify removing TOTP updates enabled state."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    config = config.with_totp(secret)
    
    config = config.without_totp()
    
    assert config.enabled is False
    assert config.totp_secret is None


def test_mfa_config_generate_backup_codes():
    """Verify generating backup codes creates valid codes."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    
    config = config.with_backup_codes(count=10)
    
    assert len(config.backup_codes) == 10
    assert all(not code.used for code in config.backup_codes)
    assert all(code.hashed_code is not None for code in config.backup_codes)
    assert config.enabled is True  # Enabled when backup codes added


def test_mfa_config_add_webauthn_credential():
    """Verify adding WebAuthn credential."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    cred = WebAuthnCredential("cred-123", "public-key", 0)
    
    config = config.with_webauthn_credential(cred)
    
    assert len(config.webauthn_credentials) == 1
    assert config.webauthn_credentials[0].credential_id == "cred-123"
    assert config.enabled is True


def test_mfa_config_multiple_webauthn_credentials():
    """Verify adding multiple WebAuthn credentials."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    
    cred1 = WebAuthnCredential("cred-1", "pk1", 0)
    cred2 = WebAuthnCredential("cred-2", "pk2", 5)
    
    config = config.with_webauthn_credential(cred1)
    config = config.with_webauthn_credential(cred2)
    
    assert len(config.webauthn_credentials) == 2
    assert config.enabled is True


def test_mfa_config_immutability():
    """Verify MfaConfig is immutable - all modifications return new instances."""
    user_id = uuid4()
    config1 = MfaConfig.create(user_id)
    secret = TotpSecret("JBSWY3DPEHPK3PXP")
    
    config2 = config1.with_totp(secret)
    
    assert config1 is not config2
    assert config1.totp_secret is None
    assert config2.totp_secret is not None
    assert config1.enabled is False
    assert config2.enabled is True


def test_mfa_config_enabled_with_multiple_methods():
    """Verify enabled stays True if any MFA method is active."""
    user_id = uuid4()
    config = MfaConfig.create(user_id)
    
    # Add TOTP
    config = config.with_totp(TotpSecret("JBSWY3DPEHPK3PXP"))
    assert config.enabled is True
    
    # Add backup codes
    config = config.with_backup_codes(5)
    assert config.enabled is True
    
    # Remove TOTP - should still be enabled (backup codes)
    config = config.without_totp()
    assert config.enabled is True
