from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .dependencies import get_authenticate_user_use_case, get_register_user_use_case, get_change_password_use_case, get_current_user_use_case, get_token_parser
from application.dtos import LoginCommand, LoginResult, RegisterCommand, RegisterResult, ChangePasswordCommand, UserProfileResult
from domain.models.user import UserId

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register", response_model=RegisterResult, status_code=status.HTTP_201_CREATED)
async def register(command: RegisterCommand, use_case=Depends(get_register_user_use_case)):
    return use_case.execute(command)

@router.post("/login", response_model=LoginResult)
async def login(command: LoginCommand, response: Response, use_case=Depends(get_authenticate_user_use_case)):
    result = use_case.execute(command)
    # Set httpOnly cookies for token storage (security: XSS prevention)
    response.set_cookie(
        key="access_token",
        value=result.accessToken,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="strict",
        max_age=3600,
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refreshToken,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="strict",
        max_age=86400,
    )
    return result

@router.post("/refresh", response_model=LoginResult)
async def refresh(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    token_parser=Depends(get_token_parser),
):
    """Refresh access token using a valid refresh token."""
    user_id = token_parser.parse_user_id(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    # TODO: Implement proper refresh token rotation (new token pair generation)
    # For now, just validate the token exists and return success
    # In production, generate new_access_token + new_refresh_token here

    return {"message": "Token refresh not fully implemented — see auth-flow.md Phase 2"}

@router.post("/logout")
async def logout(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    token_parser=Depends(get_token_parser),
):
    """Logout and invalidate tokens."""
    # TODO: Add token to Redis blacklist with TTL matching token expiry
    # For now, just clear cookies
    user_id = token_parser.parse_user_id(credentials.credentials)
    if user_id:
        pass  # TODO: Blacklist token

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

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
