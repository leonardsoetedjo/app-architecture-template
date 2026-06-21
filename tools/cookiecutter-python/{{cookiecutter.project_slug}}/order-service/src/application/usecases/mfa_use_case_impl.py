"""MFA use case implementations."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import struct
import time
from typing import List, Optional
from uuid import UUID

from application.dtos import MfaSetupResult, MfaVerificationResult, MfaStatusResult
from domain.models.mfa_config import MfaConfig
from domain.models.totp_secret import TotpSecret
from domain.models.webauthn_credential import WebAuthnCredential
from domain.ports.mfa_config_repository import MfaConfigRepository


class TotpGenerator:
    """TOTP generation and verification following RFC 6238."""

    @staticmethod
    def generate_secret() -> str:
        """Generate a random Base32-encoded TOTP secret."""
        # Generate 20 bytes (160 bits) of random data
        secret_bytes = os.urandom(20)
        # Encode to Base32 (RFC 4648)
        return base64.b32encode(secret_bytes).decode('utf-8')

    @staticmethod
    def generate_totp(secret: str, time_step: int = None) -> str:
        """Generate a 6-digit TOTP code.

        Args:
            secret: Base32-encoded secret
            time_step: Unix time step (defaults to current time)

        Returns:
            6-digit TOTP code as string
        """
        if time_step is None:
            time_step = int(time.time()) // 30  # 30-second time step

        # Decode Base32 secret
        key = base64.b32decode(secret.upper() + '=' * (-len(secret) % 8))

        # Pack time step as 8-byte big-endian
        msg = struct.pack('>Q', time_step)

        # HMAC-SHA1
        hmac_hash = hmac.new(key, msg, hashlib.sha1).digest()

        # Dynamic truncation
        offset = hmac_hash[-1] & 0x0F
        code = struct.unpack('>I', hmac_hash[offset:offset + 4])[0]
        code &= 0x7FFFFFFF
        code %= 1000000

        return str(code).zfill(6)

    @staticmethod
    def verify_totp(secret: str, code: str, window: int = 1) -> bool:
        """Verify a TOTP code with configurable time window.

        Args:
            secret: Base32-encoded secret
            code: 6-digit code to verify
            window: Number of time steps to check before/after current

        Returns:
            True if code is valid, False otherwise
        """
        current_step = int(time.time()) // 30

        for i in range(-window, window + 1):
            expected = TotpGenerator.generate_totp(secret, current_step + i)
            if hmac.compare_digest(code, expected):
                return True

        return False

    @staticmethod
    def generate_qr_code_url(secret: str, account_name: str, issuer: str) -> str:
        """Generate Google Authenticator QR code URL.

        Args:
            secret: Base32-encoded secret
            account_name: User's email or username
            issuer: Service name

        Returns:
            otpauth:// URL for QR code generation
        """
        label = f"{issuer}:{account_name}"
        params = {
            'secret': secret,
            'issuer': issuer,
            'algorithm': 'SHA1',
            'digits': '6',
            'period': '30'
        }
        query = '&'.join(f"{k}={v}" for k, v in params.items())
        return f"otpauth://totp/{label}?{query}"


class SetupMfaUseCaseImpl:
    """Implementation of SetupMfaUseCase."""

    def __init__(self, mfa_repository: MfaConfigRepository):
        self._mfa_repository = mfa_repository
        self._totp_generator = TotpGenerator()

    def execute(self, user_id: UUID, method: str) -> MfaSetupResult:
        """Set up MFA for a user."""
        # Get existing config or create new
        existing = self._mfa_repository.find_by_user_id(user_id)
        config = existing if existing else MfaConfig.create(user_id)

        totp_secret_str = None
        qr_code_url = None
        backup_codes = None
        webauthn_challenge = None
        webauthn_options = None

        if method.upper() == 'TOTP':
            # Generate new TOTP secret
            secret = self._totp_generator.generate_secret()
            totp_secret = TotpSecret(secret)
            config = config.with_totp(totp_secret)
            totp_secret_str = secret
            qr_code_url = self._totp_generator.generate_qr_code_url(
                secret, f"user-{user_id}", "OrderService"
            )

        elif method.upper() == 'BACKUP_CODE':
            # Generate backup codes
            config = config.with_backup_codes(count=10)
            backup_codes = [code.code for code in config.get_unused_backup_codes()]

        elif method.upper() == 'WEBAUTHN':
            # WebAuthn requires client-side registration first
            # This returns a challenge for the client to sign
            webauthn_challenge = base64.b32encode(os.urandom(32)).decode('utf-8')
            webauthn_options = {
                'challenge': webauthn_challenge,
                'rp': {'name': 'OrderService', 'id': 'localhost'},
                'user': {
                    'id': base64.b32encode(user_id.bytes).decode('utf-8'),
                    'name': f'user-{user_id}',
                    'displayName': f'User {user_id}'
                },
                'pubKeyCredParams': [
                    {'type': 'public-key', 'alg': -7},  # ES256
                    {'type': 'public-key', 'alg': -257},  # RS256
                ],
            }

        # Save configuration
        self._mfa_repository.save(config)

        return MfaSetupResult(
            user_id=user_id,
            method=method.upper(),
            enabled=config.enabled,
            totp_secret=totp_secret_str,
            totp_qr_code_url=qr_code_url,
            backup_codes=backup_codes,
            webauthn_challenge=webauthn_challenge,
            webauthn_options=webauthn_options,
        )


class VerifyMfaUseCaseImpl:
    """Implementation of VerifyMfaUseCase."""

    def __init__(self, mfa_repository: MfaConfigRepository):
        self._mfa_repository = mfa_repository
        self._totp_generator = TotpGenerator()

    def execute(self, user_id: UUID, code: str, method: str) -> MfaVerificationResult:
        """Verify MFA code during login."""
        config = self._mfa_repository.find_by_user_id(user_id)
        if not config:
            raise ValueError(f"No MFA configuration found for user {user_id}")

        method_upper = method.upper()

        if method_upper == 'TOTP':
            if not config.totp_secret:
                raise ValueError("TOTP not configured for user")
            if not config.totp_secret.verified:
                raise ValueError("TOTP secret not verified")

            success = self._totp_generator.verify_totp(
                config.totp_secret.secret, code
            )
            return MfaVerificationResult(
                success=success,
                user_id=user_id,
                method_used='TOTP' if success else None,
            )

        elif method_upper == 'BACKUP_CODE':
            # Find and validate backup code
            unused_codes = config.get_unused_backup_codes()
            for bc in unused_codes:
                if hmac.compare_digest(bc.code, code):
                    # Mark code as used (would need to update config)
                    return MfaVerificationResult(
                        success=True,
                        user_id=user_id,
                        method_used='BACKUP_CODE',
                        remaining_backup_codes=len(unused_codes) - 1,
                    )
            return MfaVerificationResult(
                success=False,
                user_id=user_id,
                method_used=None,
            )

        elif method_upper == 'WEBAUTHN':
            # WebAuthn verification requires cryptographic validation
            # of the assertion response (simplified here)
            # In production: validate signature, check sign_count, etc.
            raise NotImplementedError("WebAuthn verification requires full implementation")

        raise ValueError(f"Unknown MFA method: {method}")


class GetMfaStatusUseCaseImpl:
    """Implementation for getting MFA status."""

    def __init__(self, mfa_repository: MfaConfigRepository):
        self._mfa_repository = mfa_repository

    def execute(self, user_id: UUID) -> MfaStatusResult:
        """Get current MFA status for a user."""
        config = self._mfa_repository.find_by_user_id(user_id)

        if not config:
            return MfaStatusResult(
                user_id=user_id,
                enabled=False,
                methods_configured=[],
                totp_verified=False,
                backup_codes_remaining=0,
                webauthn_credentials_count=0,
            )

        methods = []
        if config.totp_secret:
            methods.append('TOTP')
        if config.get_unused_backup_codes():
            methods.append('BACKUP_CODE')
        if config.get_enabled_webauthn_credentials():
            methods.append('WEBAUTHN')

        return MfaStatusResult(
            user_id=user_id,
            enabled=config.enabled,
            methods_configured=methods,
            totp_verified=config.totp_secret.verified if config.totp_secret else False,
            backup_codes_remaining=len(config.get_unused_backup_codes()),
            webauthn_credentials_count=len(config.get_enabled_webauthn_credentials()),
        )


class DisableMfaUseCaseImpl:
    """Implementation of DisableMfaUseCase."""

    def __init__(self, mfa_repository: MfaConfigRepository):
        self._mfa_repository = mfa_repository

    def execute(self, user_id: UUID) -> bool:
        """Disable MFA for a user."""
        return self._mfa_repository.delete_by_user_id(user_id)
