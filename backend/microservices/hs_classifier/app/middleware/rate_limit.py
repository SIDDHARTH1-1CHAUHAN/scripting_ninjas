import os

import redis.asyncio as redis
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limit to match Groq free tier (30 req/min)"""

    def __init__(self, app, requests_per_minute: int = 30):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"

        try:
            redis_client = redis.from_url(self.redis_url)
            current = await redis_client.get(key)

            if current and int(current) >= self.requests_per_minute:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Max 30 requests per minute."
                )

            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)
            await pipe.execute()
            await redis_client.close()
        except HTTPException:
            raise
        except Exception:
            # If Redis fails, allow request but do not block traffic
            pass

        return await call_next(request)
