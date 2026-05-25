"""FastAPI controller for MFA endpoints.

Follows Clean Architecture: controller is infrastructure only.
All dependencies injected via FastAPI Depends at router level.
"""

from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ConfigDict

from application.dtos import MfaSetupResult, MfaVerificationResult, MfaStatusResult
from application.usecases.mfa_use_case_impl import (
    SetupMfaUseCaseImpl,
    VerifyMfaUseCaseImpl,
    GetMfaStatusUseCaseImpl,
    DisableMfaUseCaseImpl,
)
from infrastructure.api.dependencies import (
    get_mfa_repository,
    get_current_user,
    get_webauthn_service,
)
from infrastructure.services.webauthn_service import WebAuthnService


# Request/Response DTOs

class SetupMfaRequest(BaseModel):
    """HTTP request to set up MFA."""
    model_config = ConfigDict(populate_by_name=True)
    method: str = Field(..., description="MFA method: 'TOTP', 'BACKUP_CODE', or 'WEBAUTHN'")


class SetupMfaResponse(BaseModel):
    """HTTP response after MFA setup."""
    userId: str
    method: str
    enabled: bool
    totpSecret: str | None = None
    totpQrCodeUrl: str | None = None
    backupCodes: list[str] | None = None
    webauthnChallenge: str | None = None
    webauthnOptions: dict | None = None


class VerifyMfaRequest(BaseModel):
    """HTTP request to verify MFA code."""
    model_config = ConfigDict(populate_by_name=True)
    code: str = Field(..., description="MFA code (TOTP or backup code)")
    method: str = Field(..., description="MFA method used")


class WebAuthnCompleteRequest(BaseModel):
    """HTTP request to complete WebAuthn registration."""
    model_config = ConfigDict(populate_by_name=True)
    attestation_response: Dict[str, Any] = Field(..., description="WebAuthn attestation response")


class WebAuthnAuthenticateRequest(BaseModel):
    """HTTP request for WebAuthn authentication."""
    model_config = ConfigDict(populate_by_name=True)
    assertion_response: Dict[str, Any] = Field(..., description="WebAuthn assertion response")


class VerifyMfaResponse(BaseModel):
    """HTTP response after MFA verification."""
    success: bool
    userId: str
    methodUsed: str | None = None
    remainingBackupCodes: int | None = None


class MfaStatusResponse(BaseModel):
    """HTTP response showing current MFA status."""
    userId: str
    enabled: bool
    methodsConfigured: list[str]
    totpVerified: bool
    backupCodesRemaining: int
    webauthnCredentialsCount: int


router = APIRouter(tags=["mfa"])


@router.post("/mfa/setup", response_model=SetupMfaResponse)
def setup_mfa(
    request: SetupMfaRequest,
    use_case: SetupMfaUseCaseImpl = Depends(lambda: Depends(get_setup_mfa_use_case)),
    user_id: str = Depends(get_current_user),
) -> SetupMfaResponse:
    """Set up MFA for the authenticated user.

    Methods:
    - **TOTP**: Returns secret and QR code URL for authenticator apps
    - **BACKUP_CODE**: Generates 10 one-time backup codes (show once!)
    - **WEBAUTHN**: Returns challenge for WebAuthn registration
    """
    result: MfaSetupResult = use_case.execute(UUID(user_id), request.method)

    return SetupMfaResponse(
        userId=str(result.user_id),
        method=result.method,
        enabled=result.enabled,
        totpSecret=result.totp_secret,
        totpQrCodeUrl=result.totp_qr_code_url,
        backupCodes=result.backup_codes,
        webauthnChallenge=result.webauthn_challenge,
        webauthnOptions=result.webauthn_options,
    )


@router.post("/mfa/verify", response_model=VerifyMfaResponse)
def verify_mfa(
    request: VerifyMfaRequest,
    use_case: VerifyMfaUseCaseImpl = Depends(lambda: Depends(get_verify_mfa_use_case)),
    user_id: str = Depends(get_current_user),
) -> VerifyMfaResponse:
    """Verify MFA code during login.

    Use this endpoint after successful password authentication
    as the second factor in multi-factor authentication.
    """
    result: MfaVerificationResult = use_case.execute(UUID(user_id), request.code, request.method)

    return VerifyMfaResponse(
        success=result.success,
        userId=str(result.user_id),
        methodUsed=result.method_used,
        remainingBackupCodes=result.remaining_backup_codes,
    )


