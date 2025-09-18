from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import os

from utils.jwt import get_current_user
from schemas.auth import TokenData

router = APIRouter(prefix="/chat", tags=["chat"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


class StreamRequest(BaseModel):
    prompt: str


@router.post("/")
async def chat(
    request: ChatRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Protected chat endpoint - requires authentication"""
    try:
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(
                status_code=400,
                detail="Please provide messages for the chat."
            )
        
        # Here you would integrate with your AI service
        # For now, return a simple response
        return {
            "message": f"Chat response for user {current_user.email}",
            "user_id": str(current_user.user_id),
            "messages_received": len(request.messages)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to process chat request"
        )


@router.post("/stream")
async def stream(
    request: StreamRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Protected stream endpoint - requires authentication"""
    try:
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(
                status_code=400,
                detail="Please provide a valid prompt for text generation."
            )
        
        # Here you would integrate with your streaming AI service
        # For now, return a simple response
        return {
            "message": f"Stream response for user {current_user.email}",
            "user_id": str(current_user.user_id),
            "prompt": request.prompt.strip()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to process stream request"
        )