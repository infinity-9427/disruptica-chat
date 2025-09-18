from datetime import datetime, timedelta
from typing import Dict, Optional
from uuid import UUID
from fastapi import HTTPException, status, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from models.user import User
from schemas.auth import UserCreate, UserLogin, UserResponse, Token
from utils.jwt import create_access_token, create_refresh_token
from database import get_db


class AuthController:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.refresh_tokens: Dict[str, UUID] = {}  # Store refresh tokens (Redis in production)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, db: Session, user_id: UUID) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, db: Session, user_data: UserCreate) -> UserResponse:
        if self.get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = self.get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login
        )
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    def login_user(self, db: Session, login_data: UserLogin) -> Token:
        user = self.authenticate_user(db, login_data.email, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Store refresh token
        self.refresh_tokens[refresh_token] = user.id
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=30 * 60  # 30 minutes
        )
    
    def refresh_access_token(self, db: Session, refresh_token: str) -> Token:
        if refresh_token not in self.refresh_tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = self.refresh_tokens[refresh_token]
        user = self.get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Remove old refresh token
        del self.refresh_tokens[refresh_token]
        
        # Create new tokens
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Store new refresh token
        self.refresh_tokens[new_refresh_token] = user.id
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=30 * 60  # 30 minutes
        )


# Global instance for dependency injection
auth_controller = AuthController()