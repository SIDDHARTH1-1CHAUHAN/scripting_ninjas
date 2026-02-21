import hashlib
import json
import os

import redis.asyncio as redis


class CacheService:
    """Redis-based caching for classification results"""

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = None
        self.ttl = 60 * 60 * 24  # 24 hours

    async def get_client(self):
        if not self.client:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
        return self.client

    def _get_key(self, description: str) -> str:
        hash_val = hashlib.md5(description.lower().strip().encode()).hexdigest()
        return f"hs_cache:{hash_val}"

    async def get(self, description: str) -> dict | None:
        try:
            client = await self.get_client()
            key = self._get_key(description)
            cached = await client.get(key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    async def set(self, description: str, result: dict):
        try:
            client = await self.get_client()
            key = self._get_key(description)
            await client.setex(key, self.ttl, json.dumps(result))
        except Exception:
            pass


cache_service = CacheService()
