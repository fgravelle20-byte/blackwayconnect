import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware

PORT = 8080
try:
    from config.settings import settings
except ImportError:
    class DummySettings:
        APP_NAME = "BlackWayConnect"
        VERSION = "2.1.0"
        ENVIRONMENT = "production"
        SENTRY_DSN = ""
        DEBUG = False
    settings = DummySettings()

sentry_dsn = os.environ.get("SENTRY_DSN", settings.SENTRY_DSN)
if sentry_dsn and "project-id" not in sentry_dsn:
    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[StarletteIntegration(), FastApiIntegration()],
            traces_sample_rate=0.3,
            environment=settings.ENVIRONMENT,
            release=f"blackwayconnect@{settings.VERSION}",
        )
    except Exception:
        pass

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)
templates = Jinja2Templates(directory="templates")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class WwwRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect www.blackwayconnect.com → apex (fix 3 audit)."""

    async def dispatch(self, request: Request, call_next):
        host = request.headers.get("host", "").split(":")[0].lower()
        if host == "www.blackwayconnect.com":
            url = request.url.replace(netloc="blackwayconnect.com")
            return RedirectResponse(str(url), status_code=301)
        return await call_next(request)


app.add_middleware(WwwRedirectMiddleware)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

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
except Exception:
    pass


def page_ctx(**kwargs):
    base = {
        "lang": "fr",
        "og_locale": "fr_CA",
    }
    base.update(kwargs)
    return base


def render(request: Request, name: str, **kwargs):
    return templates.TemplateResponse(request, name, page_ctx(**kwargs))


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mode": "go_live_cloudflare_b",
        "version": settings.VERSION,
        "origin": "railway",
        "preview": "https://dependable-spirit-production.up.railway.app",
        "buy": "/api/v1/payments/plans",
        "email_canonical": settings.SUPPORT_EMAIL,
    }


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    # SEO PARTIE 4 — titre ≤ ~60 car. (mot-clé en tête) + meta ~155 car.
    seo_title = "Grow Hub — CRM, site et automatisation IA | BlackWayConnect"
    seo_description = (
        "Site, CRM, soumissions, paiements et IA dans un seul système. "
        "Forfaits dès 299 $/mois. Premier lead en 30 jours ou le mois suivant est offert."
    )
    return render(
        request,
        "index.html",
        transparent_nav=True,
        title=seo_title,
        description=seo_description,
        canonical="https://blackwayconnect.com/",
        og_title=seo_title,
    )


@app.get("/grow-hub", response_class=HTMLResponse)
async def grow_hub(request: Request):
    return render(
        request,
        "grow-hub.html",
        title="Grow Hub — Pipeline, CRM et automatisation | BlackWayConnect",
        description="Grow Hub : leads, CRM, soumissions et paiements dès 299 $/mois. Garantie premier lead en 30 jours.",
        canonical="https://blackwayconnect.com/grow-hub",
    )


@app.get("/forfaits", response_class=HTMLResponse)
async def forfaits(request: Request):
    return render(
        request,
        "forfaits.html",
        title="Forfaits projets et Grow Hub | BlackWayConnect",
        description="Site haute conversion dès 1 995 $, système de revenus 4 995 $, app mobile 7 995 $. Abonnements Grow Hub dès 299 $/mois.",
        canonical="https://blackwayconnect.com/forfaits",
    )


@app.get("/services", response_class=HTMLResponse)
async def services(request: Request):
    return render(
        request,
        "services.html",
        title="Services — sites, apps, IA | BlackWayConnect",
        description="Sites haute conversion, applications, agents IA et SEO reliés au Grow Hub.",
        canonical="https://blackwayconnect.com/services",
    )


@app.get("/equipe", response_class=HTMLResponse)
@app.get("/equipe-services-humains", response_class=HTMLResponse)
async def equipe(request: Request):
    return render(
        request,
        "equipe.html",
        title="Notre équipe | BlackWayConnect",
        description="Équipe BlackWayConnect à Longueuil — stratégie, technologie et IA bilingues.",
        canonical="https://blackwayconnect.com/equipe",
    )


@app.get("/en", response_class=HTMLResponse)
async def en_home(request: Request):
    return render(
        request,
        "en.html",
        lang="en",
        og_locale="en_CA",
        title="Grow Hub — CRM, website & AI automation | BlackWayConnect",
        description="Website, CRM, quotes, payments and AI in one system. Plans from $229 USD/month. First lead in 30 days or next month free.",
        canonical="https://blackwayconnect.com/en",
        og_title="BlackWayConnect Grow Hub — Lead to revenue",
    )


@app.get("/soumission", response_class=HTMLResponse)
async def soumission(request: Request):
    return RedirectResponse("/#reserver", status_code=302)


@app.get("/legal/mentions-legales", response_class=HTMLResponse)
async def legal_mentions(request: Request):
    return templates.TemplateResponse(request, "legal/mentions-legales.html")


@app.get("/legal/cgu", response_class=HTMLResponse)
async def legal_cgu(request: Request):
    path = "legal/cgu.html" if os.path.exists("templates/legal/cgu.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


@app.get("/legal/confidentialite", response_class=HTMLResponse)
async def legal_confidentiality(request: Request):
    path = "legal/confidentialite.html" if os.path.exists("templates/legal/confidentialite.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


@app.get("/legal/cookies", response_class=HTMLResponse)
async def legal_cookies(request: Request):
    path = "legal/cookies.html" if os.path.exists("templates/legal/cookies.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


@app.get("/legal/msa", response_class=HTMLResponse)
async def legal_msa(request: Request):
    path = "legal/msa.html" if os.path.exists("templates/legal/msa.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


@app.get("/legal/sla", response_class=HTMLResponse)
async def legal_sla(request: Request):
    path = "legal/sla.html" if os.path.exists("templates/legal/sla.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


@app.get("/legal/aup", response_class=HTMLResponse)
async def legal_aup(request: Request):
    path = "legal/aup.html" if os.path.exists("templates/legal/aup.html") else "legal/mentions-legales.html"
    return templates.TemplateResponse(request, path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
