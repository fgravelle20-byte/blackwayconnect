import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

PORT = 8080
try:
    from config.settings import settings
except ImportError:
    class DummySettings: APP_NAME="BlackWayConnect"; VERSION="2.0.4"; ENVIRONMENT="production"; SENTRY_DSN=""; DEBUG=False
    settings = DummySettings()

sentry_dsn = os.environ.get("SENTRY_DSN", settings.SENTRY_DSN)
if sentry_dsn and "project-id" not in sentry_dsn:
    try:
        sentry_sdk.init(dsn=sentry_dsn, integrations=[StarletteIntegration(), FastApiIntegration()], traces_sample_rate=0.3, environment=settings.ENVIRONMENT, release=f"blackwayconnect@{settings.VERSION}")
    except Exception: pass

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)
templates = Jinja2Templates(directory="templates")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

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
except Exception: pass

INDEX_PATH = os.path.join(os.path.dirname(__file__), "templates", "index.html")
if os.path.exists(INDEX_PATH):
    with open(INDEX_PATH, "r", encoding="utf-8") as f: INDEX_HTML = f.read()
else: INDEX_HTML = "<h1>BlackWayConnect</h1>"

@app.get("/health")
async def health_check(): return {"status": "healthy", "mode": "legal_v4"}

@app.get("/", response_class=HTMLResponse)
async def root(): return INDEX_HTML

@app.get("/legal/mentions-legales", response_class=HTMLResponse)
async def legal_mentions(request: Request): return templates.TemplateResponse("legal/mentions-legales.html", {"request": request})
@app.get("/legal/cgu", response_class=HTMLResponse)
async def legal_cgu(request: Request): return templates.TemplateResponse("legal/cgu.html", {"request": request})
@app.get("/legal/confidentialite", response_class=HTMLResponse)
async def legal_confidentiality(request: Request): return templates.TemplateResponse("legal/confidentialite.html", {"request": request})
@app.get("/legal/cookies", response_class=HTMLResponse)
async def legal_cookies(request: Request): return templates.TemplateResponse("legal/cookies.html", {"request": request})
@app.get("/legal/msa", response_class=HTMLResponse)
async def legal_msa(request: Request): return templates.TemplateResponse("legal/msa.html", {"request": request})
@app.get("/legal/sla", response_class=HTMLResponse)
async def legal_sla(request: Request): return templates.TemplateResponse("legal/sla.html", {"request": request})
@app.get("/legal/aup", response_class=HTMLResponse)
async def legal_aup(request: Request): return templates.TemplateResponse("legal/aup.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
