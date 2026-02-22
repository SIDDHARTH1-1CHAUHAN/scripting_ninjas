import hashlib
import os
import time
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from ..services.llm_service import llm_service
from ..services.gemini_service import gemini_service, GeminiServiceError
from ..services.groq_vision_service import groq_vision_service, GroqVisionServiceError
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


class ImageAnalysisData(BaseModel):
    raw_text: str
    detected_fields: dict
    source: str


class ImageClassifyResponse(BaseModel):
    classification: ClassifyResponse
    ocr_data: ImageAnalysisData


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
    # Check cache first
    cached = await cache_service.get(request.description, request.context)
    if cached:
        return ClassifyResponse(**cached, cached=True, processing_time_ms=5)

    # Classify using LLM with timing
    start_time = time.time()
    result = await llm_service.classify(request.description, request.context)
    processing_time = int((time.time() - start_time) * 1000)

    # Cache result
    await cache_service.set(request.description, result, request.context)

    return ClassifyResponse(**result, cached=False, processing_time_ms=processing_time)


@router.post("/api/classify/image", response_model=ImageClassifyResponse)
async def classify_from_image(
    image: UploadFile = File(...),
    additional_context: Optional[str] = Form(None)
):
    """Classify product from image using configured multimodal providers."""
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    start_time = time.time()
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image payload")

    # 8 MB safety guard
    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 8MB limit")

    context_key = additional_context or ""
    image_hash = hashlib.sha256(image_bytes + context_key.encode()).hexdigest()
    cache_key = f"image:{image_hash}"

    cached = await cache_service.get_by_value(cache_key, namespace="hs_img")
    if cached:
        classification_payload = dict(cached.get("classification", {}))
        classification_payload["cached"] = True
        classification_payload["processing_time_ms"] = 5
        cached_ocr_data = cached.get("ocr_data", {})
        return ImageClassifyResponse(
            classification=ClassifyResponse(**classification_payload),
            ocr_data=ImageAnalysisData(
                raw_text=cached_ocr_data.get("raw_text", "Image analysis (cached)"),
                detected_fields=cached_ocr_data.get("detected_fields", {}),
                source=cached_ocr_data.get("source", "unknown"),
            ),
        )

    provider_mode = os.getenv("HS_IMAGE_CLASSIFIER_PROVIDER", "groq").strip().lower()
    if provider_mode == "gemini":
        provider_order = ["gemini", "groq"]
    elif provider_mode == "groq":
        provider_order = ["groq", "gemini"]
    else:
        provider_order = ["groq", "gemini"]

    result = None
    last_status = 502
    provider_errors: list[str] = []

    for provider in provider_order:
        try:
            if provider == "groq":
                result = await groq_vision_service.classify_image(
                    image_bytes=image_bytes,
                    mime_type=image.content_type or "image/jpeg",
                    additional_context=additional_context,
                )
            else:
                result = await gemini_service.classify_image(
                    image_bytes=image_bytes,
                    mime_type=image.content_type or "image/jpeg",
                    additional_context=additional_context,
                )
            break
        except (GroqVisionServiceError, GeminiServiceError) as exc:
            provider_errors.append(f"{provider}: {str(exc)}")
            last_status = exc.status_code

    if result is None:
        raise HTTPException(
            status_code=last_status,
            detail="Image classification failed across providers. " + " | ".join(provider_errors),
        )

    processing_time_ms = int((time.time() - start_time) * 1000)

    classification_payload = {
        "hs_code": result.get("hs_code", "0000.00.00"),
        "confidence": result.get("confidence", 50),
        "description": result.get("description", ""),
        "chapter": result.get("chapter", ""),
        "gir_applied": result.get("gir_applied", ""),
        "reasoning": result.get("reasoning", ""),
        "primary_function": result.get("primary_function", ""),
        "alternatives": result.get("alternatives", []),
        "cached": False,
        "processing_time_ms": processing_time_ms,
    }

    image_analysis_payload = {
        "raw_text": result.get("image_summary", "Vision analysis completed"),
        "detected_fields": {
            "provider": result.get("provider", "unknown"),
            "model": result.get("model", ""),
        },
        "source": result.get("provider", "unknown"),
    }

    await cache_service.set_by_value(
        cache_key,
        {"classification": classification_payload, "ocr_data": image_analysis_payload},
        namespace="hs_img",
    )

    return ImageClassifyResponse(
        classification=ClassifyResponse(**classification_payload),
        ocr_data=ImageAnalysisData(**image_analysis_payload),
    )


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
