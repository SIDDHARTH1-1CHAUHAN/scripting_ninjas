import os

import httpx


class MegaLLMService:
    """Small optional feature using MegaLLM for hackathon points."""

    def __init__(self) -> None:
        self.api_key = os.getenv("MEGALLM_API_KEY", "").strip()
        self.base_url = os.getenv("MEGALLM_BASE_URL", "https://ai.megallm.io/v1").rstrip("/")
        self.model = os.getenv("MEGALLM_MODEL", "gpt-4")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv(
            "GROQ_MODEL_ASSISTANT",
            os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_pitch(self, prompt: str) -> dict:
        if not self.api_key:
            return {
                "pitch": "MegaLLM key not configured. Add MEGALLM_API_KEY to enable AI pitch generation.",
                "provider": "megallm",
                "model": self.model,
                "live": False,
            }

        system_prompt = (
            "You are a B2B SaaS strategist for trade-tech startups. "
            "Write concise, investor-friendly go-to-market pitch bullets."
        )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.4,
                        "max_tokens": 260,
                    },
                    timeout=20.0,
                )
                response.raise_for_status()
                payload = response.json()
                text = payload["choices"][0]["message"]["content"].strip()
                return {
                    "pitch": text,
                    "provider": "megallm",
                    "model": self.model,
                    "live": True,
                }
        except Exception as exc:  # pragma: no cover - network/provider variability
            fallback = await self._groq_fallback(system_prompt, prompt)
            if fallback:
                return fallback
            return {
                "pitch": (
                    "TradeOptimize AI monetizes as a SaaS platform for SMB importers: "
                    "subscription tiers + usage-based AI credits + enterprise compliance add-ons."
                ),
                "provider": "megallm",
                "model": self.model,
                "live": False,
                "error": str(exc),
            }

    async def _groq_fallback(self, system_prompt: str, user_prompt: str) -> dict | None:
        if not self.groq_api_key:
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.groq_url,
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.groq_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.4,
                        "max_tokens": 260,
                    },
                    timeout=20.0,
                )
                response.raise_for_status()
                payload = response.json()
                text = payload["choices"][0]["message"]["content"].strip()
                return {
                    "pitch": text,
                    "provider": "groq_fallback",
                    "model": self.groq_model,
                    "live": True,
                    "fallback_reason": "megallm_unavailable",
                }
        except Exception:
            return None


mega_llm_service = MegaLLMService()
