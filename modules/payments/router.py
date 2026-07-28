"""
Routes de paiement Stripe.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from auth.utils import get_current_user
from modules.payments.payments import (
    create_checkout_session, handle_webhook_event,
    get_payment_history, create_subscription, PRICE_IDS
)

router = APIRouter()


@router.get("/plans")
async def list_plans():
    """Liste les plans disponibles avec leurs prix."""
    plans = []
    for key, data in PRICE_IDS.items():
        plans.append({
            "id": key,
            "name": data["name"],
            "amount_cad": data["amount"] / 100,
            "price_id_one_time": data["one_time"],
        })
    return {"plans": plans, "currency": "CAD"}


@router.post("/checkout")
async def checkout(
    plan_id: str,
    mode: str = "payment",
    current_user: dict = Depends(get_current_user)
):
    """Crée une session de checkout Stripe."""
    if plan_id not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    plan = PRICE_IDS[plan_id]
    price_id = plan["one_time"] if mode == "payment" else plan.get("monthly", plan["one_time"])

    result = await create_checkout_session(
        price_id=price_id,
        client_email=current_user["sub"],
        client_id=current_user["sub"],
        mode=mode,
    )
    return result


@router.post("/subscribe")
async def subscribe(
    plan_id: str,
    billing: str = "monthly",
    current_user: dict = Depends(get_current_user)
):
    """Crée un abonnement récurrent."""
    if plan_id not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Plan invalide")

    plan = PRICE_IDS[plan_id]
    price_id = plan.get("annual") if billing == "annual" else plan.get("monthly")

    result = await create_subscription(
        client_email=current_user["sub"],
        price_id=price_id,
        client_id=current_user["sub"],
    )
    return result


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Endpoint pour les webhooks Stripe. Déclenche la livraison Asana automatique."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    result = await handle_webhook_event(payload, sig_header)
    return result


@router.get("/history")
async def payment_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Historique des paiements du client."""
    history = await get_payment_history(current_user["sub"], limit)
    return {"payments": history, "total": len(history)}
