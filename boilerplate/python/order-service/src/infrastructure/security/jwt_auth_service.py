from __future__ import annotations
from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
from domain.models.user import User, UserId
from domain.ports.auth_ports import TokenGenerator, TokenParser

class JwtAuthService(TokenGenerator, TokenParser):
    def __init__(self, secret: str, access_token_ttl: int = 3600, refresh_token_ttl: int = 86400):
        self.secret = secret
        self.access_token_ttl = access_token_ttl
        self.refresh_token_ttl = refresh_token_ttl
        self.algorithm = "HS256"

    def generate_access_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user.id.value,
            "email": user.email.value,
            "roles": [r.code for r in user.roles],
            "exp": now + timedelta(seconds=self.access_token_ttl),
            "iat": now
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def generate_refresh_token(self, user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user.id.value,
            "type": "refresh",
            "exp": now + timedelta(seconds=self.refresh_token_ttl),
            "iat": now
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def parse_user_id(self, token: str) -> Optional[UserId]:
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            sub = payload.get("sub")
            return UserId(sub) if sub else None
        except Exception:
            return None

    def is_valid(self, token: str) -> bool:
        try:
            jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return True
        except Exception:
            return False
