import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...services.forex_service import (
    ForecastRequest,
    ForexProviderError,
    ForexRateLimitError,
    ForexValidationError,
    forex_service,
)

router = APIRouter(prefix="/forex", tags=["Forex Forecast"])
logger = logging.getLogger(__name__)


class ForexForecastRequest(BaseModel):
    from_currency: str = Field(..., min_length=3, max_length=3)
    to_currency: str = Field(..., min_length=3, max_length=3)
    forecast_days: int = Field(..., ge=1, le=90)


@router.post("/forecast")
async def generate_forex_forecast(payload: ForexForecastRequest):
    """Generate currency forecast and payment/receivable recommendation."""
    try:
        return await forex_service.forecast(
            ForecastRequest(
                from_currency=payload.from_currency,
                to_currency=payload.to_currency,
                forecast_days=payload.forecast_days,
            )
        )
    except ForexValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForexRateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except ForexProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.exception("Unexpected forex forecast error")
        raise HTTPException(status_code=500, detail="Unexpected forecasting error") from exc
