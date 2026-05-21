"""JWT dependency injection for FastAPI endpoints.

Domain-agnostic auth service using python-jose.
"""

from typing import Any

from jose import jwt, JWTError

from domain.exceptions import DomainException


class AuthenticationError(DomainException):
    """Raised when token validation fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTH_001")


class AuthService:
    """JWT token generation and validation.

    Constructor-injected secret + algorithm. No global state.
    """

    def __init__(
        self,
        secret_key: str,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 60,
    ):
        self._secret = secret_key
        self._algorithm = algorithm
        self._expire_minutes = access_token_expire_minutes

    def generate_token(self, user_id: str, claims: dict[str, Any] | None = None) -> str:
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        payload: dict[str, Any] = {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(minutes=self._expire_minutes),
            "type": "access",
        }
        if claims:
            payload.update(claims)
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def validate_token(self, token: str) -> dict[str, Any]:
        raw = token.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(raw, self._secret, algorithms=[self._algorithm])
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except JWTError as exc:
            raise AuthenticationError(f"Invalid token: {exc}")
        if payload.get("type") != "access":
            raise AuthenticationError("Token type mismatch")
        return payload

    def extract_user_id(self, token: str) -> str:
        payload = self.validate_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token missing subject claim")
        return user_id
