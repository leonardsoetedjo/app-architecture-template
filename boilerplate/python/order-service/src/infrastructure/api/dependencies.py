"""FastAPI dependency providers.

Avoids circular import with factory.py by using app.state directly.
"""

from __future__ import annotations
from typing import Annotated, Any
from fastapi import Depends, Request


def _get_container(request: Request) -> Any:
    return request.app.state.container


def get_authenticate_user_use_case(container: Any = Depends(_get_container)):
    return container.authenticate_user_use_case


def get_register_user_use_case(container: Any = Depends(_get_container)):
    return container.register_user_use_case


def get_change_password_use_case(container: Any = Depends(_get_container)):
    return container.change_password_use_case


def get_current_user_use_case(container: Any = Depends(_get_container)):
    return container.get_current_user_use_case


def get_token_parser(container: Any = Depends(_get_container)):
    return container.token_parser


def get_refresh_token_use_case(container: Any = Depends(_get_container)):
    return container.refresh_token_use_case


def get_logout_use_case(container: Any = Depends(_get_container)):
    return container.logout_use_case
