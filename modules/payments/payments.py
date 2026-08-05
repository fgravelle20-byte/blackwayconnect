"""
Paiements Stripe — BlackWay Connect
====================================
Grille affichée (4 août 2026) + checkout public.

Quand le Price Stripe historique ne correspond pas au montant affiché,
on crée une Checkout Session avec price_data (montant correct).
Les Payment Links ne sont utilisés QUE si stripe_amount == amount.
"""
import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Grille tarifaire corrigée — 4 août 2026
# price_id / payment_link = Stripe LIVE historiques (acct_1TDZjzAG7HUL9Rtr)
PRICE_IDS = {
    "website_lead_launch": {
        "one_time": "price_1U0CWRAG7HUL9RtrKszbmNvn",
        "id": "price_1U0CWRAG7HUL9RtrKszbmNvn",
        "amount": 1995.00,
        "stripe_amount": 1495.00,
        "name": "Site haute conversion",
        "type": "activation",
        "bw_forfait": "website_lead_launch",
        "delai_jours": 21,
        "payment_link": "https://buy.stripe.com/fZu9AS2HH3sT2ZEdVIeIw0q",
        "buyable": True,
    },
    "revenue_system": {
        "one_time": "price_1U0CWYAG7HUL9RtrqiOYoSVL",
        "id": "price_1U0CWYAG7HUL9RtrqiOYoSVL",
        "amount": 4995.00,
        "stripe_amount": 4995.00,
        "name": "Système de revenus complet",
        "type": "activation",
        "bw_forfait": "revenue_system",
        "delai_jours": 35,
        "payment_link": "https://buy.stripe.com/14A7sKeqpfbB8jY5pceIw0r",
        "buyable": True,
    },
    "ai_scale": {
        "one_time": "price_1U0CWYAG7HUL9RtrEHxzww0T",
        "id": "price_1U0CWYAG7HUL9RtrEHxzww0T",
        "amount": 7995.00,
        "stripe_amount": 7995.00,
        "name": "Application mobile iOS & Android",
        "type": "activation",
        "bw_forfait": "ai_scale",
        "delai_jours": 45,
        "payment_link": "https://buy.stripe.com/dRm8wO965fbB8jY5pceIw0s",
        "buyable": True,
    },
    "grow_hub_launch": {
        "monthly": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "id": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "one_time": "price_1U0CWiAG7HUL9RtrKaR00BRz",
        "amount": 299.00,
        "stripe_amount": 129.00,
        "name": "Grow Hub Launch",
        "type": "abonnement",
        "bw_forfait": "grow_hub_launch",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/6oUfZgbedgfFgQu2d0eIw0t",
        "buyable": True,
    },
    "grow_hub_growth": {
        "monthly": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "id": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "one_time": "price_1U0CWhAG7HUL9RtrRUDlmp9v",
        "amount": 749.00,
        "stripe_amount": 299.00,
        "name": "Grow Hub Growth",
        "type": "abonnement",
        "bw_forfait": "grow_hub_growth",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/28EeVc1DDd3tbwag3QeIw0u",
        "buyable": True,
    },
    "grow_hub_scale": {
        "monthly": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "id": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "one_time": "price_1U0CWqAG7HUL9RtrwZ66aT90",
        "amount": 1495.00,
        "stripe_amount": 599.00,
        "name": "Grow Hub Scale",
        "type": "abonnement",
        "bw_forfait": "grow_hub_scale",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/6oUfZg0zz6F57fU3h4eIw0v",
        "buyable": True,
    },
}

BRAND_URL = os.environ.get("BRAND_URL", "https://blackwayconnect.com")
RAILWAY_PUBLIC = os.environ.get(
    "RAILWAY_PUBLIC_DOMAIN",
    "https://blackwayconnect-production.up.railway.app",
)


def _price_aligned(meta: dict) -> bool:
    return abs(float(meta["amount"]) - float(meta.get("stripe_amount", meta["amount"]))) < 0.01


