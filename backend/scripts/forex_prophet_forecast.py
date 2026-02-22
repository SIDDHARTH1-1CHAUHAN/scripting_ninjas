"""
Standalone FX forecast script using Alpha Vantage + Prophet.

What it does:
1. Fetches daily FX data from Alpha Vantage.
2. Forecasts next N days using Prophet.
3. Plots historical + forecast in one single matplotlib chart.
4. Marks the minimum predicted rate in the forecast horizon.
5. Prints min predicted rate and date.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import matplotlib.pyplot as plt
import pandas as pd
import requests
from prophet import Prophet


# =============================
# USER INPUT (edit these)
# =============================
API_KEY = "YOUR_API_KEY"
FROM_CURRENCY = "USD"
TO_CURRENCY = "INR"
FORECAST_DAYS = 10


class ForecastScriptError(Exception):
    """Base exception for this script."""


class RateLimitError(ForecastScriptError):
    """Raised when API rate limit is hit."""


@dataclass(slots=True)
class ForecastResult:
    history: pd.DataFrame
    forecast: pd.DataFrame
    future_only: pd.DataFrame
    min_row: pd.Series


def fetch_daily_fx_data(
    from_currency: str,
    to_currency: str,
    api_key: str,
    *,
    retries: int = 3,
    timeout_seconds: int = 20,
) -> pd.DataFrame:
    """
    Fetch and normalize Alpha Vantage FX_DAILY data.

    Returns a DataFrame with Prophet-required columns: ds, y.
    """
    if not api_key or api_key == "YOUR_API_KEY":
        raise ForecastScriptError("Please set a valid Alpha Vantage API key in API_KEY.")

    endpoint = "https://www.alphavantage.co/query"
    params = {
        "function": "FX_DAILY",
        "from_symbol": from_currency.upper(),
        "to_symbol": to_currency.upper(),
        "outputsize": "full",
        "apikey": api_key,
    }

    with requests.Session() as session:
        for attempt in range(retries):
            try:
                response = session.get(endpoint, params=params, timeout=timeout_seconds)
                response.raise_for_status()
                payload = response.json()
            except requests.RequestException as exc:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise ForecastScriptError(f"Network/API request failed: {exc}") from exc

            if "Error Message" in payload:
                raise ForecastScriptError(f"Alpha Vantage error: {payload['Error Message']}")

            note = payload.get("Note") or payload.get("Information")
            if note:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise RateLimitError(f"Alpha Vantage rate limit reached: {note}")

            series = payload.get("Time Series FX (Daily)")
            if not isinstance(series, dict) or not series:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise ForecastScriptError("Unexpected API payload: missing daily time series.")

            # Convert API payload into a clean Prophet dataframe.
            frame = pd.DataFrame(series).T.reset_index()
            frame.columns = ["ds", "open", "high", "low", "close"]
            frame["ds"] = pd.to_datetime(frame["ds"], errors="coerce")
            frame["y"] = pd.to_numeric(frame["close"], errors="coerce")
            frame = frame[["ds", "y"]].dropna().drop_duplicates(subset=["ds"]).sort_values("ds")

            if frame.empty:
                raise ForecastScriptError("No valid rows found in API response.")
            if len(frame) < 30:
                raise ForecastScriptError(
                    f"Insufficient history for forecasting ({len(frame)} rows)."
                )

            return frame

    raise ForecastScriptError("Failed to fetch FX data after retries.")


def run_prophet_forecast(df: pd.DataFrame, forecast_days: int) -> ForecastResult:
    """Train Prophet model and return full forecast outputs."""
    if forecast_days <= 0:
        raise ForecastScriptError("FORECAST_DAYS must be greater than 0.")

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=True,
    )
    model.fit(df[["ds", "y"]])

    future = model.make_future_dataframe(periods=forecast_days, freq="D")
    forecast = model.predict(future)

    last_history_date = df["ds"].max()
    future_only = forecast[forecast["ds"] > last_history_date].head(forecast_days)
    if future_only.empty:
        raise ForecastScriptError("Model did not generate future predictions.")

    min_row = future_only.loc[future_only["yhat"].idxmin()]

    return ForecastResult(
        history=df.copy(),
        forecast=forecast.copy(),
        future_only=future_only.copy(),
        min_row=min_row,
    )


def plot_forecast(result: ForecastResult, from_currency: str, to_currency: str) -> None:
    """
    Plot one single chart:
    - historical close values
    - Prophet yhat forecast
    - minimum predicted point in future horizon
    """
    plt.figure(figsize=(12, 6))
    plt.plot(result.history["ds"], result.history["y"], label="Historical")
    plt.plot(result.forecast["ds"], result.forecast["yhat"], label="Forecast")

    # Mark the minimum predicted rate in the selected forecast window.
    min_date = result.min_row["ds"]
    min_rate = result.min_row["yhat"]
    plt.scatter(min_date, min_rate, label="Minimum Predicted Rate")
    plt.annotate(
        f"{min_rate:.4f}\n{min_date.date()}",
        xy=(min_date, min_rate),
        xytext=(10, 12),
        textcoords="offset points",
    )

    plt.title(f"{from_currency.upper()}/{to_currency.upper()} Forecast")
    plt.xlabel("Date")
    plt.ylabel("Exchange Rate")
    plt.legend()
    plt.tight_layout()
    plt.show()


def main() -> None:
    """Orchestrate fetch -> forecast -> print -> plot."""
    history = fetch_daily_fx_data(
        from_currency=FROM_CURRENCY,
        to_currency=TO_CURRENCY,
        api_key=API_KEY,
    )
    result = run_prophet_forecast(history, FORECAST_DAYS)

    min_date = result.min_row["ds"].date()
    min_value = float(result.min_row["yhat"])
    print(f"Minimum predicted rate: {min_value:.4f}")
    print(f"Date of minimum predicted rate: {min_date}")

    plot_forecast(result, FROM_CURRENCY, TO_CURRENCY)


if __name__ == "__main__":
    try:
        main()
    except RateLimitError as exc:
        print(f"[RateLimitError] {exc}")
    except ForecastScriptError as exc:
        print(f"[ForecastScriptError] {exc}")
    except Exception as exc:  # pragma: no cover - defensive fallback
        print(f"[UnexpectedError] {exc}")
