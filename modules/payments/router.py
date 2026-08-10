"""
Router paiements Stripe — BlackWay Connect
==========================================
Endpoints :
  GET  /plans                 → grille publique + liens d'achat (mensuel/annuel)
  GET  /buy/{plan_id}         → Checkout Stripe (?billing=monthly|annual)
  POST /checkout/guest        → Checkout Session sans auth
  POST /checkout              → Checkout Session (auth)
  POST /subscribe             → Abonnement (auth)
  POST /webhook               → webhook Stripe
  GET  /history               → historique (auth)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional

from auth.utils import get_current_user
from modules.payments.payments import (
    PRICE_IDS,
    ANNUAL_DISCOUNT,
    create_checkout_session,
    create_public_checkout,
    create_subscription,
    handle_webhook_event,
    get_payment_history,
    audit_stripe_health,
    _price_aligned,
    normalize_billing,
    STRIPE_ACCOUNT_ID,
    CANONICAL_WEBHOOK_URL,
)
from config.emails import SERVICE_EMAIL, BLOCKED_EMAILS

# Prefix is applied in main.py: include_router(..., prefix="/api/v1/payments")
router = APIRouter(tags=["payments"])


class CheckoutRequest(BaseModel):
    plan_id: str
    billing: str = "monthly"
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class GuestCheckoutRequest(BaseModel):
    plan_id: str
    email: str = Field(..., min_length=3)
    billing: str = "monthly"
    name: Optional[str] = None
    company: Optional[str] = None


@router.get("/plans")
async def list_plans():
    """Grille tarifaire publique + liens d'achat Stripe."""
    plans = []
    for key, meta in PRICE_IDS.items():
        is_sub = meta.get("type") == "abonnement"
        entry = {
            "id": key,
            "name": meta["name"],
            "amount": meta["amount"],
            "amount_cad": meta["amount"],
            "currency": "CAD",
            "type": meta["type"],
            "category": meta.get("category"),
            "bw_forfait": meta.get("bw_forfait", key),
            "delai_jours": meta.get("delai_jours"),
            "billing_options": meta.get("billing_options"),
            "annual_discount": meta.get("annual_discount", 0),
            "buyable": bool(meta.get("buyable")),
            "canonical": bool(meta.get("canonical")),
            "buy_url": f"/api/v1/payments/buy/{key}",
        }
        if is_sub:
            entry.update({
                "amount_monthly": meta["amount_monthly"],
                "amount_annual": meta["amount_annual"],
                "price_id_monthly": meta.get("monthly"),
                "price_id_annual": meta.get("annual"),
                "payment_link_monthly": meta.get("payment_link_monthly"),
                "payment_link_annual": meta.get("payment_link_annual"),
                "buy_url_monthly": f"/api/v1/payments/buy/{key}?billing=monthly",
                "buy_url_annual": f"/api/v1/payments/buy/{key}?billing=annual",
                "price_aligned_monthly": _price_aligned(meta, "monthly"),
                "price_aligned_annual": _price_aligned(meta, "annual"),
                "annual_discount": ANNUAL_DISCOUNT,
            })
        else:
            entry.update({
                "price_id_one_time": meta.get("one_time") or meta.get("id"),
                "payment_link": meta.get("payment_link"),
                "price_aligned": _price_aligned(meta, "one_time"),
            })
        plans.append(entry)
    return {
        "plans": plans,
        "currency": "CAD",
        "annual_discount": ANNUAL_DISCOUNT,
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
        "only_email": SERVICE_EMAIL,
        "blocked": list(BLOCKED_EMAILS),
        "rule": "ONE email only for Stripe/apps: serviceclient@blackwayconnect.com",
    }
    return report


@router.get("/buy/{plan_id}")
async def buy_plan_redirect(
    plan_id: str,
    billing: str = Query("monthly", description="monthly ou annual (12% rabais)"),
):
    """
    Redirection publique vers Stripe Checkout.
    billing=monthly (défaut) ou billing=annual (−12 % sur 12 × mensuel).
    """
    meta = PRICE_IDS.get(plan_id)
    if not meta or not meta.get("buyable"):
        raise HTTPException(status_code=404, detail="Forfait introuvable ou non achetable")

    billing_n = normalize_billing(billing)
    result = await create_public_checkout(plan_id, billing=billing_n)
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
        billing=body.billing,
    )
    if "error" in result or not result.get("url"):
        raise HTTPException(status_code=400, detail=result.get("error") or "Checkout impossible")
    return {
        "checkout_url": result["url"],
        "plan_id": body.plan_id,
        "billing": result.get("billing"),
        "via": result.get("via"),
        "amount": result.get("amount"),
        "warning": result.get("warning"),
    }


@router.post("/checkout")
async def create_checkout(
    plan_id: Optional[str] = None,
    mode: str = "subscription",
    billing: str = "monthly",
    body: Optional[CheckoutRequest] = None,
    current_user: dict = Depends(get_current_user),
):
    """Crée une session Stripe Checkout (utilisateur authentifié)."""
    resolved = (body.plan_id if body else None) or plan_id
    if not resolved or resolved not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")
    billing_n = normalize_billing((body.billing if body else None) or billing)

    result = await create_checkout_session(
        resolved,
        current_user.get("email") or current_user.get("sub", ""),
        current_user.get("sub", ""),
        mode=mode,
        billing=billing_n,
    )
    if "error" in result or not result.get("url"):
        raise HTTPException(status_code=502, detail=result.get("error") or "Checkout impossible")
    return {
        "checkout_url": result["url"],
        "url": result["url"],
        "plan_id": resolved,
        "billing": result.get("billing"),
        "via": result.get("via"),
    }


@router.post("/subscribe")
async def subscribe(
    plan_id: str,
    billing: str = "monthly",
    current_user: dict = Depends(get_current_user),
):
    """Crée un abonnement récurrent mensuel ou annuel (auth)."""
    if plan_id not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    billing_n = normalize_billing(billing)
    result = await create_subscription(
        client_email=current_user.get("email") or current_user.get("sub", ""),
        price_id=plan_id,
        client_id=current_user.get("sub", ""),
        billing=billing_n,
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
