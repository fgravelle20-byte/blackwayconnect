import os
import sentry_sdk
import traceback
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse

from config.settings import settings
from middleware.rate_limiter import RateLimiterMiddleware
from middleware.performance import PerformanceMiddleware

# --- Sentry Initialization ---
sentry_dsn = os.environ.get("SENTRY_DSN", settings.SENTRY_DSN)
if sentry_dsn and "project-id" not in sentry_dsn:
    try:
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
        print("[INFO] Sentry initialized successfully.")
    except Exception as e:
        print(f"[WARNING] Failed to initialize Sentry: {e}")
else:
    print("[INFO] Sentry is disabled or using a placeholder DSN.")

# --- FastAPI App ---
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="BlackWayConnect BaaS Engine",
    debug=True,
)

# Global Exception Handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error - Debug Mode Active",
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    )

# --- Templates ---
templates = Jinja2Templates(directory="templates")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Custom Middleware ---
try:
    app.add_middleware(RateLimiterMiddleware)
    app.add_middleware(PerformanceMiddleware)
except Exception as e:
    print(f"[ERROR] Middleware load error: {e}")

# --- Routers ---
try:
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
except Exception as e:
    print(f"[ERROR] Router load error: {e}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        return HTMLResponse(content=f"<h1>Template Error</h1><pre>{traceback.format_exc()}</pre>", status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080)),
    )
