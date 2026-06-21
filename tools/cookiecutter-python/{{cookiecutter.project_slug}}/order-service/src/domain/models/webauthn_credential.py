"""WebAuthn credential value object for MFA."""

from dataclasses import dataclass


@dataclass(frozen=True)
class WebAuthnCredential:
    """WebAuthn credential value object for multi-factor authentication.
    
    Immutable (frozen) credential representing a registered authenticator.
    Supports hardware security keys, platform authenticators (TouchID, FaceID),
    and other FIDO2/WebAuthn authenticators.
    
    Example:
        cred = WebAuthnCredential("cred-123", "public-key-bytes", 0)
        updated = cred.update_sign_count(5)
        disabled = cred.disable()
    
    Attributes:
        credential_id: Unique identifier for this credential
        public_key: Public key bytes (base64 encoded)
        sign_count: Signature counter for replay attack prevention
        enabled: Whether this credential is active
    """
    
    credential_id: str
    public_key: str
    sign_count: int
    enabled: bool = True
    
    def __post_init__(self):
        """Validate credential fields after initialization."""
        if not self.credential_id:
            raise ValueError("Credential ID cannot be empty")
        if not self.public_key:
            raise ValueError("Public key cannot be empty")
        if self.sign_count < 0:
            raise ValueError("Sign count cannot be negative")
    
    def update_sign_count(self, new_count: int) -> "WebAuthnCredential":
        """Return new instance with updated signature counter.
        
        WebAuthn authenticators maintain a signature counter that increments
        with each authentication. This helps detect cloned authenticators.
        
        Args:
            new_count: New signature counter value (must be > current)
            
        Returns:
            New WebAuthnCredential instance with updated sign_count
            
        Raises:
            ValueError: If new_count is not greater than current sign_count
        """
        if new_count <= self.sign_count:
            raise ValueError("New sign count must be greater than current")
        
        return WebAuthnCredential(
            self.credential_id,
            self.public_key,
            new_count,
            self.enabled
        )
    
    def disable(self) -> "WebAuthnCredential":
        """Return new instance with enabled=False.
        
        Returns:
            New WebAuthnCredential instance with enabled=False
        """
        return WebAuthnCredential(
            self.credential_id,
            self.public_key,
            self.sign_count,
            enabled=False
        )
    
    def enable(self) -> "WebAuthnCredential":
        """Return new instance with enabled=True.
        
        Returns:
            New WebAuthnCredential instance with enabled=True
        """
        return WebAuthnCredential(
            self.credential_id,
            self.public_key,
            self.sign_count,
            enabled=True
        )
