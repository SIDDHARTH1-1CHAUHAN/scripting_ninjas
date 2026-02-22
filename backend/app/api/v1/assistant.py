from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ...services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class UserProfile(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    preferred_lanes: Optional[list[str]] = None
    priorities: Optional[list[str]] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[list[dict]] = None
    user_profile: Optional[UserProfile] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    profile = request.user_profile.model_dump(exclude_none=True) if request.user_profile else None
    return await assistant_service.chat(request.message, request.context, profile)