@router.get("/mfa/status", response_model=MfaStatusResponse)
def get_mfa_status(
    use_case: GetMfaStatusUseCaseImpl = Depends(lambda: Depends(get_mfa_status_use_case)),
    user_id: str = Depends(get_current_user),
) -> MfaStatusResponse:
    """Get current MFA status for the authenticated user."""
    result: MfaStatusResult = use_case.execute(UUID(user_id))

    return MfaStatusResponse(
        userId=str(result.user_id),
        enabled=result.enabled,
        methodsConfigured=result.methods_configured,
        totpVerified=result.totp_verified,
        backupCodesRemaining=result.backup_codes_remaining,
        webauthnCredentialsCount=result.webauthn_credentials_count,
    )


@router.delete("/mfa/disable", status_code=204)
def disable_mfa(
    use_case: DisableMfaUseCaseImpl = Depends(lambda: Depends(get_disable_mfa_use_case)),
    user_id: str = Depends(get_current_user),
) -> None:
    """Disable MFA for the authenticated user.

    WARNING: This removes all MFA methods. Use with caution.
    """
    use_case.execute(UUID(user_id))


@router.post("/mfa/webauthn/complete-registration")
def complete_webauthn_registration(
    request: WebAuthnCompleteRequest,
    mfa_repo = Depends(get_mfa_repository),
    webauthn_service: WebAuthnService = Depends(get_webauthn_service),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Complete WebAuthn registration after client attestation.

    Call this after the client completes navigator.credentials.create()
    with the options from /mfa/setup (method=WEBAUTHN).
    """
    from domain.models.mfa_config import MfaConfig
    from domain.models.webauthn_credential import WebAuthnCredential

    user_uuid = UUID(user_id)
    config = mfa_repo.find_by_user_id(user_uuid)
    if not config:
        raise ValueError("No MFA configuration found")

    try:
        # Verify attestation and extract credential
        credential_id, public_key = webauthn_service.verify_registration_response(
            challenge="placeholder",  # In production: retrieve from session
            attestation_response=request.attestation_response,
        )

        # Add credential to config
        credential = WebAuthnCredential(
            credential_id=credential_id,
            public_key=public_key,
            sign_count=0,
            enabled=True,
        )
        config = config.with_webauthn_credential(credential)
        mfa_repo.save(config)

        return {
            "success": True,
            "credentialId": credential_id,
            "message": "WebAuthn credential registered successfully",
        }

    except ValueError as e:
        raise ValueError(f"WebAuthn registration failed: {e}")


@router.post("/mfa/webauthn/authenticate")
def webauthn_authenticate(
    request: WebAuthnAuthenticateRequest,
    mfa_repo = Depends(get_mfa_repository),
    webauthn_service: WebAuthnService = Depends(get_webauthn_service),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Authenticate using WebAuthn.

    Call this after the client completes navigator.credentials.get()
    with the options from a previous authentication challenge.
    """
    from domain.models.mfa_config import MfaConfig

    user_uuid = UUID(user_id)
    config = mfa_repo.find_by_user_id(user_uuid)
    if not config:
        raise ValueError("No MFA configuration found")

    # Get credential from request
    credential_id = request.assertion_response.get('rawId', '')

    # Find matching credential in config
    matching_cred = None
    for cred in config.get_enabled_webauthn_credentials():
        if cred.credential_id == credential_id:
            matching_cred = cred
            break

    if not matching_cred:
        raise ValueError("Credential not found")

    try:
        # Verify assertion
        new_sign_count = webauthn_service.verify_authentication_response(
            challenge="placeholder",  # In production: retrieve from session
            assertion_response=request.assertion_response,
            stored_public_key=matching_cred.public_key,
            expected_credential_id=matching_cred.credential_id,
            stored_sign_count=matching_cred.sign_count,
        )

        # Update sign count (would need to save back to config)
        # For now, just return success

        return {
            "success": True,
            "userId": user_id,
            "credentialId": credential_id,
            "newSignCount": new_sign_count,
        }

    except ValueError as e:
        raise ValueError(f"WebAuthn authentication failed: {e}")


@router.get("/mfa/webauthn/authenticate-options")
def get_webauthn_authenticate_options(
    mfa_repo = Depends(get_mfa_repository),
    webauthn_service: WebAuthnService = Depends(get_webauthn_service),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get WebAuthn authentication options for existing user.

    Call this before navigator.credentials.get() to get the challenge.
    """
    user_uuid = UUID(user_id)
    config = mfa_repo.find_by_user_id(user_uuid)
    if not config:
        raise ValueError("No MFA configuration found")

    credential_ids = [
        cred.credential_id
        for cred in config.get_enabled_webauthn_credentials()
    ]

    options = webauthn_service.generate_authentication_challenge(
        user_id=user_uuid,
        credential_ids=credential_ids,
    )

    return options
