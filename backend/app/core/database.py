from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis

from .config import get_settings

settings = get_settings()

# PostgreSQL
engine = create_async_engine(settings.POSTGRES_URL, echo=settings.DEBUG)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# MongoDB
mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
mongo_db = mongo_client.tradeoptimize


def get_mongo():
    return mongo_db


# Redis
redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis():
    return redis_client
