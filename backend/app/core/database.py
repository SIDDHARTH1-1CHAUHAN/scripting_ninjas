from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:  # pragma: no cover - optional dependency
    AsyncIOMotorClient = None

try:
    from redis.asyncio import Redis
except Exception:  # pragma: no cover - optional dependency
    Redis = None

try:
    import asyncpg  # noqa: F401
    _HAS_ASYNCPG = True
except Exception:  # pragma: no cover - optional dependency
    _HAS_ASYNCPG = False

from .config import get_settings

settings = get_settings()

# PostgreSQL
if _HAS_ASYNCPG:
    engine = create_async_engine(settings.POSTGRES_URL, echo=settings.DEBUG)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
else:
    engine = None
    AsyncSessionLocal = None

Base = declarative_base()


async def get_db():
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        yield session


# MongoDB
if AsyncIOMotorClient is not None:
    mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    mongo_db = mongo_client.tradeoptimize
else:
    mongo_client = None
    mongo_db = None


def get_mongo():
    return mongo_db


# Redis
if Redis is not None:
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
else:
    redis_client = None


async def get_redis():
    return redis_client
