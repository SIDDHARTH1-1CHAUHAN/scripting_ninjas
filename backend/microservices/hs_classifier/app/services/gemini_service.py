import base64
import json
import logging
import os
import re
from typing import Optional

import httpx

from ..prompts.classification import HS_CLASSIFICATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Raised when Gemini image classification fails."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


class GeminiService:
    """Gemini multimodal service for image-based HS classification."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.base_url = os.getenv(
            "GEMINI_API_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta",
        )
        self.timeout = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "40"))

    async def classify_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        additional_context: Optional[str] = None,
    ) -> dict:
        """Classify an image using Gemini multimodal inference."""
        if not self.api_key:
            raise GeminiServiceError("Gemini API key is not configured")

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        user_prompt = self._build_image_prompt(additional_context)

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": user_prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type or "image/jpeg",
                                "data": encoded_image,
                            }
                        },
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.9,
                "maxOutputTokens": 1200,
                "responseMimeType": "application/json",
            },
        }

        endpoint = f"{self.base_url}/models/{self.model}:generateContent"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    endpoint,
                    params={"key": self.api_key},
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            message = "Gemini request failed"
            try:
                payload = exc.response.json()
                provider_message = payload.get("error", {}).get("message")
                if provider_message:
                    message = provider_message
            except Exception:
                pass
            logger.error(
                "Gemini classify_image HTTP error %s: %s", status_code, message
            )
            raise GeminiServiceError(message=message, status_code=status_code) from exc
        except httpx.TimeoutException as exc:
            raise GeminiServiceError("Gemini request timed out", status_code=504) from exc
        except Exception as exc:
            logger.error("Gemini classify_image request failed: %s", exc)
            raise GeminiServiceError("Gemini request failed", status_code=502) from exc

        raw_text = self._extract_candidate_text(data)
        parsed = self._parse_json(raw_text)
        return self._normalize_result(parsed, raw_text)

    def _build_image_prompt(self, additional_context: Optional[str]) -> str:
        context_block = (
            f"\nAdditional context from user:\n{additional_context}\n"
            if additional_context
            else ""
        )

        return (
            f"{HS_CLASSIFICATION_SYSTEM_PROMPT}\n\n"
            "You are classifying a product from an uploaded photo.\n"
            "Focus on the product's primary function, material, form factor, and commercial identity.\n"
            "If image quality is poor, still provide the best probable classification and lower confidence.\n"
            f"{context_block}\n"
            "Return JSON only using the required structure."
        )

    def _extract_candidate_text(self, response_data: dict) -> str:
        candidates = response_data.get("candidates", [])
        if not candidates:
            raise GeminiServiceError("Gemini returned no candidates")

        parts = candidates[0].get("content", {}).get("parts", [])
        text_chunks = [part.get("text", "") for part in parts if part.get("text")]
        if not text_chunks:
            raise GeminiServiceError("Gemini returned empty content")
        return "\n".join(text_chunks).strip()

    def _parse_json(self, text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise GeminiServiceError("Gemini response was not valid JSON")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise GeminiServiceError("Gemini JSON parsing failed") from exc

    def _normalize_result(self, parsed: dict, raw_text: str) -> dict:
        hs_code = str(parsed.get("hs_code", "0000.00.00")).strip()
        confidence = int(parsed.get("confidence", 50))
        confidence = max(1, min(confidence, 100))

        alternatives = parsed.get("alternatives", [])
        normalized_alternatives = []
        if isinstance(alternatives, list):
            for alternative in alternatives[:3]:
                if not isinstance(alternative, dict):
                    continue
                normalized_alternatives.append(
                    {
                        "code": str(alternative.get("code", "")).strip(),
                        "description": str(alternative.get("description", "")).strip(),
                        "why_not": str(alternative.get("why_not", "")).strip(),
                    }
                )

        return {
            "hs_code": hs_code or "0000.00.00",
            "confidence": confidence,
            "description": str(parsed.get("description", "")).strip() or "Unknown product classification",
            "chapter": str(parsed.get("chapter", "")).strip(),
            "gir_applied": str(parsed.get("gir_applied", "")).strip(),
            "reasoning": str(parsed.get("reasoning", "")).strip() or raw_text[:500],
            "primary_function": str(parsed.get("primary_function", "")).strip(),
            "alternatives": normalized_alternatives,
            "image_summary": str(parsed.get("image_summary", "")).strip(),
            "provider": "gemini",
            "model": self.model,
        }


gemini_service = GeminiService()
