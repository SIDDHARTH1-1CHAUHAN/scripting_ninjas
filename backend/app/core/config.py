from functools import lru_cache
import os

try:
    from pydantic_settings import BaseSettings
    _HAS_PYDANTIC_SETTINGS = True
except Exception:  # pragma: no cover - optional dependency
    _HAS_PYDANTIC_SETTINGS = False

    class BaseSettings:  # minimal fallback
        pass


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TradeOptimize AI"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    POSTGRES_URL: str = "postgresql+asyncpg://tradeopt:tradeopt123@localhost:5432/tradeoptimize"
    MONGO_URL: str = "mongodb://localhost:27017"
    REDIS_URL: str = "redis://localhost:6379"

    # AI (FREE)
    GROQ_API_KEY: str = ""
    OLLAMA_URL: str = "http://localhost:11434"

    # External APIs
    USITC_API_URL: str = "https://hts.usitc.gov/api"
    EXCHANGE_RATE_API_URL: str = "https://api.exchangerate-api.com/v4/latest/USD"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    if _HAS_PYDANTIC_SETTINGS:
        class Config:
            env_file = ".env"
    else:
        def __init__(self) -> None:
            for key, default in self.__class__.__dict__.items():
                if not key.isupper():
                    continue
                env_val = os.getenv(key)
                if env_val is None:
                    value = default
                else:
                    if isinstance(default, bool):
                        value = env_val.lower() in {"1", "true", "yes", "on"}
                    elif isinstance(default, int):
                        value = int(env_val)
                    elif isinstance(default, float):
                        value = float(env_val)
                    elif isinstance(default, list):
                        value = [item.strip() for item in env_val.split(",") if item.strip()]
                    else:
                        value = env_val
                setattr(self, key, value)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
