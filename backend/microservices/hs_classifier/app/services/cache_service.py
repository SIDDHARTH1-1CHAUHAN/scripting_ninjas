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

    def _get_key(self, value: str, namespace: str = "hs") -> str:
        hash_val = hashlib.md5(value.lower().strip().encode()).hexdigest()
        return f"{namespace}_cache:{hash_val}"

    def _classification_cache_value(self, description: str, context: str | None = None) -> str:
        base = description.strip()
        ctx = (context or "").strip()
        return f"{base}\n\ncontext:{ctx}"

    async def get(self, description: str, context: str | None = None) -> dict | None:
        return await self.get_by_value(
            self._classification_cache_value(description, context),
            namespace="hs",
        )

    async def set(self, description: str, result: dict, context: str | None = None):
        await self.set_by_value(
            self._classification_cache_value(description, context),
            result,
            namespace="hs",
        )

    async def get_by_value(self, value: str, namespace: str = "hs") -> dict | None:
        try:
            client = await self.get_client()
            key = self._get_key(value, namespace=namespace)
            cached = await client.get(key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    async def set_by_value(self, value: str, result: dict, namespace: str = "hs"):
        try:
            client = await self.get_client()
            key = self._get_key(value, namespace=namespace)
            await client.setex(key, self.ttl, json.dumps(result))
        except Exception:
            pass


cache_service = CacheService()
