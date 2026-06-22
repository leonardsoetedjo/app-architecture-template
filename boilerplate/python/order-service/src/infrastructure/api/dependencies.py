from __future__ import annotations
from typing import Annotated
from fastapi import Depends, Request
from .factory import Container

from ..application.usecases.auth_use_case_impl import (
    AuthenticateUserUseCaseImpl, 
    RegisterUserUseCaseImpl, 
    ChangePasswordUseCaseImpl, 
    GetCurrentUserUseCaseImpl
)
from ..domain.ports.auth_ports import TokenParser

def _get_container(request: Request) -> Container:
    return request.app.state.container

def get_authenticate_user_use_case(container: Container = Depends(_get_container)):
    return container.authenticate_user_use_case

def get_register_user_use_case(container: Container = Depends(_get_container)):
    return container.register_user_use_case

def get_change_password_use_case(container: Container = Depends(_get_container)):
    return container.change_password_use_case

def get_current_user_use_case(container: Container = Depends(_get_container)):
    return container.get_current_user_use_case

def get_token_parser(container: Container = Depends(_get_container)):
    return container.token_parser

