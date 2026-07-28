"""
BlackWayConnect - Response Cache Middleware
Cache en mémoire pour les réponses fréquentes (catalog, tiers, etc.).
Réduit la latence à < 5ms pour les données statiques.
"""

import time
import hashlib
from collections import OrderedDict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
import json


class CacheMiddleware(BaseHTTPMiddleware):
    """
    Cache middleware pour réponses ultra-rapides.
    Cache les GET requests sur les endpoints configurés.
    TTL configurable par route.

    Production: utiliser Redis/Memcached.
    """

    CACHEABLE_ROUTES = {
        "/api/v1/flex/tiers": 3600,
        "/api/v1/rewards/catalog": 1800,
        "/api/v1/health": 30,
    }

    def __init__(self, app, max_size: int = 1000):
        super().__init__(app)
        self._cache: OrderedDict = OrderedDict()
        self._max_size = max_size

    def _get_cache_key(self, request: Request) -> str:
        key = f"{request.method}:{request.url.path}:{request.url.query}"
        return hashlib.md5(key.encode()).hexdigest()

    def _is_cacheable(self, request: Request) -> tuple:
        if request.method != "GET":
            return False, 0
        path = request.url.path
        for route, ttl in self.CACHEABLE_ROUTES.items():
            if path == route or path.startswith(route):
                return True, ttl
        return False, 0

    def _get_cached(self, key: str):
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["time"] < entry["ttl"]:
                return entry
            else:
                del self._cache[key]
        return None

    def _set_cached(self, key: str, body: bytes, status_code: int, ttl: int):
        if len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = {
            "body": body,
            "status_code": status_code,
            "ttl": ttl,
            "time": time.time(),
        }

    async def dispatch(self, request: Request, call_next):
        cacheable, ttl = self._is_cacheable(request)

        if not cacheable:
            return await call_next(request)

        cache_key = self._get_cache_key(request)
        cached = self._get_cached(cache_key)

        if cached:
            return Response(
                content=cached["body"],
                status_code=cached["status_code"],
                media_type="application/json",
                headers={"X-Cache": "HIT", "X-Cache-TTL": str(ttl)},
            )

        response = await call_next(request)

        if response.status_code == 200:
            body = b""
            async for chunk in response.body_iterator:
                body += chunk if isinstance(chunk, bytes) else chunk.encode()

            self._set_cached(cache_key, body, response.status_code, ttl)

            return Response(
                content=body,
                status_code=response.status_code,
                media_type="application/json",
                headers={**dict(response.headers), "X-Cache": "MISS"},
            )

        return response
