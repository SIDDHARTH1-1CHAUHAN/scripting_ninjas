from functools import lru_cache

from pydantic_settings import BaseSettings


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

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
