import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

# LOGGING STARTUP
PORT = int(os.environ.get("PORT", 8080))
print(f"--- STARTING BLACKWAY ENGINE ON PORT {PORT} ---")

# Import dummy settings to avoid crash if file missing
try:
    from config.settings import settings
except ImportError:
    class DummySettings:
        APP_NAME = "BlackWayConnect"
        VERSION = "2.0.2"
        ENVIRONMENT = "production"
        SENTRY_DSN = ""
        DEBUG = False
    settings = DummySettings()

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
            traces_sample_rate=0.3,
            environment=settings.ENVIRONMENT,
            release=f"blackwayconnect@{settings.VERSION}",
            send_default_pii=False,
        )
        print("Sentry Initialized")
    except Exception: pass

# --- FastAPI App ---
app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers (Safe Import) ---
try:
    from auth.router import router as auth_router
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    from portal.router import router as portal_router
    app.include_router(portal_router, prefix="/api/v1/portal", tags=["Portal"])
    from notifications.router import router as notifications_router
    app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
    from modules.payments.router import router as payments_router
    app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
    from modules.audit.router import router as audit_router
    app.include_router(audit_router, prefix="/api/v1/audit", tags=["Audit IA"])
    print("Routers Loaded")
except Exception as e: print(f"Router Load Error: {e}")

# Load index.html content
INDEX_PATH = os.path.join(os.path.dirname(__file__), "templates", "index.html")
if os.path.exists(INDEX_PATH):
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        INDEX_HTML = f.read()
else:
    INDEX_HTML = "<h1>BlackWayConnect</h1><p>Site template not found.</p>"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "port": PORT}

@app.get("/", response_class=HTMLResponse)
async def root():
    return INDEX_HTML

if __name__ == "__main__":
    import uvicorn
    print(f"Running uvicorn on 0.0.0.0:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
