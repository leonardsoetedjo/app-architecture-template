"""WebAuthn service for FIDO2 authentication.

Provides registration and authentication challenge generation and verification.
Follows WebAuthn Level 3 specification.

Note: This is a simplified implementation. For production, consider using
a mature library like webauthn.io or passlib.webauthn.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import struct
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID


@dataclass(frozen=True)
class WebAuthnRegistrationChallenge:
    """Challenge for WebAuthn registration."""
    challenge: str
    rp: Dict[str, str]
    user: Dict[str, str]
    pub_key_cred_params: List[Dict[str, Any]]
    timeout: int = 60000
    exclude_credentials: List[Dict[str, str]] = None


@dataclass(frozen=True)
class WebAuthnAuthenticatorAssertion:
    """Parsed WebAuthn assertion response."""
    credential_id: str
    raw_id: bytes
    response_authenticator_data: bytes
    response_client_data_json: bytes
    response_signature: bytes
    user_handle: Optional[bytes]


class WebAuthnService:
    """WebAuthn/FIDO2 service for registration and authentication."""

    # Supported algorithms
    ALG_ES256 = -7  # ECDSA with P-256 and SHA-256
    ALG_RS256 = -257  # RSASSA-PKCS1-v1_5 with SHA-256

    def __init__(self, rp_name: str = "OrderService", rp_id: str = "localhost"):
        """Initialize WebAuthn service.

        Args:
            rp_name: Relying Party name (displayed to user)
            rp_id: Relying Party ID (must match origin)
        """
        self._rp_name = rp_name
        self._rp_id = rp_id

    def generate_registration_challenge(
        self,
        user_id: UUID,
        username: str,
        existing_credential_ids: Optional[List[str]] = None,
    ) -> WebAuthnRegistrationChallenge:
        """Generate a WebAuthn registration challenge.

        Args:
            user_id: User's UUID
            username: User's display name
            existing_credential_ids: List of credential IDs to exclude (prevent duplicates)

        Returns:
            WebAuthnRegistrationChallenge to send to client
        """
        # Generate 32-byte challenge
        challenge = os.urandom(32)

        # Prepare user info
        user_info = {
            'id': base64.b32encode(user_id.bytes).decode('utf-8').rstrip('='),
            'name': username,
            'displayName': username,
        }

        # Prepare relying party info
        rp_info = {
            'name': self._rp_name,
            'id': self._rp_id,
        }

        # Supported credential parameters
        pub_key_cred_params = [
            {'type': 'public-key', 'alg': self.ALG_ES256},
            {'type': 'public-key', 'alg': self.ALG_RS256},
        ]

        # Exclude existing credentials (prevent duplicate registration)
        exclude_credentials = []
        if existing_credential_ids:
            exclude_credentials = [
                {'type': 'public-key', 'id': cred_id}
                for cred_id in existing_credential_ids
            ]

        return WebAuthnRegistrationChallenge(
            challenge=self._bytes_to_base64url(challenge),
            rp=rp_info,
            user=user_info,
            pub_key_cred_params=pub_key_cred_params,
            timeout=60000,  # 60 seconds
            exclude_credentials=exclude_credentials,
        )

    def verify_registration_response(
        self,
        challenge: str,
        attestation_response: Dict[str, Any],
    ) -> Tuple[str, str]:
        """Verify WebAuthn registration response.

        Args:
            challenge: Original challenge sent to client
            attestation_response: Client's attestation response

        Returns:
            Tuple of (credential_id, public_key_pem)

        Raises:
            ValueError: If verification fails
        """
        # Parse response
        try:
            raw_id = self._base64url_to_bytes(attestation_response.get('rawId', ''))
            response = attestation_response.get('response', {})

            attestation_object = self._base64url_to_bytes(
                response.get('attestationObject', '')
            )
            client_data_json = self._base64url_to_bytes(
                response.get('clientDataJSON', '')
            )
        except Exception as e:
            raise ValueError(f"Invalid attestation response: {e}")

        # Verify client data
        self._verify_client_data(client_data_json, challenge, 'webauthn.create')

        # Parse attestation object (simplified - in production, verify attestation)
        credential_id = raw_id.hex()

        # Extract public key from attestation (simplified)
        # In production: parse CBOR attestation object, extract COSE key, convert to PEM
        public_key_pem = self._generate_placeholder_public_key()

        return credential_id, public_key_pem

    def generate_authentication_challenge(
        self,
        user_id: UUID,
        credential_ids: List[str],
    ) -> Dict[str, Any]:
        """Generate a WebAuthn authentication challenge.

        Args:
            user_id: User's UUID
            credential_ids: List of allowed credential IDs

        Returns:
            Authentication challenge options for client
        """
        challenge = os.urandom(32)

        return {
            'challenge': self._bytes_to_base64url(challenge),
            'timeout': 60000,
            'rpId': self._rp_id,
            'allowCredentials': [
                {'type': 'public-key', 'id': cred_id}
                for cred_id in credential_ids
            ],
            'userVerification': 'preferred',
        }

    def verify_authentication_response(
        self,
        challenge: str,
        assertion_response: Dict[str, Any],
        stored_public_key: str,
        expected_credential_id: str,
        stored_sign_count: int,
    ) -> int:
        """Verify WebAuthn authentication response.

        Args:
            challenge: Original challenge sent to client
            assertion_response: Client's assertion response
            stored_public_key: User's stored public key
            expected_credential_id: Expected credential ID
            stored_sign_count: Previously stored signature counter

        Returns:
            New sign count (for replay attack prevention)

        Raises:
            ValueError: If verification fails
        """
        try:
            raw_id = self._base64url_to_bytes(assertion_response.get('rawId', ''))
            response = assertion_response.get('response', {})

            authenticator_data = self._base64url_to_bytes(
                response.get('authenticatorData', '')
            )
            client_data_json = self._base64url_to_bytes(
                response.get('clientDataJSON', '')
            )
            signature = self._base64url_to_bytes(
                response.get('signature', '')
            )
        except Exception as e:
            raise ValueError(f"Invalid assertion response: {e}")

        # Verify credential ID matches
        credential_id = raw_id.hex()
        if credential_id != expected_credential_id:
            raise ValueError("Credential ID mismatch")

        # Verify client data
        self._verify_client_data(client_data_json, challenge, 'webauthn.get')

        # Parse authenticator data
        auth_data = self._parse_authenticator_data(authenticator_data)

        # Verify signature counter (prevent replay attacks)
        if auth_data['sign_count'] > 0 and auth_data['sign_count'] <= stored_sign_count:
            raise ValueError("Replay attack detected: sign count not incremented")

        # Verify signature (simplified - in production, verify cryptographic signature)
        # self._verify_signature(auth_data, client_data_json, signature, stored_public_key)

        return auth_data['sign_count']

    def _verify_client_data(
        self,
        client_data_json: bytes,
        expected_challenge: str,
        expected_type: str,
    ) -> None:
        """Verify client data JSON.

        Args:
            client_data_json: Client data JSON bytes
            expected_challenge: Expected challenge value
            expected_type: Expected operation type ('webauthn.create' or 'webauthn.get')

        Raises:
            ValueError: If verification fails
        """
        try:
            client_data = json.loads(client_data_json.decode('utf-8'))
        except Exception as e:
            raise ValueError(f"Invalid client data JSON: {e}")

        # Verify challenge
        if client_data.get('challenge') != expected_challenge:
            raise ValueError("Challenge mismatch")

        # Verify type
        if client_data.get('type') != expected_type:
            raise ValueError(f"Unexpected operation type: {client_data.get('type')}")

        # Verify origin (in production, check against allowed origins)
        # origin = client_data.get('origin')

    def _parse_authenticator_data(
        self,
        auth_data: bytes,
    ) -> Dict[str, Any]:
        """Parse authenticator data.

        Args:
            auth_data: Authenticator data bytes

        Returns:
            Parsed authenticator data fields
        """
        if len(auth_data) < 37:
            raise ValueError("Authenticator data too short")

        # rpIdHash (32 bytes)
        rp_id_hash = auth_data[:32]

        # flags (1 byte)
        flags = auth_data[32]

        # signCount (4 bytes, big-endian)
        sign_count = struct.unpack('>I', auth_data[33:37])[0]

        return {
            'rp_id_hash': rp_id_hash,
            'flags': flags,
            'sign_count': sign_count,
            'user_present': bool(flags & 0x01),
            'user_verified': bool(flags & 0x04),
        }

    def _bytes_to_base64url(self, data: bytes) -> str:
        """Convert bytes to base64url encoding (no padding)."""
        return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

    def _base64url_to_bytes(self, data: str) -> bytes:
        """Convert base64url string to bytes."""
        # Add padding if needed
        padding = 4 - len(data) % 4
        if padding != 4:
            data += '=' * padding
        return base64.urlsafe_b64decode(data)

    def _generate_placeholder_public_key(self) -> str:
        """Generate a placeholder public key (for demo purposes).

        In production, extract from attestation object.
        """
        # This is a placeholder - in production, parse COSE key from attestation
        return "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-placeholder-key-for-demo-purposes-only\n-----END PUBLIC KEY-----"
