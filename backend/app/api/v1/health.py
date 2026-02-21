from fastapi import APIRouter

from ...core.database import get_mongo, get_redis

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "main-backend"}


@router.get("/health/detailed")
async def detailed_health():
    checks = {
        "postgres": await check_postgres(),
        "mongodb": await check_mongo(),
        "redis": await check_redis(),
    }
    all_healthy = all(checks.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
    }


async def check_postgres():
    try:
        # Placeholder: In later phases, run a lightweight query
        return True
    except Exception:
        return False


async def check_mongo():
    try:
        db = get_mongo()
        await db.command("ping")
        return True
    except Exception:
        return False


async def check_redis():
    try:
        redis = await get_redis()
        await redis.ping()
        return True
    except Exception:
        return False
