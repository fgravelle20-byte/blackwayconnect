import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

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

# --- FastAPI App ---
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="BlackWayConnect BaaS Engine",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Custom Middleware ---
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(PerformanceMiddleware)

# --- Routers ---
from auth.router import router as auth_router
from portal.router import router as portal_router
from notifications.router import router as notifications_router
from rewards.router import router as rewards_router
from flex.router import router as flex_router
from modules.payments.router import router as payments_router
from modules.audit.router import router as audit_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(portal_router, prefix="/api/v1/portal", tags=["Portal"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(rewards_router, prefix="/api/v1/rewards", tags=["Rewards"])
app.include_router(flex_router, prefix="/api/v1/flex", tags=["Flex"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(audit_router, prefix="/api/v1/audit", tags=["Audit IA"])

# Load index.html content once at startup
INDEX_PATH = os.path.join(os.path.dirname(__file__), "templates", "index.html")
if os.path.exists(INDEX_PATH):
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        INDEX_HTML = f.read()
else:
    INDEX_HTML = "<h1>BlackWayConnect</h1><p>Site template not found.</p>"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}

@app.get("/app", response_class=HTMLResponse)
async def portal():
    portal_path = os.path.join(os.path.dirname(__file__), "templates", "portal.html")
    if os.path.exists(portal_path):
        with open(portal_path, "r", encoding="utf-8") as f: return f.read()
    return "<h1>Portal Not Found</h1>"

@app.get("/", response_class=HTMLResponse)
async def root():
    return INDEX_HTML

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
