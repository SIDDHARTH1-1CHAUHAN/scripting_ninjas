import os
from typing import Optional

import httpx


class AssistantService:
    """AI Trade Assistant using Groq API"""

    def __init__(self) -> None:
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"

    async def chat(self, message: str, context: Optional[list[dict]] = None) -> dict:
        """Send message to AI assistant"""

        system_prompt = (
            "You are an expert trade compliance and customs assistant for TradeOptimize AI.\n"
            "You help users with:\n"
            "- HS code classification questions\n"
            "- Tariff and duty calculations\n"
            "- Trade compliance requirements\n"
            "- Shipping and logistics optimization\n"
            "- Import/export regulations\n\n"
            "Be concise and practical. Provide specific HS codes, tariff rates, and "
            "document requirements when relevant.\n"
            "Format responses clearly with bullet points when listing items."
        )

        messages = [{"role": "system", "content": system_prompt}]

        if context:
            messages.extend(context)

        messages.append({"role": "user", "content": message})

        if self.groq_api_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.groq_url,
                        headers={
                            "Authorization": f"Bearer {self.groq_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "llama-3.1-70b-versatile",
                            "messages": messages,
                            "temperature": 0.7,
                            "max_tokens": 1000,
                        },
                        timeout=30.0,
                    )
                    response.raise_for_status()
                    data = response.json()
                    return {
                        "response": data["choices"][0]["message"]["content"],
                        "suggestions": self._generate_suggestions(message),
                    }
            except Exception:
                pass

        # Fallback response
        return {
            "response": (
                f"I understand you're asking about: {message}\n\n"
                "For detailed assistance, please provide more context about your specific "
                "product or trade scenario."
            ),
            "suggestions": ["CLASSIFY_PRODUCT", "CALCULATE_COST", "CHECK_COMPLIANCE"],
        }

    def _generate_suggestions(self, message: str) -> list[str]:
        """Generate contextual suggestions"""
        message_lower = message.lower()

        if "classify" in message_lower or "hs code" in message_lower:
            return ["VIEW_CLASSIFICATION", "CALCULATE_DUTY", "CHECK_RULINGS"]
        if "cost" in message_lower or "duty" in message_lower:
            return ["COMPARE_ROUTES", "VIEW_BREAKDOWN", "EXPORT_REPORT"]
        if "document" in message_lower or "compliance" in message_lower:
            return ["VIEW_REQUIREMENTS", "CHECK_OFAC", "GENERATE_CHECKLIST"]
        return ["NEW_CLASSIFICATION", "LANDED_COST", "COMPLIANCE_CHECK"]


assistant_service = AssistantService()
