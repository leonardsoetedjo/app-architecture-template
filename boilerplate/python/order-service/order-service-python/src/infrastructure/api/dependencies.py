"""JWT dependency injection for FastAPI endpoints."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from domain.services.auth_service import AuthService, AuthenticationError
from infrastructure.config import get_settings


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False,
)


def _get_auth_service() -> AuthService:
    """Factory: create AuthService from app settings."""
    settings = get_settings()
    return AuthService(
        secret_key=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_token_expire_minutes=settings.jwt_expire_minutes,
    )


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)]
) -> str:
    """FastAPI dependency: validate JWT and return user_id.

    Use in endpoint signatures:
        def create_order(..., user_id: str = Depends(get_current_user)):
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return _get_auth_service().extract_user_id(token)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
