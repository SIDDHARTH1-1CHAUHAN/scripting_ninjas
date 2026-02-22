import base64
import json
import logging
import os
import re
from typing import Optional

import httpx

from ..prompts.classification import HS_CLASSIFICATION_SYSTEM_PROMPT, FEW_SHOT_EXAMPLES

logger = logging.getLogger(__name__)


class GroqVisionServiceError(Exception):
    """Raised when Groq image classification fails."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


class GroqVisionService:
    """Groq multimodal service for image-based HS classification."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = os.getenv(
            "GROQ_VISION_MODEL",
            os.getenv("GROQ_MODEL", "llama-3.2-90b-vision-preview"),
        )
        self.base_url = os.getenv(
            "GROQ_API_BASE_URL",
            "https://api.groq.com/openai/v1",
        ).rstrip("/")
        self.timeout = float(os.getenv("GROQ_VISION_TIMEOUT_SECONDS", "40"))

    async def classify_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        additional_context: Optional[str] = None,
    ) -> dict:
        if not self.api_key:
            raise GroqVisionServiceError("Groq API key is not configured", status_code=503)

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        prompt = self._build_image_prompt(additional_context)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": HS_CLASSIFICATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type or 'image/jpeg'};base64,{encoded_image}"
                            },
                        },
                    ],
                },
            ],
            "temperature": 0.1,
            "top_p": 0.9,
            "max_tokens": 1200,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            message = "Groq request failed"
            try:
                error_payload = exc.response.json()
                provider_message = error_payload.get("error", {}).get("message")
                if provider_message:
                    message = provider_message
            except Exception:
                pass
            logger.error("Groq classify_image HTTP error %s: %s", status_code, message)
            raise GroqVisionServiceError(message=message, status_code=status_code) from exc
        except httpx.TimeoutException as exc:
            raise GroqVisionServiceError("Groq request timed out", status_code=504) from exc
        except Exception as exc:
            logger.error("Groq classify_image request failed: %s", exc)
            raise GroqVisionServiceError("Groq request failed", status_code=502) from exc

        raw_text = self._extract_content(data)
        parsed = self._parse_json(raw_text)
        return self._normalize_result(parsed, raw_text)

    def _build_image_prompt(self, additional_context: Optional[str]) -> str:
        context_block = (
            f"\nAdditional context from user:\n{additional_context}\n"
            if additional_context
            else ""
        )
        return (
            "You are classifying a product from an uploaded image.\n"
            "Focus on PRIMARY FUNCTION first, then material, then GIR rules.\n"
            "Use visible labels/packaging text when present.\n"
            f"{context_block}\n"
            f"{FEW_SHOT_EXAMPLES}\n"
            "Return JSON only with the required schema."
        )

    def _extract_content(self, data: dict) -> str:
        try:
            content = data["choices"][0]["message"]["content"]
        except Exception as exc:
            raise GroqVisionServiceError("Groq returned an unexpected response") from exc

        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            text_chunks = []
            for part in content:
                if isinstance(part, dict) and isinstance(part.get("text"), str):
                    text_chunks.append(part["text"])
            if text_chunks:
                return "\n".join(text_chunks).strip()

        raise GroqVisionServiceError("Groq returned empty content")

    def _parse_json(self, text: str) -> dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise GroqVisionServiceError("Groq response was not valid JSON")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise GroqVisionServiceError("Groq JSON parsing failed") from exc

    def _normalize_result(self, parsed: dict, raw_text: str) -> dict:
        hs_code = str(parsed.get("hs_code", "0000.00.00")).strip() or "0000.00.00"
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
            "hs_code": hs_code,
            "confidence": confidence,
            "description": str(parsed.get("description", "")).strip() or "Unknown product classification",
            "chapter": str(parsed.get("chapter", "")).strip(),
            "gir_applied": str(parsed.get("gir_applied", "")).strip(),
            "reasoning": str(parsed.get("reasoning", "")).strip() or raw_text[:500],
            "primary_function": str(parsed.get("primary_function", "")).strip(),
            "alternatives": normalized_alternatives,
            "image_summary": str(parsed.get("image_summary", "")).strip()
            or "Groq vision analysis completed",
            "provider": "groq",
            "model": self.model,
        }


groq_vision_service = GroqVisionService()
