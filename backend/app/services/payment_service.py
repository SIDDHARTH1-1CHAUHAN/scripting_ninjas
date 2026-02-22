from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import re
from typing import Any
from uuid import uuid4

import httpx

from ..core.config import get_settings
from .business_service import business_service


class PaymentServiceError(Exception):
    """Base error for payment operations."""


class PaymentValidationError(PaymentServiceError):
    """Raised when checkout payload is invalid."""


class PaymentGatewayError(PaymentServiceError):
    """Raised when gateway call fails."""


@dataclass(slots=True)
class CheckoutRequest:
    plan_tier: str
    billing_cycle: str
    customer_name: str
    customer_email: str


@dataclass(slots=True)
class VerifyRequest:
    plan_tier: str
    billing_cycle: str
    customer_email: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentService:
    """Razorpay test-mode checkout and verification service."""

    RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"
    _EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

    def __init__(self) -> None:
        self.settings = get_settings()
        self._subscriptions: dict[str, dict[str, Any]] = {}

    def _require_gateway_credentials(self) -> tuple[str, str]:
        key_id = self.settings.RAZORPAY_KEY_ID.strip()
        key_secret = self.settings.RAZORPAY_KEY_SECRET.strip()
        if not key_id or not key_secret:
            raise PaymentValidationError("Razorpay is not configured in backend env")
        return key_id, key_secret

    def _resolve_plan_amount(self, plan_tier: str, billing_cycle: str) -> tuple[int, str]:
        normalized_plan = plan_tier.strip().upper()
        normalized_cycle = billing_cycle.strip().lower()
        if normalized_cycle not in {"monthly", "yearly"}:
            raise PaymentValidationError("billing_cycle must be either monthly or yearly")

        pricing = business_service.get_business_model().get("pricing", [])
        for row in pricing:
            if str(row.get("tier", "")).strip().upper() != normalized_plan:
                continue
            if normalized_cycle == "yearly":
                amount_major = row.get("price_yearly_usd")
            else:
                amount_major = row.get("price_monthly_usd")

            if amount_major is None:
                raise PaymentValidationError(f"{normalized_plan} does not support {normalized_cycle} billing")
            try:
                amount_major_value = float(amount_major)
            except (TypeError, ValueError) as exc:
                raise PaymentValidationError("Invalid plan amount configured") from exc
            if amount_major_value <= 0:
                raise PaymentValidationError(f"{normalized_plan} is not payable")
            amount_minor = int(round(amount_major_value * 100))
            return amount_minor, normalized_plan

        raise PaymentValidationError(f"Unknown plan tier: {normalized_plan}")

    async def create_checkout_order(self, payload: CheckoutRequest) -> dict[str, Any]:
        key_id, key_secret = self._require_gateway_credentials()
        amount_minor, normalized_plan = self._resolve_plan_amount(payload.plan_tier, payload.billing_cycle)
        customer_name = payload.customer_name.strip()
        customer_email = payload.customer_email.strip().lower()
        if not customer_name:
            raise PaymentValidationError("customer_name is required")
        if not self._EMAIL_RE.match(customer_email):
            raise PaymentValidationError("customer_email must be a valid email")

        receipt = f"trd_{normalized_plan}_{uuid4().hex[:14]}"
        order_body = {
            "amount": amount_minor,
            "currency": self.settings.RAZORPAY_CURRENCY.strip() or "USD",
            "receipt": receipt,
            "payment_capture": 1,
            "notes": {
                "product": "TradeOptimize AI",
                "plan_tier": normalized_plan,
                "billing_cycle": payload.billing_cycle.strip().lower(),
                "customer_email": customer_email,
                "customer_name": customer_name,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=8.0)) as client:
                response = await client.post(
                    f"{self.RAZORPAY_BASE_URL}/orders",
                    json=order_body,
                    auth=(key_id, key_secret),
                )
            if response.status_code >= 400:
                detail = response.text
                try:
                    detail = response.json().get("error", {}).get("description", detail)
                except Exception:
                    pass
                raise PaymentGatewayError(f"Razorpay order creation failed: {detail}")
            order = response.json()
        except httpx.RequestError as exc:
            raise PaymentGatewayError(f"Unable to reach Razorpay: {exc}") from exc

        return {
            "key_id": key_id,
            "order_id": order.get("id"),
            "amount": int(order.get("amount", amount_minor)),
            "currency": str(order.get("currency", self.settings.RAZORPAY_CURRENCY)),
            "plan_tier": normalized_plan,
            "billing_cycle": payload.billing_cycle.strip().lower(),
            "customer": {
                "name": customer_name,
                "email": customer_email,
            },
            "gateway": "razorpay_test_mode",
        }

    def _signature_for_order(self, order_id: str, payment_id: str) -> str:
        key_secret = self.settings.RAZORPAY_KEY_SECRET.strip()
        if not key_secret:
            raise PaymentValidationError("Razorpay secret is not configured")
        digest = hmac.new(
            key_secret.encode("utf-8"),
            f"{order_id}|{payment_id}".encode("utf-8"),
            hashlib.sha256,
        )
        return digest.hexdigest()

    def verify_checkout_payment(self, payload: VerifyRequest) -> dict[str, Any]:
        _ = self._require_gateway_credentials()
        _amount_minor, normalized_plan = self._resolve_plan_amount(payload.plan_tier, payload.billing_cycle)

        customer_email = payload.customer_email.strip().lower()
        if not self._EMAIL_RE.match(customer_email):
            raise PaymentValidationError("customer_email must be a valid email")

        expected_signature = self._signature_for_order(
            order_id=payload.razorpay_order_id.strip(),
            payment_id=payload.razorpay_payment_id.strip(),
        )
        if not hmac.compare_digest(expected_signature, payload.razorpay_signature.strip()):
            raise PaymentValidationError("Invalid Razorpay payment signature")

        now = datetime.now(UTC)
        cycle = payload.billing_cycle.strip().lower()
        if cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)

        subscription = {
            "customer_email": customer_email,
            "plan_tier": normalized_plan,
            "billing_cycle": cycle,
            "status": "active",
            "activated_at": now.isoformat(),
            "current_period_end": period_end.isoformat(),
            "payment_id": payload.razorpay_payment_id.strip(),
            "order_id": payload.razorpay_order_id.strip(),
        }
        self._subscriptions[customer_email] = subscription

        return {
            "success": True,
            "message": "Payment verified and subscription activated",
            "subscription": subscription,
        }

    def get_subscription(self, email: str) -> dict[str, Any]:
        normalized = email.strip().lower()
        if not self._EMAIL_RE.match(normalized):
            raise PaymentValidationError("Valid email query parameter is required")
        sub = self._subscriptions.get(normalized)
        if sub is None:
            return {
                "customer_email": normalized,
                "status": "none",
                "plan_tier": "FREE",
                "billing_cycle": "monthly",
            }
        return sub

    def verify_webhook_signature(self, raw_body: bytes, signature: str) -> bool:
        webhook_secret = self.settings.RAZORPAY_WEBHOOK_SECRET.strip()
        if not webhook_secret:
            return False
        digest = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature.strip())

    def handle_webhook_event(self, payload: dict[str, Any]) -> dict[str, Any]:
        event = str(payload.get("event", "")).strip()
        payment_entity = (
            payload.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )
        notes = payment_entity.get("notes", {}) if isinstance(payment_entity, dict) else {}
        customer_email = str(notes.get("customer_email", "")).strip().lower()
        plan_tier = str(notes.get("plan_tier", "FREE")).strip().upper() or "FREE"
        billing_cycle = str(notes.get("billing_cycle", "monthly")).strip().lower() or "monthly"

        if event == "payment.captured" and customer_email and self._EMAIL_RE.match(customer_email):
            now = datetime.now(UTC)
            period_end = now + (timedelta(days=365) if billing_cycle == "yearly" else timedelta(days=30))
            self._subscriptions[customer_email] = {
                "customer_email": customer_email,
                "plan_tier": plan_tier,
                "billing_cycle": billing_cycle,
                "status": "active",
                "activated_at": now.isoformat(),
                "current_period_end": period_end.isoformat(),
                "payment_id": str(payment_entity.get("id", "")),
                "order_id": str(payment_entity.get("order_id", "")),
                "source": "webhook",
            }

        return {
            "received": True,
            "event": event,
            "processed_at": datetime.now(UTC).isoformat(),
        }


payment_service = PaymentService()
