"""
Paiements Stripe — BlackWay Connect (CANONICAL LOCK)
====================================================
Compte LIVE unique : acct_1TDZjzAG7HUL9Rtr (BlackWayConnect Inc)

Règle d'or :
  - Un seul catalogue PRICE_IDS pour le site marketing
  - payment_link + price_id DOIVENT matcher amount (affichage)
  - Ne jamais réutiliser les liens "launch_pricing" 69/129/199
  - Webhook canonical : https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe
  - (api.blackwayconnect.com/webhooks/stripe bloqué par Cloudflare challenge — ne pas réutiliser tant que CF n'est pas corrigé)
"""
import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

STRIPE_ACCOUNT_ID = "acct_1TDZjzAG7HUL9Rtr"
STRIPE_ACCOUNT_NAME = "BlackWayConnect Inc"
CANONICAL_WEBHOOK_URL = "https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe"

# Catalogue canonique — montants = ce que le site affiche (CAD)
# Créé / verrouillé 2026-08-09 (metadata canonical=true, tier=site_affiche)
PRICE_IDS = {
    "website_lead_launch": {
        "one_time": "price_1U2WJaAG7HUL9RtrT7JQxyFD",
        "id": "price_1U2WJaAG7HUL9RtrT7JQxyFD",
        "amount": 1995.00,
        "stripe_amount": 1995.00,
        "name": "Site haute conversion",
        "type": "activation",
        "bw_forfait": "website_lead_launch",
        "delai_jours": 21,
        "payment_link": "https://buy.stripe.com/7sY28qgyx5B10Rw04SeIw0M",
        "payment_link_id": "plink_1U2WJnAG7HUL9Rtr68g02qdc",
        "buyable": True,
        "canonical": True,
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
        "payment_link": "https://buy.stripe.com/eVq6oGdmld3tcAe8BoeIw0L",
        "payment_link_id": "plink_1U2WJnAG7HUL9RtrGhu8Gedz",
        "buyable": True,
        "canonical": True,
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
        "payment_link": "https://buy.stripe.com/00w9AS4PPbZpdEibNAeIw0N",
        "payment_link_id": "plink_1U2WJoAG7HUL9RtrPghkD6hV",
        "buyable": True,
        "canonical": True,
    },
    "grow_hub_launch": {
        "monthly": "price_1U2WJaAG7HUL9Rtr0rBQf7Cp",
        "id": "price_1U2WJaAG7HUL9Rtr0rBQf7Cp",
        "one_time": "price_1U2WJaAG7HUL9Rtr0rBQf7Cp",
        "amount": 299.00,
        "stripe_amount": 299.00,
        "name": "Grow Hub Launch",
        "type": "abonnement",
        "bw_forfait": "grow_hub_launch",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/4gM8wO8216F52ZEeZMeIw0J",
        "payment_link_id": "plink_1U2WJmAG7HUL9Rtr0rs8hTp5",
        "buyable": True,
        "canonical": True,
    },
    "grow_hub_growth": {
        "monthly": "price_1U2WJbAG7HUL9Rtry31Accba",
        "id": "price_1U2WJbAG7HUL9Rtry31Accba",
        "one_time": "price_1U2WJbAG7HUL9Rtry31Accba",
        "amount": 749.00,
        "stripe_amount": 749.00,
        "name": "Grow Hub Growth",
        "type": "abonnement",
        "bw_forfait": "grow_hub_growth",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/eVq9AScihfbBbwa5pceIw0I",
        "payment_link_id": "plink_1U2WJlAG7HUL9RtrFQjbB6P1",
        "buyable": True,
        "canonical": True,
    },
    "grow_hub_scale": {
        "monthly": "price_1U2WJaAG7HUL9RtrFwUU08yf",
        "id": "price_1U2WJaAG7HUL9RtrFwUU08yf",
        "one_time": "price_1U2WJaAG7HUL9RtrFwUU08yf",
        "amount": 1495.00,
        "stripe_amount": 1495.00,
        "name": "Grow Hub Scale",
        "type": "abonnement",
        "bw_forfait": "grow_hub_scale",
        "delai_jours": 7,
        "payment_link": "https://buy.stripe.com/bJedR81DD8Nd57M3h4eIw0K",
        "payment_link_id": "plink_1U2WJmAG7HUL9RtrKSoJ6eaI",
        "buyable": True,
        "canonical": True,
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
    unit_amount = int(round(float(meta["amount"]) * 100))
    product_data = {
        "name": meta["name"],
        "metadata": {
            "bw_forfait": meta.get("bw_forfait", ""),
            "platform": "blackwayconnect",
            "canonical": "true",
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
    meta = PRICE_IDS.get(plan_key)
    if not meta:
        return {"error": "Plan invalide"}

    # Prefer Payment Link when price-aligned (no secret key required)
    if _price_aligned(meta) and meta.get("payment_link"):
        return {
            "url": meta["payment_link"],
            "via": "payment_link",
            "amount": meta["amount"],
            "canonical": True,
        }

    if not stripe.api_key:
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
            "canonical": "true",
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
        if meta.get("payment_link"):
            return {"url": meta["payment_link"], "via": "payment_link_fallback", "warning": str(e)}
        return {"error": str(e)}


async def create_checkout_session(plan_key, client_email, client_id, mode="payment"):
    return await create_public_checkout(
        plan_key,
        client_email=client_email,
        client_id=client_id,
    )


async def create_subscription(client_email, price_id, client_id):
    return await create_checkout_session(price_id, client_email, client_id, mode="subscription")


async def audit_stripe_health():
    """Audit lecture seule — pour rassurer et détecter une dérive."""
    report = {
        "account_expected": STRIPE_ACCOUNT_ID,
        "account_name_expected": STRIPE_ACCOUNT_NAME,
        "canonical_webhook": CANONICAL_WEBHOOK_URL,
        "secret_key_configured": bool(stripe.api_key),
        "plans": [],
        "charges_count": None,
        "paid_sessions_count": None,
        "balance_available_cad": None,
        "warnings": [],
    }
    for key, meta in PRICE_IDS.items():
        report["plans"].append({
            "id": key,
            "amount": meta["amount"],
            "stripe_amount": meta.get("stripe_amount"),
            "aligned": _price_aligned(meta),
            "payment_link": meta.get("payment_link"),
            "buyable": meta.get("buyable"),
            "canonical": meta.get("canonical"),
        })
        if not _price_aligned(meta):
            report["warnings"].append(f"{key}: affichage {meta['amount']} ≠ stripe {meta.get('stripe_amount')}")

    if not stripe.api_key:
        report["warnings"].append("STRIPE_SECRET_KEY manquante sur ce runtime")
        return report

    try:
        bal = stripe.Balance.retrieve()
        cad = next((x for x in bal.available if x.currency == "cad"), None)
        report["balance_available_cad"] = (cad.amount / 100.0) if cad else 0
        charges = stripe.Charge.list(limit=100)
        report["charges_count"] = len(charges.data)
        sessions = stripe.checkout.Session.list(limit=100)
        report["paid_sessions_count"] = sum(1 for s in sessions.data if s.payment_status == "paid")
        # webhook check
        hooks = stripe.WebhookEndpoint.list(limit=100)
        canonical = [h for h in hooks.data if h.url == CANONICAL_WEBHOOK_URL]
        report["canonical_webhook_enabled"] = bool(canonical and canonical[0].status == "enabled")
        stale_enabled = [
            {"id": h.id, "url": h.url}
            for h in hooks.data
            if h.status == "enabled" and "blackway" not in (h.url or "").lower()
            and "api.blackwayconnect.com" not in (h.url or "")
        ]
        # Keep non-BW hooks listed but don't fail — multi-product account
        report["other_enabled_webhooks"] = stale_enabled
        if not report["canonical_webhook_enabled"]:
            report["warnings"].append("Webhook canonical api.blackwayconnect.com absent ou disabled")
    except Exception as e:
        report["warnings"].append(f"audit Stripe API: {e}")
    return report


async def handle_webhook_event(payload, sig_header):
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
