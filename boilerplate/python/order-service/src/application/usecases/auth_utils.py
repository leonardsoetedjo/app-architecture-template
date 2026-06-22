from __future__ import annotations
from application.dtos import LoginResult, RegisterResult, UserProfileResult
from domain.models.user import Role, USER_ROLE
from typing import Set

# Use USER_ROLE instead of Role.USER
def get_default_roles() -> Set[Role]:
    return {USER_ROLE}
