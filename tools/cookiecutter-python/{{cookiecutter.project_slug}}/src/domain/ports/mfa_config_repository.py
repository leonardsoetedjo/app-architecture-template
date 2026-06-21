"""MFA configuration repository port for persistence operations."""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.models.mfa_config import MfaConfig


class MfaConfigRepository(ABC):
    """Repository port for MFA configuration persistence.

    ABC = zero framework dependencies.
    Infrastructure adapters (e.g., SQLAlchemy) implement this.
    """

    @abstractmethod
    def save(self, config: MfaConfig) -> MfaConfig:
        """Persist the MFA configuration to the database.
        
        Args:
            config: MfaConfig aggregate to persist
            
        Returns:
            Persisted MfaConfig with updated timestamps
            
        Raises:
            MfaConfigNotFoundError: If updating a non-existent config
        """
        ...

    @abstractmethod
    def find_by_user_id(self, user_id: UUID) -> Optional[MfaConfig]:
        """Retrieve MFA configuration by user UUID.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            MfaConfig if found, None otherwise
        """
        ...

    @abstractmethod
    def exists_by_user_id(self, user_id: UUID) -> bool:
        """Check if MFA configuration exists for a user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            True if configuration exists, False otherwise
        """
        ...

    @abstractmethod
    def delete_by_user_id(self, user_id: UUID) -> bool:
        """Delete MFA configuration for a user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            True if deleted, False if not found
        """
        ...
