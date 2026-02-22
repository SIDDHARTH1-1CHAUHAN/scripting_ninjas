from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from ...services.payment_service import (
    CheckoutRequest,
    PaymentGatewayError,
    PaymentValidationError,
    VerifyRequest,
    payment_service,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


class CreateCheckoutOrderRequest(BaseModel):
    plan_tier: str = Field(..., examples=["STARTER"])
    billing_cycle: str = Field(..., examples=["monthly"])
    customer_name: str = Field(..., min_length=2, max_length=120)
    customer_email: str


class VerifyPaymentRequest(BaseModel):
    plan_tier: str
    billing_cycle: str
    customer_email: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/checkout-order")
async def create_checkout_order(request: CreateCheckoutOrderRequest):
    try:
        return await payment_service.create_checkout_order(
            CheckoutRequest(
                plan_tier=request.plan_tier,
                billing_cycle=request.billing_cycle,
                customer_name=request.customer_name,
                customer_email=request.customer_email,
            )
        )
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except PaymentGatewayError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest):
    try:
        return payment_service.verify_checkout_payment(
            VerifyRequest(
                plan_tier=request.plan_tier,
                billing_cycle=request.billing_cycle,
                customer_email=request.customer_email,
                razorpay_order_id=request.razorpay_order_id,
                razorpay_payment_id=request.razorpay_payment_id,
                razorpay_signature=request.razorpay_signature,
            )
        )
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/subscription")
async def get_subscription(email: str):
    try:
        return payment_service.get_subscription(email)
    except PaymentValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None, alias="X-Razorpay-Signature"),
):
    raw_body = await request.body()
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
    if not payment_service.verify_webhook_signature(raw_body, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    return payment_service.handle_webhook_event(payload)
