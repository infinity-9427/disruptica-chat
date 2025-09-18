from fastapi import APIRouter
from . import home, auth, chat

api_router = APIRouter()
api_router.include_router(home.router)
api_router.include_router(auth.router)
api_router.include_router(chat.router)

__all__ = ["api_router"]