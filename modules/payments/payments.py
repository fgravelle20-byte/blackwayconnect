import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Grille tarifaire corrigée — 4 août 2026
# price_id = identifiants Stripe LIVE historiques (montants Stripe à recréer)
# Voir artifacts/Grille tarifaire corrigée BlackWayConnect.md
PRICE_IDS = {
    "website_lead_launch": {
        "one_time": "price_1U0CWRAG7HUL9RtrKszbmNvn",
        "id": "price_1U0CWRAG7HUL9RtrKszbmNvn",
        "amount": 1995.00,
        "name": "Site haute conversion",
        "type": "activation",
        "bw_forfait": "website_lead_launch",
        "delai_jours": 21,
    },
    "revenue_system": {
        "one_time": "price_1U0CWYAG7HUL9RtrqiOYoSVL",
        "id": "price_1U0CWYAG7HUL9RtrqiOYoSVL",
        "amount": 4995.00,
        "name": "Système de revenus complet",
        "type": "activation",
        "bw_forfait": "revenue_system",
        "delai_jours": 35,
    },
    "ai_scale": {
        "one_time": "price_1U0CWYAG7HUL9RtrEHxzww0T",
        "id": "price_1U0CWYAG7HUL9RtrEHxzww0T",
        "amount": 7995.00,
        "name": "Application mobile iOS & Android",
        "type": "activation",
        "bw_forfait": "ai_scale",
        "delai_jours": 45,
    },
    "grow_hub_launch": {
        "monthly": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "id": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "one_time": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "amount": 299.00,
        "name": "Grow Hub Launch",
        "type": "abonnement",
        "bw_forfait": "grow_hub_launch",
        "delai_jours": 7,
    },
    "grow_hub_growth": {
        "monthly": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "id": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "one_time": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "amount": 749.00,
        "name": "Grow Hub Growth",
        "type": "abonnement",
        "bw_forfait": "grow_hub_growth",
        "delai_jours": 7,
    },
    "grow_hub_scale": {
        "monthly": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "id": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "one_time": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "amount": 1495.00,
        "name": "Grow Hub Scale",
        "type": "abonnement",
        "bw_forfait": "grow_hub_scale",
        "delai_jours": 7,
    },
}

BRAND_URL = "https://blackwayconnect.com"

async def create_checkout_session(plan_key, client_email, client_id, mode="payment"):
    # Compat : router peut passer un price_id directement
    price_data = PRICE_IDS.get(plan_key)
    price_id = None
    plan_meta = plan_key

    if price_data:
        is_sub = price_data.get("type") == "abonnement" or mode == "subscription"
        price_id = price_data.get("monthly") if is_sub and price_data.get("monthly") else price_data.get("one_time") or price_data.get("id")
        mode = "subscription" if is_sub else "payment"
        plan_meta = price_data.get("bw_forfait", plan_key)
    elif isinstance(plan_key, str) and plan_key.startswith("price_"):
        price_id = plan_key
    else:
        return {"error": "Plan invalide"}

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=client_email,
            metadata={
                "client_id": client_id,
                "plan": plan_meta,
                "bw_forfait": plan_meta,
                "platform": "blackwayconnect",
            },
            success_url=f"{BRAND_URL}/app?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{BRAND_URL}",
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"checkout error: {e}")
        return {"error": str(e)}

async def create_subscription(client_email, price_id, client_id):
    return await create_checkout_session(price_id, client_email, client_id, mode="subscription")


async def handle_webhook_event(payload, sig_header):
    """Vérifie la signature Stripe et déclenche la livraison si paiement confirmé."""
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        logger.error(f"webhook signature error: {e}")
        return {"error": "invalid signature"}

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        try:
            from delivery import create_delivery_task
            await create_delivery_task(
                client_name=session.get("customer_details", {}).get("name") or "Client",
                client_email=session.get("customer_details", {}).get("email") or session.get("customer_email") or "",
                client_id=session.get("metadata", {}).get("client_id", ""),
                plan_key=session.get("metadata", {}).get("bw_forfait") or session.get("metadata", {}).get("plan", ""),
                amount_paid=(session.get("amount_total") or 0) / 100,
                payment_id=session.get("payment_intent") or session.get("id", ""),
            )
        except Exception as e:
            logger.error(f"delivery trigger error: {e}")
        return {"received": True, "type": event.get("type")}

    return {"received": True, "type": event.get("type")}


async def get_payment_history(client_id: str, limit: int = 10):
    """Historique Stripe filtré par metadata client_id."""
    try:
        sessions = stripe.checkout.Session.list(limit=limit * 3)
        out = []
        for s in sessions.auto_paging_iter():
            if s.metadata and s.metadata.get("client_id") == client_id:
                out.append({
                    "id": s.id,
                    "amount": (s.amount_total or 0) / 100,
                    "currency": (s.currency or "cad").upper(),
                    "status": s.payment_status,
                    "plan": s.metadata.get("bw_forfait") or s.metadata.get("plan"),
                })
            if len(out) >= limit:
                break
        return out
    except Exception as e:
        logger.error(f"payment history error: {e}")
        return []
