"""Backup code value object for MFA."""

from dataclasses import dataclass, field
import hashlib
import re


@dataclass(frozen=True)
class BackupCode:
    """Backup code value object for multi-factor authentication.
    
    Immutable (frozen) with hashed storage for security.
    Code format: XXXX-XXXX-XXXX-XXXX (16 characters, dash-separated)
    
    Example:
        code = BackupCode("ABCD-1234-EFGH-5678")
        used_code = code.mark_used()
    
    Attributes:
        code: The backup code in XXXX-XXXX-XXXX-XXXX format
        used: Whether the code has been consumed
        hashed_code: SHA-256 hash of the code for secure storage
    """
    
    code: str
    used: bool = False
    hashed_code: str = field(init=False)
    
    def __post_init__(self):
        """Validate format and compute hash after initialization."""
        if not self._is_valid_format(self.code):
            raise ValueError("Backup code must be in XXXX-XXXX-XXXX-XXXX format")
        # Use object.__setattr__ because dataclass is frozen
        object.__setattr__(self, "hashed_code", self._hash_code(self.code))
    
    @staticmethod
    def _is_valid_format(code: str) -> bool:
        """Validate backup code format (XXXX-XXXX-XXXX-XXXX).
        
        Args:
            code: The backup code to validate
            
        Returns:
            True if valid format, False otherwise
        """
        pattern = r'^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'
        return bool(re.match(pattern, code))
    
    @staticmethod
    def _hash_code(code: str) -> str:
        """Generate SHA-256 hash of the backup code.
        
        Args:
            code: The backup code to hash
            
        Returns:
            Hexadecimal SHA-256 hash string
        """
        return hashlib.sha256(code.encode()).hexdigest()
    
    def mark_used(self) -> "BackupCode":
        """Return new instance with used=True.
        
        Returns:
            New BackupCode instance with used=True
        """
        return BackupCode(self.code, used=True)
