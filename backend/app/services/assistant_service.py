import os
from typing import Optional

import httpx

from ..prompts import AI_ASSISTANT_FEW_SHOT_MESSAGES, AI_ASSISTANT_SYSTEM_PROMPT


class AssistantService:
    """AI Trade Assistant using Groq API with deterministic domain fallback."""

    def __init__(self) -> None:
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.groq_model = os.getenv(
            "GROQ_MODEL_ASSISTANT",
            os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        )

    async def chat(
        self,
        message: str,
        context: Optional[list[dict]] = None,
        user_profile: Optional[dict] = None,
    ) -> dict:
        """Send message to AI assistant."""
        intent = self._detect_intent(message)
        messages = [{"role": "system", "content": AI_ASSISTANT_SYSTEM_PROMPT}]
        messages.extend(AI_ASSISTANT_FEW_SHOT_MESSAGES)

        profile_context = self._build_profile_context(user_profile)
        profile_rules = self._build_personalization_rules(user_profile, intent)
        profile_summary = self._build_profile_summary(user_profile)
        if profile_context:
            messages.append({"role": "system", "content": profile_context})
        if profile_rules:
            messages.append({"role": "system", "content": profile_rules})

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
                            "model": self.groq_model,
                            "messages": messages,
                            "temperature": 0.2,
                            "max_tokens": 900,
                        },
                        timeout=35.0,
                    )
                    response.raise_for_status()
                    data = response.json()
                    llm_text = data["choices"][0]["message"]["content"]
                    normalized = self._ensure_actionable_format(
                        llm_text,
                        message=message,
                        intent=intent,
                        user_profile=user_profile,
                    )
                    return {
                        "response": normalized,
                        "suggestions": self._generate_suggestions(message),
                        "agent_actions": self._generate_agent_actions(message),
                        "profile_applied": bool(profile_context or profile_rules),
                        "profile_summary": profile_summary,
                        "provider": "groq",
                        "model": self.groq_model,
                        "live": True,
                    }
            except Exception:
                pass

        fallback = self._build_fallback_response(
            message=message,
            intent=intent,
            user_profile=user_profile,
        )
        return {
            "response": fallback,
            "suggestions": self._generate_suggestions(message),
            "agent_actions": self._generate_agent_actions(message),
            "profile_applied": bool(profile_context or profile_rules),
            "profile_summary": profile_summary,
            "provider": "local-fallback",
            "model": "trade-rules-v2",
            "live": False,
        }

    def _detect_intent(self, message: str) -> str:
        value = (message or "").lower()
        if any(token in value for token in ["hs", "classify", "classification", "tariff heading"]):
            return "classification"
        if any(token in value for token in ["duty", "tariff", "landed cost", "cost", "mpf", "hmf"]):
            return "cost"
        if any(token in value for token in ["compliance", "ofac", "entity list", "documents", "sanction"]):
            return "compliance"
        if any(token in value for token in ["route", "shipping mode", "ocean", "air freight", "transit"]):
            return "route"
        if any(token in value for token in ["workflow", "plan", "step by step", "playbook"]):
            return "workflow"
        return "general"

    def _build_personalization_rules(self, user_profile: Optional[dict], intent: str) -> Optional[str]:
        if not user_profile:
            return None

        priorities = self._normalize_tokens(user_profile.get("priorities"))
        lanes = self._normalize_tokens(user_profile.get("preferred_lanes"))
        rules: list[str] = []

        if priorities:
            for priority in priorities:
                p = priority.lower()
                if "compliance" in p:
                    rules.append("Prioritize regulatory risk reduction and documentary completeness.")
                elif "cost" in p:
                    rules.append("Prioritize landed-cost optimization and tariff visibility.")
                elif "speed" in p or "time" in p:
                    rules.append("Prioritize transit-time predictability and faster alternatives.")
                elif "reliability" in p:
                    rules.append("Prioritize schedule reliability and disruption resilience.")

        if lanes and intent in {"route", "cost", "compliance", "workflow"}:
            rules.append(f"Reference these active lanes where relevant: {', '.join(lanes)}.")

        role = str(user_profile.get("role", "")).strip()
        if role:
            rules.append(f"Use recommendations practical for role: {role}.")

        if not rules:
            return None
        return "Personalization instructions:\n- " + "\n- ".join(rules)

    def _generate_suggestions(self, message: str) -> list[str]:
        intent = self._detect_intent(message)
        if intent == "classification":
            return ["Validate 10-digit HTS", "Estimate Landed Cost", "Check Compliance Risks"]
        if intent == "cost":
            return ["Compare Freight Modes", "Breakdown Duty Components", "Run Compliance Check"]
        if intent == "compliance":
            return ["Generate Document Checklist", "Run Party Screening", "Review Section 301 Exposure"]
        if intent == "route":
            return ["Open Route Optimizer", "Compare Ocean vs Air", "Track Live Shipment"]
        if intent == "workflow":
            return ["Create 7-Day Import Plan", "Run First Shipment Checklist", "Set Risk Controls"]
        return ["Classify Product", "Calculate Landed Cost", "Check Compliance"]

    def _generate_agent_actions(self, message: str) -> list[dict]:
        intent = self._detect_intent(message)
        if intent == "classification":
            return [
                {"title": "Run HS Classification", "route": "/classify"},
                {"title": "Estimate Landed Cost", "route": "/landed-cost"},
                {"title": "Check Compliance", "route": "/compliance"},
            ]
        if intent == "cost":
            return [
                {"title": "Open Landed Cost Calculator", "route": "/landed-cost"},
                {"title": "Compare Shipping Routes", "route": "/route"},
                {"title": "View Savings Analytics", "route": "/analytics"},
            ]
        if intent == "compliance":
            return [
                {"title": "Open Compliance Checker", "route": "/compliance"},
                {"title": "Track Shipment Risk", "route": "/cargo"},
                {"title": "Review Documents", "route": "/compliance"},
            ]
        if intent == "route":
            return [
                {"title": "Open Route Optimizer", "route": "/route"},
                {"title": "Track Cargo", "route": "/cargo"},
                {"title": "Estimate Total Cost", "route": "/landed-cost"},
            ]
        return [
            {"title": "Start with Classification", "route": "/classify"},
            {"title": "Review Compliance", "route": "/compliance"},
            {"title": "Plan Shipment Route", "route": "/route"},
        ]

    def _build_profile_context(self, user_profile: Optional[dict]) -> Optional[str]:
        if not user_profile:
            return None

        lines = []
        if user_profile.get("name"):
            lines.append(f"- User name: {user_profile['name']}")
        if user_profile.get("company"):
            lines.append(f"- Company: {user_profile['company']}")
        if user_profile.get("role"):
            lines.append(f"- Role: {user_profile['role']}")
        if user_profile.get("preferred_lanes"):
            lanes = ", ".join(self._normalize_tokens(user_profile["preferred_lanes"]))
            if lanes:
                lines.append(f"- Trade lanes: {lanes}")
        if user_profile.get("priorities"):
            priorities = ", ".join(self._normalize_tokens(user_profile["priorities"]))
            if priorities:
                lines.append(f"- Priorities: {priorities}")

        if not lines:
            return None

        return (
            "Personalization context (apply only if relevant to user question):\n"
            + "\n".join(lines)
        )

    def _build_profile_summary(self, user_profile: Optional[dict]) -> Optional[str]:
        if not user_profile:
            return None

        parts = []
        if user_profile.get("company"):
            parts.append(f"Company: {user_profile['company']}")
        if user_profile.get("role"):
            parts.append(f"Role: {user_profile['role']}")
        if user_profile.get("preferred_lanes"):
            lanes = ", ".join(self._normalize_tokens(user_profile["preferred_lanes"]))
            if lanes:
                parts.append(f"Lanes: {lanes}")
        if user_profile.get("priorities"):
            priorities = ", ".join(self._normalize_tokens(user_profile["priorities"]))
            if priorities:
                parts.append(f"Priorities: {priorities}")
        if user_profile.get("name"):
            parts.append(f"User: {user_profile['name']}")

        return " | ".join(parts) if parts else None

    def _ensure_actionable_format(
        self,
        llm_text: str,
        message: str,
        intent: str,
        user_profile: Optional[dict],
    ) -> str:
        text = (llm_text or "").strip()
        if not text:
            return self._build_fallback_response(message=message, intent=intent, user_profile=user_profile)

        lowered = text.lower()
        if "compliance pitfall" not in lowered:
            text += "\n- Compliance pitfall: Missing 10-digit HS or origin details can invalidate downstream duty/compliance assumptions."

        if "next action" not in lowered and "next steps" not in lowered:
            actions = self._default_next_actions(intent)
            text += "\n- Next actions:\n  1. " + actions[0] + "\n  2. " + actions[1]

        return text

    def _build_fallback_response(self, message: str, intent: str, user_profile: Optional[dict]) -> str:
        profile_lane = self._primary_lane(user_profile)
        china_flag = "china" in (message or "").lower() or ("cn" in profile_lane.lower() if profile_lane else False)

        if intent == "classification":
            message_lower = (message or "").lower()
            if "headphone" in message_lower:
                code, confidence = "8518.30.xx", 86
                reason = "Primary function is audio output via headphones."
            elif any(token in message_lower for token in ["charger", "power bank", "portable charger"]):
                code, confidence = "8504.40.xx", 82
                reason = "Essential character is power conversion/charging."
            elif "battery" in message_lower:
                code, confidence = "8507.60.xx", 74
                reason = "Primary function relates to lithium accumulator storage."
            else:
                code, confidence = "8479.89.xx", 42
                reason = "Insufficient technical details for a reliable narrow heading."

            duty_note = "Duty/tariff impact: Final rate requires full 10-digit HTS + origin."
            if china_flag:
                duty_note += " China origin may trigger Section 301 depending on final tariff line."

            return (
                f"- Likely classification: {code}\n"
                f"- Confidence: {confidence}/100\n"
                f"- Duty/tariff impact: {duty_note.split(': ', 1)[1]}\n"
                "- Required docs: Commercial invoice, packing list, transport document.\n"
                "- Recommended docs: Product spec sheet and component/material breakdown.\n"
                f"- Compliance pitfall: {reason}\n"
                "- Missing inputs: Product technical specs, composition, and intended use details.\n"
                "- Next actions:\n"
                "  1. Confirm technical specs and intended use for 10-digit HTS accuracy.\n"
                "  2. Run landed-cost and compliance checks with confirmed origin."
            )

        if intent == "cost":
            duty_note = "Need full 10-digit HTS + origin to calculate exact duty."
            if china_flag:
                duty_note += " Also evaluate Section 301 exposure."
            return (
                "- Likely classification: Confirm first before final duty estimate.\n"
                "- Confidence: 55/100\n"
                f"- Duty/tariff impact: {duty_note}\n"
                "- Required docs: Commercial invoice, packing list, bill of lading/air waybill.\n"
                "- Recommended docs: Freight quote, insurance quote, broker fee assumptions.\n"
                "- Compliance pitfall: Estimating duties with only 6-digit HS often misstates landed cost.\n"
                "- Missing inputs: 10-digit HTS, Incoterm, freight mode, shipment value and quantity.\n"
                "- Next actions:\n"
                "  1. Confirm 10-digit HTS and country of origin.\n"
                "  2. Run landed-cost calculator with full shipment assumptions."
            )

        if intent == "compliance":
            lane_note = f" for lane {profile_lane}" if profile_lane else ""
            return (
                "- Compliance focus: Restricted-party screening, tariff applicability, and document readiness.\n"
                "- Confidence: 78/100\n"
                "- Duty/tariff impact: Validate 10-digit HTS and origin before final declaration.\n"
                "- Required docs: Commercial invoice, packing list, transport document, origin support.\n"
                "- Recommended docs: Product spec + supplier due-diligence record.\n"
                f"- Compliance pitfall: Incomplete documentary trail can delay customs clearance{lane_note}.\n"
                "- Missing inputs: Supplier legal name, end-use details, final HTS line and origin evidence.\n"
                "- Next actions:\n"
                "  1. Run denied-party screening on supplier and consignee.\n"
                "  2. Build required-vs-recommended doc checklist before booking."
            )

        if intent == "route":
            lane_note = f" ({profile_lane})" if profile_lane else ""
            return (
                f"- Route strategy{lane_note}: compare ocean, air, and multimodal options by cost/time/reliability.\n"
                "- Confidence: 70/100\n"
                "- Duty/tariff impact: Route choice changes freight and timing, not base duty itself.\n"
                "- Required docs: Transport document aligned to chosen mode and consignee data.\n"
                "- Recommended docs: Contingency routing plan and carrier reliability notes.\n"
                "- Compliance pitfall: Choosing fastest mode without document readiness can still cause border delays.\n"
                "- Missing inputs: Target delivery date, cargo type/weight, budget and service constraints.\n"
                "- Next actions:\n"
                "  1. Compare at least 3 route options in Route Optimizer.\n"
                "  2. Select route based on total landed cost and schedule risk."
            )

        return (
            "- Likely classification: Needs product specifics for reliable output.\n"
            "- Confidence: 50/100\n"
            "- Duty/tariff impact: Final duty requires confirmed 10-digit HTS + origin.\n"
            "- Required docs: Commercial invoice, packing list, transport document.\n"
            "- Recommended docs: Product specs and supplier compliance records.\n"
            "- Compliance pitfall: Decisions made before HS and origin validation create avoidable customs risk.\n"
            "- Missing inputs: Product details, origin, shipment value/quantity, and lane.\n"
            "- Next actions:\n"
            "  1. Share product + origin + value + lane for a precise recommendation.\n"
            "  2. Run classification, landed cost, and compliance modules in sequence."
        )

    def _normalize_tokens(self, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        output: list[str] = []
        seen = set()
        for item in value:
            token = str(item).strip()
            if not token:
                continue
            key = token.lower()
            if key in seen:
                continue
            seen.add(key)
            output.append(token)
        return output

    def _primary_lane(self, user_profile: Optional[dict]) -> Optional[str]:
        if not user_profile:
            return None
        lanes = self._normalize_tokens(user_profile.get("preferred_lanes"))
        return lanes[0] if lanes else None

    def _default_next_actions(self, intent: str) -> tuple[str, str]:
        if intent == "classification":
            return (
                "Confirm product function/material and lock 10-digit HTS.",
                "Run landed-cost + compliance checks using confirmed classification.",
            )
        if intent == "cost":
            return (
                "Validate HTS and origin for accurate duty inputs.",
                "Compare landed cost under alternative route/mode scenarios.",
            )
        if intent == "compliance":
            return (
                "Run denied-party screening and verify end-use/end-user.",
                "Prepare required documents and cross-check destination restrictions.",
            )
        if intent == "route":
            return (
                "Compare at least three route/mode options for the shipment.",
                "Choose based on total cost, transit, and reliability risk.",
            )
        return (
            "Provide product, origin, value, and shipment lane.",
            "Follow classify -> cost -> compliance -> route workflow.",
        )


assistant_service = AssistantService()
