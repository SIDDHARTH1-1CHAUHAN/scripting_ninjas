from fastapi import APIRouter
from pydantic import BaseModel

from ...services.business_service import business_service
from ...services.mega_llm_service import mega_llm_service

router = APIRouter(prefix="/business", tags=["Business"])


class PitchRequest(BaseModel):
    prompt: str


@router.get("/model")
async def get_business_model():
    return business_service.get_business_model()


@router.post("/pitch")
async def generate_business_pitch(request: PitchRequest):
    return await mega_llm_service.generate_pitch(request.prompt)

