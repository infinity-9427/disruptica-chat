from fastapi import APIRouter
from . import home

api_router = APIRouter()
api_router.include_router(home.router)

__all__ = ["api_router"]