"""
BlackWayConnect - Rate Limiter Middleware
Protection contre les abus tout en garantissant la fluidité UX.
Limites généreuses pour l'usage normal, strictes pour les bots.
"""

import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiter in-memory pour le BaaS BlackWayConnect.
    Production: utiliser Redis pour le state distribué.

    Limites par défaut:
    - Authentifié: 100 req/min
    - Non-authentifié: 30 req/min
    - WebSocket: pas de limite (flux continu)
    """

    def __init__(self, app, authenticated_limit: int = 100, anonymous_limit: int = 30):
        super().__init__(app)
        self.authenticated_limit = authenticated_limit
        self.anonymous_limit = anonymous_limit
        self._requests: dict = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        """Identifie le client (IP ou user_id du JWT)."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_rate_limited(self, client_id: str, limit: int) -> bool:
        """Vérifie si le client a dépassé sa limite."""
        now = time.time()
        window = 60  # 1 minute

        # Clean old requests
        self._requests[client_id] = [
            t for t in self._requests[client_id] if now - t < window
        ]

        if len(self._requests[client_id]) >= limit:
            return True

        self._requests[client_id].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        # Skip WebSocket upgrades
        if request.headers.get("upgrade") == "websocket":
            return await call_next(request)

        # Skip health check
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)

        client_id = self._get_client_id(request)

        # Determine limit based on auth
        has_auth = "authorization" in request.headers
        limit = self.authenticated_limit if has_auth else self.anonymous_limit

        if self._is_rate_limited(client_id, limit):
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "message": "Trop de requêtes. Réessayez dans quelques secondes.",
                    "retry_after": 60,
                },
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = limit - len(self._requests[client_id])
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))

        return response
