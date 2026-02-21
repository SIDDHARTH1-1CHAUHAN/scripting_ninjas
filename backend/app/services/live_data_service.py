from datetime import datetime


class LiveDataService:
    """Stub service for live data integrations."""

    async def get_exchange_rates(self, base: str = "USD") -> dict:
        return {
            "base": base,
            "rates": {base: 1.0},
            "timestamp": datetime.utcnow().isoformat(),
            "source": "stub",
        }


live_data_service = LiveDataService()
