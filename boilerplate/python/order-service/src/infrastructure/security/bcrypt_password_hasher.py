from __future__ import annotations
from domain.ports.auth_ports import PasswordHasher
import bcrypt

class BCryptPasswordHasher(PasswordHasher):
    def hash(self, plaintext: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(plaintext.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def matches(self, plaintext: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plaintext.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False
