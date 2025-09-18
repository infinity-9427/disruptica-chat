from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenRefresh
from controllers.auth import auth_controller
from utils.jwt import get_current_user, verify_token
from schemas.auth import TokenData
from database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user = auth_controller.create_user(db, user_data)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT tokens"""
    try:
        token = auth_controller.login_user(db, login_data)
        return token
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        verify_token(token_data.refresh_token, "refresh")
        token = auth_controller.refresh_access_token(db, token_data.refresh_token)
        return token
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    user = auth_controller.get_user_by_id(db, current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.post("/logout")
async def logout(token_data: TokenRefresh):
    """Logout user by invalidating refresh token"""
    try:
        if token_data.refresh_token in auth_controller.refresh_tokens:
            del auth_controller.refresh_tokens[token_data.refresh_token]
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )