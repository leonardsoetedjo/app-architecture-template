"""Tests for BackupCode value object."""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

import pytest
from domain.models.backup_code import BackupCode


def test_backup_code_creation():
    """Verify BackupCode can be created with valid format."""
    code = BackupCode("ABCD-1234-EFGH-5678")
    assert code.code == "ABCD-1234-EFGH-5678"
    assert code.used is False
    assert code.hashed_code is not None
    assert len(code.hashed_code) == 64  # SHA-256 hex


def test_backup_code_format_validation():
    """Verify BackupCode validates XXXX-XXXX-XXXX-XXXX format."""
    with pytest.raises(ValueError, match="must be in XXXX-XXXX-XXXX-XXXX format"):
        BackupCode("invalid-code")
    
    with pytest.raises(ValueError, match="must be in XXXX-XXXX-XXXX-XXXX format"):
        BackupCode("ABCD1234EFGH5678")  # Missing dashes
    
    with pytest.raises(ValueError, match="must be in XXXX-XXXX-XXXX-XXXX format"):
        BackupCode("abcd-1234-efgh-5678")  # Lowercase


def test_backup_code_mark_used():
    """Verify mark_used returns new instance (immutability)."""
    code = BackupCode("ABCD-1234-EFGH-5678")
    used = code.mark_used()
    
    assert used.used is True
    assert code.used is False  # Original unchanged
    assert used is not code  # New instance


def test_backup_code_hash_is_consistent():
    """Verify same code produces same hash."""
    code1 = BackupCode("ABCD-1234-EFGH-5678")
    code2 = BackupCode("ABCD-1234-EFGH-5678")
    
    assert code1.hashed_code == code2.hashed_code


def test_backup_code_different_codes_different_hashes():
    """Verify different codes produce different hashes."""
    code1 = BackupCode("ABCD-1234-EFGH-5678")
    code2 = BackupCode("WXYZ-9876-STUV-5432")
    
    assert code1.hashed_code != code2.hashed_code
