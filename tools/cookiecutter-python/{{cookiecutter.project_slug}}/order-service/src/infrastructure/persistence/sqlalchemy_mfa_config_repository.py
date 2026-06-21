"""SQLAlchemy implementation of MFA configuration repository."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, DBAPIError

from domain.models.mfa_config import MfaConfig
from domain.ports.mfa_config_repository import MfaConfigRepository

from .models import MfaConfigEntity
from .mfa_mapper import MfaConfigMapper


class SqlAlchemyMfaConfigRepository(MfaConfigRepository):
    """SQLAlchemy adapter implementing MfaConfigRepository port.

    Persists MFA configurations with related entities (backup codes,
    WebAuthn credentials) in the same transaction.
    """

    def __init__(self, session: Session):
        self._session = session

    def save(self, config: MfaConfig) -> MfaConfig:
        """Persist MFA configuration atomically.

        Args:
            config: MfaConfig aggregate to persist

        Returns:
            Persisted MfaConfig with updated timestamps

        Raises:
            MfaConfigNotFoundError: If updating a non-existent config
        """
        entity = MfaConfigMapper.to_entity(config)
        try:
            # Check if exists
            existing = self._session.query(MfaConfigEntity).filter(
                MfaConfigEntity.user_id == config.user_id
            ).first()

            if existing:
                # Update existing
                self._session.delete(existing)
                self._session.flush()

            self._session.add(entity)
            self._session.commit()
            self._session.refresh(entity)
            return MfaConfigMapper.to_domain(entity)

        except (SQLAlchemyError, DBAPIError) as exc:
            self._session.rollback()
            raise Exception(f"Failed to save MFA config: {exc}")

    def find_by_user_id(self, user_id: UUID) -> Optional[MfaConfig]:
        """Retrieve MFA configuration by user UUID."""
        entity = (
            self._session.query(MfaConfigEntity)
            .filter(MfaConfigEntity.user_id == user_id)
            .first()
        )
        return MfaConfigMapper.to_domain(entity) if entity else None

    def exists_by_user_id(self, user_id: UUID) -> bool:
        """Check if MFA configuration exists for a user."""
        count = (
            self._session.query(MfaConfigEntity)
            .filter(MfaConfigEntity.user_id == user_id)
            .count()
        )
        return count > 0

    def delete_by_user_id(self, user_id: UUID) -> bool:
        """Delete MFA configuration for a user."""
        entity = (
            self._session.query(MfaConfigEntity)
            .filter(MfaConfigEntity.user_id == user_id)
            .first()
        )
        if entity:
            self._session.delete(entity)
            self._session.commit()
            return True
        return False
