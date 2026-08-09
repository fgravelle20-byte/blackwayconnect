"""
Router paiements Stripe — BlackWay Connect
==========================================
Endpoints :
  GET  /plans                 → grille publique + liens d'achat
  GET  /buy/{plan_id}         → Checkout Stripe (montant affiché)
  POST /checkout/guest        → Checkout Session sans auth
  POST /checkout              → Checkout Session (auth)
  POST /subscribe             → Abonnement (auth)
  POST /webhook               → webhook Stripe
  GET  /history               → historique (auth)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional

from auth.utils import get_current_user
from modules.payments.payments import (
    PRICE_IDS,
    create_checkout_session,
    create_public_checkout,
    create_subscription,
    handle_webhook_event,
    get_payment_history,
    audit_stripe_health,
    _price_aligned,
    STRIPE_ACCOUNT_ID,
    CANONICAL_WEBHOOK_URL,
)
from config.emails import SERVICE_EMAIL, ACCOUNTING_EMAIL, PERSONAL_BLOCKED

# Prefix is applied in main.py: include_router(..., prefix="/api/v1/payments")
router = APIRouter(tags=["payments"])


class CheckoutRequest(BaseModel):
    plan_id: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class GuestCheckoutRequest(BaseModel):
    plan_id: str
    email: str = Field(..., min_length=3)
    name: Optional[str] = None
    company: Optional[str] = None


@router.get("/plans")
async def list_plans():
    """Grille tarifaire publique + liens d'achat Stripe."""
    plans = []
    for key, meta in PRICE_IDS.items():
        aligned = _price_aligned(meta)
        plans.append({
            "id": key,
            "name": meta["name"],
            "amount": meta["amount"],
            "amount_cad": meta["amount"],
            "stripe_amount": meta.get("stripe_amount", meta["amount"]),
            "price_aligned": aligned,
            "currency": "CAD",
            "type": meta["type"],
            "bw_forfait": meta.get("bw_forfait", key),
            "delai_jours": meta.get("delai_jours"),
            "price_id_one_time": meta.get("one_time") or meta.get("id"),
            "price_id_monthly": meta.get("monthly"),
            "payment_link": meta.get("payment_link") if aligned else None,
            "buy_url": f"/api/v1/payments/buy/{key}",
            "buyable": bool(meta.get("buyable")),
            "canonical": bool(meta.get("canonical")),
        })
    return {
        "plans": plans,
        "currency": "CAD",
        "stripe_account": STRIPE_ACCOUNT_ID,
        "canonical_webhook": CANONICAL_WEBHOOK_URL,
    }


@router.get("/status")
async def payments_status():
    """
    Audit lecture seule du compte Stripe + catalogue + emails canoniques.
    """
    report = await audit_stripe_health()
    report["emails"] = {
        "canonical_saved": SERVICE_EMAIL,
        "accounting": ACCOUNTING_EMAIL,
        "personal_blocked": list(PERSONAL_BLOCKED),
        "rule": "Never use iCloud for Stripe/Base44/apps — only serviceclient@blackwayconnect.com",
    }
    return report


@router.get("/buy/{plan_id}")
async def buy_plan_redirect(plan_id: str):
    """
    Redirection publique vers Stripe Checkout au montant AFFICHÉ sur le site.
    Si le Price Stripe historique est aligné → Payment Link direct.
    Sinon → Checkout Session avec price_data (299/749/1495/1995…).
    """
    meta = PRICE_IDS.get(plan_id)
    if not meta or not meta.get("buyable"):
        raise HTTPException(status_code=404, detail="Forfait introuvable ou non achetable")

    if _price_aligned(meta) and meta.get("payment_link"):
        return RedirectResponse(url=meta["payment_link"], status_code=303)

    result = await create_public_checkout(plan_id)
    if "error" in result or not result.get("url"):
        raise HTTPException(
            status_code=503,
            detail=result.get("error") or "Checkout Stripe indisponible. Réessayez ou réservez un appel.",
        )
    return RedirectResponse(url=result["url"], status_code=303)


@router.post("/checkout/guest")
async def create_guest_checkout(body: GuestCheckoutRequest):
    """Crée une Checkout Session Stripe sans compte utilisateur."""
    if body.plan_id not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    result = await create_public_checkout(
        body.plan_id,
        client_email=body.email,
        client_id=f"guest:{body.email}",
    )
    if "error" in result or not result.get("url"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Checkout impossible")
    return {
        "checkout_url": result["url"],
        "plan_id": body.plan_id,
        "via": result.get("via"),
        "amount": result.get("amount"),
        "warning": result.get("warning"),
    }


@router.post("/checkout")
async def create_checkout(
    plan_id: Optional[str] = None,
    mode: str = "payment",
    body: Optional[CheckoutRequest] = None,
    current_user: dict = Depends(get_current_user),
):
    """Crée une session Stripe Checkout (utilisateur authentifié)."""
    resolved = (body.plan_id if body else None) or plan_id
    if not resolved or resolved not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    result = await create_checkout_session(
        resolved,
        current_user.get("email") or current_user.get("sub", ""),
        current_user.get("sub", ""),
        mode=mode,
    )
    if "error" in result or not result.get("url"):
        raise HTTPException(status_code=502, detail=result.get("error") or "Checkout impossible")
    return {"checkout_url": result["url"], "url": result["url"], "plan_id": resolved, "via": result.get("via")}


@router.post("/subscribe")
async def subscribe(
    plan_id: str,
    billing: str = "monthly",
    current_user: dict = Depends(get_current_user),
):
    """Crée un abonnement récurrent (auth)."""
    if plan_id not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    plan = PRICE_IDS[plan_id]
    price_id = plan.get("annual") if billing == "annual" else plan.get("monthly")
    result = await create_subscription(
        client_email=current_user.get("email") or current_user.get("sub", ""),
        price_id=price_id or plan_id,
        client_id=current_user.get("sub", ""),
    )
    if result.get("error"):
        raise HTTPException(status_code=502, detail=result["error"])
    return result


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Reçoit les événements Stripe (paiement confirmé → déclenche livraison)."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    result = await handle_webhook_event(payload, sig)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/history")
async def payment_history(current_user: dict = Depends(get_current_user)):
    """Historique des paiements du client connecté."""
    client_id = current_user.get("id", current_user.get("sub", ""))
    history = await get_payment_history(client_id)
    return {"payments": history}
