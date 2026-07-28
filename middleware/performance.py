"""
BlackWayConnect - Performance Middleware
Mesure et optimise le temps de réponse de chaque requête.
Objectif: < 100ms pour les endpoints critiques de l'app mobile.
"""

import time
import sentry_sdk
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware de performance BlackWayConnect.
    - Mesure la latence de chaque requête
    - Ajoute des headers de performance (X-Response-Time)
    - Alerte Sentry si > 500ms (seuil UX)
    """

    SLOW_THRESHOLD_MS = 500  # Seuil d'alerte performance

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Add performance headers
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        response.headers["X-Powered-By"] = "BlackWayConnect Engine"
        response.headers["X-API-Version"] = "1.0.0"

        # Sentry performance tracking
        sentry_sdk.add_breadcrumb(
            category="performance",
            message=f"{request.method} {request.url.path} - {duration_ms:.2f}ms",
            level="info" if duration_ms < self.SLOW_THRESHOLD_MS else "warning",
        )

        # Alert on slow responses
        if duration_ms > self.SLOW_THRESHOLD_MS:
            sentry_sdk.set_tag("performance.slow", True)
            sentry_sdk.set_tag("performance.duration_ms", f"{duration_ms:.0f}")

        return response
