from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .dependencies import get_authenticate_user_use_case, get_register_user_use_case, get_change_password_use_case, get_current_user_use_case, get_token_parser
from ..application.dtos import LoginCommand, LoginResult, RegisterCommand, RegisterResult, ChangePasswordCommand, UserProfileResult
from ..domain.models.user import UserId

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register", response_model=RegisterResult, status_code=status.HTTP_201_CREATED)
async def register(command: RegisterCommand, use_case=Depends(get_register_user_use_case)):
    return use_case.execute(command)

@router.post("/login", response_model=LoginResult)
async def login(command: LoginCommand, use_case=Depends(get_authenticate_user_use_case)):
    return use_case.execute(command)

@router.get("/me", response_model=UserProfileResult)
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    use_case=Depends(get_current_user_use_case),
    token_parser=Depends(get_token_parser)
):
    user_id = token_parser.parse_user_id(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return use_case.execute(user_id)

@router.post("/change-password")
async def change_password(
    command: ChangePasswordCommand,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    use_case=Depends(get_change_password_use_case),
    token_parser=Depends(get_token_parser)
):
    user_id = token_parser.parse_user_id(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    use_case.execute(str(user_id.value), command)
    return {"message": "Password changed successfully"}
