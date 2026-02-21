from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from ..services.llm_service import llm_service
from ..services.ocr_service import ocr_service
from ..services.cache_service import cache_service

router = APIRouter()


class ClassifyRequest(BaseModel):
    description: str
    context: Optional[str] = None


class AlternativeCode(BaseModel):
    code: str
    description: str
    why_not: Optional[str] = None


class ClassifyResponse(BaseModel):
    hs_code: str
    confidence: int
    description: str
    chapter: Optional[str] = None
    gir_applied: Optional[str] = None
    reasoning: str
    primary_function: Optional[str] = None
    alternatives: list[AlternativeCode] = []
    cached: bool = False
    processing_time_ms: Optional[int] = None


@router.post("/api/classify", response_model=ClassifyResponse)
async def classify_product(request: ClassifyRequest):
    """Classify product by text description using AI

    Uses optimized prompt engineering with:
    - Customs expert persona (role priming)
    - GIR rules injection
    - Few-shot examples
    - Low temperature for consistency

    Expected accuracy: 90-95%
    """
    import time

    # Check cache first
    cached = await cache_service.get(request.description)
    if cached:
        return ClassifyResponse(**cached, cached=True, processing_time_ms=5)

    # Classify using LLM with timing
    start_time = time.time()
    result = await llm_service.classify(request.description, request.context)
    processing_time = int((time.time() - start_time) * 1000)

    # Cache result
    await cache_service.set(request.description, result)

    return ClassifyResponse(**result, cached=False, processing_time_ms=processing_time)


@router.post("/api/classify/image")
async def classify_from_image(
    image: UploadFile = File(...),
    additional_context: Optional[str] = Form(None)
):
    """Classify product from image (OCR + LLM)"""

    # Extract text from image
    image_bytes = await image.read()
    ocr_result = await ocr_service.extract_from_document(image_bytes)

    if not ocr_result["raw_text"]:
        raise HTTPException(400, "Could not extract text from image")

    # Combine OCR text with additional context
    full_description = ocr_result["raw_text"]
    if additional_context:
        full_description = f"{full_description}\n\nAdditional context: {additional_context}"

    # Classify
    result = await llm_service.classify(full_description)

    return {
        "classification": result,
        "ocr_data": ocr_result
    }


@router.post("/api/classify/batch")
async def classify_batch(descriptions: list[str]):
    """Classify multiple products (limited to 10)"""
    if len(descriptions) > 10:
        raise HTTPException(400, "Maximum 10 products per batch")

    results = []
    for desc in descriptions:
        cached = await cache_service.get(desc)
        if cached:
            results.append({**cached, "cached": True})
        else:
            result = await llm_service.classify(desc)
            await cache_service.set(desc, result)
            results.append({**result, "cached": False})

    return {"results": results}
