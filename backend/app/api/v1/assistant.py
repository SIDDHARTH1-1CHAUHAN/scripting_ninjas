from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ...services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str
    context: Optional[list[dict]] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    return await assistant_service.chat(request.message, request.context)
