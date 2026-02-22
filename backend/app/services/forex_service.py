from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx
import pandas as pd

from ..core.config import get_settings


class ForexServiceError(Exception):
    """Base exception for forex forecasting failures."""


class ForexRateLimitError(ForexServiceError):
    """Raised when Alpha Vantage rate limit is exceeded."""


class ForexValidationError(ForexServiceError):
    """Raised when user input is invalid."""


class ForexProviderError(ForexServiceError):
    """Raised when upstream data provider fails."""


@dataclass(slots=True)
class ForecastRequest:
    from_currency: str
    to_currency: str
    forecast_days: int


class ForexService:
    """Fetch FX rates from Alpha Vantage and forecast with Prophet."""

    ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"
    MAX_FORECAST_DAYS = 90
    MIN_FORECAST_DAYS = 1
    MIN_TRAINING_POINTS = 30

    def __init__(self) -> None:
        self.settings = get_settings()

    async def forecast(self, payload: ForecastRequest) -> dict:
        """Generate a forex forecast payload for frontend visualization."""
        from_currency = payload.from_currency.strip().upper()
        to_currency = payload.to_currency.strip().upper()
        api_key = self.settings.ALPHA_VANTAGE_API_KEY.strip()

        if not from_currency or len(from_currency) != 3:
            raise ForexValidationError("from_currency must be a valid 3-letter currency code")
        if not to_currency or len(to_currency) != 3:
            raise ForexValidationError("to_currency must be a valid 3-letter currency code")
        if payload.forecast_days < self.MIN_FORECAST_DAYS or payload.forecast_days > self.MAX_FORECAST_DAYS:
            raise ForexValidationError(
                f"forecast_days must be between {self.MIN_FORECAST_DAYS} and {self.MAX_FORECAST_DAYS}"
            )
        if not api_key:
            raise ForexValidationError("Backend ALPHA_VANTAGE_API_KEY is not configured")

        historical = await self._fetch_daily_fx_series(
            from_currency=from_currency,
            to_currency=to_currency,
            api_key=api_key,
        )

        if len(historical) < self.MIN_TRAINING_POINTS:
            raise ForexProviderError(
                f"Insufficient history returned by provider: {len(historical)} rows"
            )

        return await asyncio.to_thread(
            self._build_forecast_payload,
            historical,
            payload.forecast_days,
            from_currency,
            to_currency,
        )

    async def _fetch_daily_fx_series(
        self,
        from_currency: str,
        to_currency: str,
        api_key: str,
    ) -> pd.DataFrame:
        params = {
            "function": "FX_DAILY",
            "from_symbol": from_currency,
            "to_symbol": to_currency,
            "outputsize": "full",
            "apikey": api_key,
        }

        max_attempts = 3
        timeout = httpx.Timeout(20.0, connect=10.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(max_attempts):
                try:
                    response = await client.get(self.ALPHA_VANTAGE_URL, params=params)
                except httpx.RequestError as exc:
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    raise ForexProviderError(f"Unable to reach Alpha Vantage: {exc}") from exc

                if response.status_code >= 500 and attempt < max_attempts - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                if response.status_code != 200:
                    raise ForexProviderError(
                        f"Alpha Vantage returned HTTP {response.status_code}"
                    )

                payload = response.json()

                if "Error Message" in payload:
                    raise ForexValidationError(str(payload["Error Message"]))

                note = payload.get("Note") or payload.get("Information")
                if note:
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    raise ForexRateLimitError(str(note))

                series = payload.get("Time Series FX (Daily)")
                if not isinstance(series, dict) or not series:
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    raise ForexProviderError("Provider response missing Time Series FX (Daily)")

                rows: list[dict] = []
                for date_text, values in series.items():
                    if not isinstance(values, dict):
                        continue
                    close_raw = values.get("4. close")
                    if close_raw is None:
                        continue
                    try:
                        rows.append(
                            {
                                "ds": pd.to_datetime(date_text),
                                "y": float(close_raw),
                            }
                        )
                    except (TypeError, ValueError):
                        continue

                if not rows:
                    raise ForexProviderError("Provider returned no usable FX rows")

                frame = pd.DataFrame(rows).dropna().drop_duplicates(subset=["ds"]).sort_values("ds")
                return frame

        raise ForexProviderError("Failed to fetch FX data after retries")

    def _build_forecast_payload(
        self,
        historical: pd.DataFrame,
        forecast_days: int,
        from_currency: str,
        to_currency: str,
    ) -> dict:
        train = historical[["ds", "y"]].copy()
        last_history_date = train["ds"].max()
        model_used = "prophet"
        model_warning: str | None = None

        # Prophet import is deferred so the API can still boot if dependency is missing.
        try:
            from prophet import Prophet

            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True,
            )
            model.fit(train)
            future = model.make_future_dataframe(periods=forecast_days, freq="D")
            forecast = model.predict(future)
            future_forecast = forecast[forecast["ds"] > last_history_date].head(forecast_days)
        except Exception as exc:  # pragma: no cover - backend specific runtime issues
            model_used = "fallback_trend"
            model_warning = f"Prophet unavailable at runtime: {exc}"
            forecast, future_forecast = self._fallback_forecast(train, forecast_days)

        if future_forecast.empty:
            raise ForexProviderError("Forecast generation failed: no future rows were produced")

        min_row = future_forecast.loc[future_forecast["yhat"].idxmin()]
        max_row = future_forecast.loc[future_forecast["yhat"].idxmax()]

        history_window = train.tail(180).copy()
        forecast_window = forecast[forecast["ds"] >= history_window["ds"].min()].copy()

        historical_points = [
            {
                "date": row.ds.strftime("%Y-%m-%d"),
                "rate": round(float(row.y), 6),
            }
            for row in history_window.itertuples(index=False)
        ]

        forecast_points = [
            {
                "date": row.ds.strftime("%Y-%m-%d"),
                "predicted_rate": round(float(row.yhat), 6),
                "lower_bound": round(float(row.yhat_lower), 6),
                "upper_bound": round(float(row.yhat_upper), 6),
                "is_future": bool(row.ds > last_history_date),
            }
            for row in forecast_window.itertuples(index=False)
        ]

        future_points = [
            {
                "date": row.ds.strftime("%Y-%m-%d"),
                "predicted_rate": round(float(row.yhat), 6),
                "lower_bound": round(float(row.yhat_lower), 6),
                "upper_bound": round(float(row.yhat_upper), 6),
            }
            for row in future_forecast.itertuples(index=False)
        ]

        return {
            "from_currency": from_currency,
            "to_currency": to_currency,
            "forecast_days": forecast_days,
            "generated_at": datetime.now(UTC).isoformat(),
            "historical": historical_points,
            "forecast": forecast_points,
            "future_forecast": future_points,
            "minimum_predicted_rate": {
                "date": min_row["ds"].strftime("%Y-%m-%d"),
                "rate": round(float(min_row["yhat"]), 6),
            },
            "maximum_predicted_rate": {
                "date": max_row["ds"].strftime("%Y-%m-%d"),
                "rate": round(float(max_row["yhat"]), 6),
            },
            "recommendation": {
                "strategy": "pay_on_min_receive_on_max",
                "explanation": "Pay on the lowest predicted-rate day and receive bill on the highest predicted-rate day.",
                "payment_date": min_row["ds"].strftime("%Y-%m-%d"),
                "payment_rate": round(float(min_row["yhat"]), 6),
                "bill_receive_date": max_row["ds"].strftime("%Y-%m-%d"),
                "bill_receive_rate": round(float(max_row["yhat"]), 6),
            },
            "model_used": model_used,
            "model_warning": model_warning,
        }

    def _fallback_forecast(
        self,
        train: pd.DataFrame,
        forecast_days: int,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """
        Generate a conservative trend forecast when Prophet backend is unavailable.
        This keeps the feature operational instead of hard failing.
        """
        if train.empty:
            raise ForexProviderError("Cannot run fallback forecast without training data")

        last_date = train["ds"].max()
        last_value = float(train["y"].iloc[-1])
        trend_window = min(max(len(train) // 12, 7), 30)

        if len(train) > trend_window:
            earlier_value = float(train["y"].iloc[-(trend_window + 1)])
            slope = (last_value - earlier_value) / float(trend_window)
        else:
            slope = 0.0

        volatility = float(train["y"].tail(min(30, len(train))).std() or 0.0)
        spread = max(volatility * 0.35, last_value * 0.0025)

        future_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1),
            periods=forecast_days,
            freq="D",
        )

        future_rows = []
        for idx, date_value in enumerate(future_dates, start=1):
            predicted = max(0.0001, last_value + slope * idx)
            future_rows.append(
                {
                    "ds": date_value,
                    "yhat": predicted,
                    "yhat_lower": max(0.0001, predicted - spread),
                    "yhat_upper": predicted + spread,
                }
            )

        future_forecast = pd.DataFrame(future_rows)

        history_rows = train.rename(columns={"y": "yhat"}).copy()
        history_rows["yhat_lower"] = history_rows["yhat"]
        history_rows["yhat_upper"] = history_rows["yhat"]

        forecast = pd.concat(
            [
                history_rows[["ds", "yhat", "yhat_lower", "yhat_upper"]],
                future_forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]],
            ],
            ignore_index=True,
        )

        return forecast, future_forecast


forex_service = ForexService()
