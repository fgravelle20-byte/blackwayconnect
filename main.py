"""
BlackWayConnect Engine v2.0 - Point d'entrée principal
FastAPI + Sentry Monitoring + tous les modules BaaS.
"""

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from middleware.rate_limiter import RateLimiterMiddleware
from middleware.performance import PerformanceMiddleware

# ─── Sentry Initialization ─────────────────────────────────────────────────
sentry_dsn = os.environ.get("SENTRY_DSN", settings.SENTRY_DSN)
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.3,
        profiles_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
        release=f"blackwayconnect@{settings.VERSION}",
        send_default_pii=False,
    )

# ─── FastAPI App ────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="BlackWayConnect BaaS Engine - Plateforme complète pour entreprises locales",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ─── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://blackwayconnect.com",
        "https://www.blackwayconnect.com",
        "https://app.blackwayconnect.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Custom Middleware ──────────────────────────────────────────────────────
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(PerformanceMiddleware)

# ─── Routers ───────────────────────────────────────────────────────────────
from auth.router import router as auth_router
from portal.router import router as portal_router
from notifications.router import router as notifications_router
from rewards.router import router as rewards_router
from flex.router import router as flex_router
from modules.payments.router import router as payments_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(portal_router, prefix="/api/v1/portal", tags=["Portal"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(rewards_router, prefix="/api/v1/rewards", tags=["Rewards"])
app.include_router(flex_router, prefix="/api/v1/flex", tags=["Flex"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "sentry_enabled": bool(sentry_dsn),
    }


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Disabled in production",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 3000)),
        reload=settings.DEBUG,
    )
