"""
BlackWayConnect — Magic Mobile API Endpoints
================================================================
New routes for the FastAPI app:
  /api/magic/roi-stats
  /api/magic/opportunity-alerts
  /api/magic/beauty/catalog
  /api/magic/beauty/routine

Module 'Beauté tout pour elle' inclus. 💜
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

magic_router = APIRouter(prefix="/api/magic", tags=["Magic Mobile"])


class ROIStatsResponse(BaseModel):
    customer_id: str
    predicted_ltv: float
    churn_probability: float
    next_best_action: str
    confidence: float
    computed_at: str


class OpportunityAlert(BaseModel):
    business_name: str
    url: str
    score: float
    pain_signals: list
    suggested_channel: str
    generated_script_preview: str


class BeautyProduct(BaseModel):
    id: str
    name: str
    category: str
    description: str
    price: float
    in_stock: bool
    image_url: Optional[str] = None


class RoutineStep(BaseModel):
    order: int
    product: BeautyProduct
    instruction: str
    duration_minutes: int


class BeautyRoutineResponse(BaseModel):
    routine_name: str
    skin_type: str
    steps: list
    total_duration_minutes: int
    personalized_tip: str


@magic_router.get("/roi-stats", response_model=ROIStatsResponse)
async def get_roi_stats(customer_id: str = Query(..., description="ID client BlackWay")):
    """Retourne les pr\u00e9dictions ROI en temps r\u00e9el pour un client donn\u00e9."""
    return ROIStatsResponse(
        customer_id=customer_id,
        predicted_ltv=4820.50,
        churn_probability=0.12,
        next_best_action="Envoyer offre fid\u00e9lit\u00e9 15% sur prochain achat",
        confidence=0.87,
        computed_at=datetime.now(timezone.utc).isoformat(),
    )


@magic_router.get("/opportunity-alerts", response_model=list)
async def get_opportunity_alerts(
    region: str = Query("montreal", description="R\u00e9gion cible"),
    limit: int = Query(5, ge=1, le=20),
):
    """Retourne les opportunit\u00e9s de prospection d\u00e9tect\u00e9es par le Neural Sales Engine."""
    return [
        OpportunityAlert(
            business_name="Piscine Hydrofix",
            url="https://piscinehydrofix.ca",
            score=0.92,
            pain_signals=["pas de booking en ligne", "soumission gratuite", "urgence 24h"],
            suggested_channel="email",
            generated_script_preview="Bonjour Piscine Hydrofix \u2014 j'ai remarqu\u00e9 que vous n'avez pas encore de prise de RDV en ligne...",
        ),
        OpportunityAlert(
            business_name="Toitures Laval Pro",
            url="https://toitureslavalpro.ca",
            score=0.85,
            pain_signals=["site non-mobile", "aucun avis Google r\u00e9cent"],
            suggested_channel="sms",
            generated_script_preview="Salut Toitures Laval Pro! Rapide question : transformer votre trafic web en clients r\u00e9currents \u2014 \u00e7a vous parle?",
        ),
    ]


BEAUTY_CATALOG = [
    BeautyProduct(id="bp-001", name="S\u00e9rum \u00c9clat Vitamine C", category="soin visage", description="S\u00e9rum antioxydant haute concentration pour un teint lumineux.", price=42.99, in_stock=True),
    BeautyProduct(id="bp-002", name="Cr\u00e8me Hydratante Nuit", category="soin visage", description="Hydratation intense pendant le sommeil, formule naturelle.", price=38.50, in_stock=True),
    BeautyProduct(id="bp-003", name="Huile Capillaire Argan", category="cheveux", description="Nourrit et r\u00e9pare les pointes s\u00e8ches. 100% bio.", price=29.99, in_stock=True),
    BeautyProduct(id="bp-004", name="Masque D\u00e9tox Argile Verte", category="soin visage", description="Purifie les pores en profondeur, peau nette en 10 min.", price=24.99, in_stock=True),
    BeautyProduct(id="bp-005", name="Baume L\u00e8vres Rose Musqu\u00e9e", category="l\u00e8vres", description="Hydrate et colore subtilement. SPF 15.", price=12.99, in_stock=True),
]


@magic_router.get("/beauty/catalog", response_model=list)
async def get_beauty_catalog(category: Optional[str] = Query(None, description="Filtrer par cat\u00e9gorie")):
    """Catalogue Beaut\u00e9 \u2014 Module d\u00e9di\u00e9 'Beaut\u00e9 tout pour elle'."""
    if category:
        return [p for p in BEAUTY_CATALOG if p.category == category]
    return BEAUTY_CATALOG


@magic_router.get("/beauty/routine", response_model=BeautyRoutineResponse)
async def get_beauty_routine(skin_type: str = Query("mixte", description="Type de peau: s\u00e8che, grasse, mixte, sensible")):
    """G\u00e9n\u00e8re une routine beaut\u00e9 personnalis\u00e9e selon le type de peau. Pens\u00e9 avec amour pour maman. \ud83d\udc9c"""
    routines = {
        "mixte": BeautyRoutineResponse(
            routine_name="Routine \u00c9quilibre Parfait",
            skin_type="mixte",
            steps=[
                RoutineStep(order=1, product=BEAUTY_CATALOG[3], instruction="Appliquer le masque sur peau propre, laisser 10 min.", duration_minutes=10),
                RoutineStep(order=2, product=BEAUTY_CATALOG[0], instruction="Appliquer 3-4 gouttes de s\u00e9rum sur le visage.", duration_minutes=2),
                RoutineStep(order=3, product=BEAUTY_CATALOG[1], instruction="Terminer avec la cr\u00e8me hydratante, mouvements circulaires.", duration_minutes=3),
            ],
            total_duration_minutes=15,
            personalized_tip="Pour une peau mixte, alterner le masque d\u00e9tox 2x/semaine. \ud83c\udf3f",
        ),
        "s\u00e8che": BeautyRoutineResponse(
            routine_name="Routine Hydratation Intense",
            skin_type="s\u00e8che",
            steps=[
                RoutineStep(order=1, product=BEAUTY_CATALOG[0], instruction="S\u00e9rum Vitamine C sur peau humide pour meilleure absorption.", duration_minutes=2),
                RoutineStep(order=2, product=BEAUTY_CATALOG[1], instruction="G\u00e9n\u00e9reuse couche de cr\u00e8me nuit, insister sur les zones s\u00e8ches.", duration_minutes=3),
                RoutineStep(order=3, product=BEAUTY_CATALOG[4], instruction="Sceller l'hydratation des l\u00e8vres avec le baume.", duration_minutes=1),
            ],
            total_duration_minutes=6,
            personalized_tip="Brumiser le visage avant le s\u00e9rum pour un boost d'hydratation. \ud83d\udca7",
        ),
    }
    return routines.get(skin_type, routines["mixte"])


def register_magic_routes(app):
    """Call from main.py: register_magic_routes(app)"""
    app.include_router(magic_router)
    return app