def _is_subscription(meta: dict) -> bool:
    return meta.get("type") == "abonnement"


def _line_item_for_plan(meta: dict) -> dict:
    """Construit line_item Stripe au montant AFFICHÉ (amount), pas l'ancien Price."""
    unit_amount = int(round(float(meta["amount"]) * 100))
    product_data = {
        "name": meta["name"],
        "metadata": {
            "bw_forfait": meta.get("bw_forfait", ""),
            "platform": "blackwayconnect",
        },
    }
    if _is_subscription(meta):
        return {
            "price_data": {
                "currency": "cad",
                "unit_amount": unit_amount,
                "recurring": {"interval": "month"},
                "product_data": product_data,
            },
            "quantity": 1,
        }
    return {
        "price_data": {
            "currency": "cad",
            "unit_amount": unit_amount,
            "product_data": product_data,
        },
        "quantity": 1,
    }


def _line_item_from_price_id(meta: dict) -> dict:
    """Utilise le Price ID Stripe existant (uniquement si montants alignés)."""
    if _is_subscription(meta):
        price_id = meta.get("monthly") or meta.get("id")
    else:
        price_id = meta.get("one_time") or meta.get("id")
    return {"price": price_id, "quantity": 1}


async def create_public_checkout(
    plan_key: str,
    client_email: Optional[str] = None,
    client_id: Optional[str] = None,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
):
    """
    Checkout public pour un forfait.
    - Si Price Stripe aligné → utilise price_id (ou Payment Link côté router)
    - Sinon → price_data au montant affiché sur le site
    """
    meta = PRICE_IDS.get(plan_key)
    if not meta:
        return {"error": "Plan invalide"}

    if not stripe.api_key:
        # Fallback: Payment Link même si montant désaligné (dernier recours)
        if meta.get("payment_link"):
            return {
                "url": meta["payment_link"],
                "via": "payment_link",
                "warning": "STRIPE_SECRET_KEY manquante — redirection Payment Link (montant Stripe historique).",
            }
        return {"error": "Stripe non configuré (STRIPE_SECRET_KEY manquante)"}

    mode = "subscription" if _is_subscription(meta) else "payment"
    plan_meta = meta.get("bw_forfait", plan_key)

    if _price_aligned(meta) and (meta.get("monthly") or meta.get("one_time") or meta.get("id")):
        line_items = [_line_item_from_price_id(meta)]
        via = "price_id"
    else:
        line_items = [_line_item_for_plan(meta)]
        via = "price_data"

    params = {
        "payment_method_types": ["card"],
        "mode": mode,
        "line_items": line_items,
        "metadata": {
            "client_id": client_id or "",
            "plan": plan_meta,
            "bw_forfait": plan_meta,
            "platform": "blackwayconnect",
            "displayed_amount": str(meta["amount"]),
        },
        "success_url": success_url or f"{RAILWAY_PUBLIC}/?paid=1&session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": cancel_url or f"{RAILWAY_PUBLIC}/forfaits?canceled=1",
        "allow_promotion_codes": True,
        "billing_address_collection": "required",
        "locale": "fr",
    }
    if client_email:
        params["customer_email"] = client_email

    try:
        session = stripe.checkout.Session.create(**params)
        return {"url": session.url, "session_id": session.id, "via": via, "amount": meta["amount"]}
    except Exception as e:
        logger.error(f"public checkout error: {e}")
        # Dernier recours : Payment Link
        if meta.get("payment_link"):
            return {
                "url": meta["payment_link"],
                "via": "payment_link_fallback",
                "warning": str(e),
            }
        return {"error": str(e)}


async def create_checkout_session(plan_key, client_email, client_id, mode="payment"):
    result = await create_public_checkout(
        plan_key,
        client_email=client_email,
        client_id=client_id,
    )
    return result


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
