"""Mapper between MFA domain models and SQLAlchemy entities."""

from typing import Optional
from datetime import datetime, timezone

from domain.models.mfa_config import MfaConfig
from domain.models.totp_secret import TotpSecret
from domain.models.backup_code import BackupCode
from domain.models.webauthn_credential import WebAuthnCredential

from .models import MfaConfigEntity, BackupCodeEntity, WebAuthnCredentialEntity


class MfaConfigMapper:
    """Bidirectional mapper for MFA configuration."""

    @staticmethod
    def to_entity(config: MfaConfig) -> MfaConfigEntity:
        """Convert domain MfaConfig to SQLAlchemy entity."""
        entity = MfaConfigEntity(
            user_id=config.user_id,
            enabled=1 if config.enabled else 0,
            totp_secret=config.totp_secret.secret if config.totp_secret else None,
            totp_verified=1 if config.totp_secret and config.totp_secret.verified else 0,
            created_at=config.created_at,
            updated_at=config.updated_at,
        )

        # Map backup codes
        for code in config.backup_codes:
            entity.backup_codes.append(
                BackupCodeEntity(
                    user_id=config.user_id,
                    code_hash=code.code,  # TODO: Hash in production
                    used=1 if code.used else 0,
                    used_at=code.used_at,
                    created_at=code.created_at,
                )
            )

        # Map WebAuthn credentials
        for cred in config.webauthn_credentials:
            entity.webauthn_credentials.append(
                WebAuthnCredentialEntity(
                    user_id=config.user_id,
                    credential_id=cred.credential_id,
                    public_key=cred.public_key,
                    sign_count=cred.sign_count,
                    enabled=1 if cred.enabled else 0,
                    created_at=datetime.now(timezone.utc),
                )
            )

        return entity

    @staticmethod
    def to_domain(entity: MfaConfigEntity) -> MfaConfig:
        """Convert SQLAlchemy entity to domain MfaConfig."""
        if entity is None:
            return None

        # Convert totp_secret
        totp_secret = None
        if entity.totp_secret:
            totp_secret = TotpSecret(
                secret=entity.totp_secret,
                verified=bool(entity.totp_verified) if entity.totp_verified is not None else False
            )

        # Convert backup codes
        backup_codes = [
            BackupCode(
                code=bc.code_hash,  # TODO: This is the hash, need to handle differently
                used=bool(bc.used),
                used_at=bc.used_at,
                created_at=bc.created_at,
            )
            for bc in entity.backup_codes
        ]

        # Convert WebAuthn credentials
        webauthn_credentials = [
            WebAuthnCredential(
                credential_id=wc.credential_id,
                public_key=wc.public_key,
                sign_count=wc.sign_count,
                enabled=bool(wc.enabled),
            )
            for wc in entity.webauthn_credentials
        ]

        return MfaConfig(
            user_id=entity.user_id,
            enabled=bool(entity.enabled),
            totp_secret=totp_secret,
            backup_codes=backup_codes,
            webauthn_credentials=webauthn_credentials,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
