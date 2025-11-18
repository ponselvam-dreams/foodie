import typing
import redis.asyncio as aioredis
from app.core.config import settings

# Prefer a URL in settings (e.g. REDIS_URL=redis://:pass@host:6379/0)
if getattr(settings, "REDIS_URL", None):
    redis_client: aioredis.Redis = aioredis.from_url(
        settings.REDIS_URL, encoding="utf-8", decode_responses=True
    )
else:
    redis_client: aioredis.Redis = aioredis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        encoding="utf-8",
        decode_responses=True,
    )