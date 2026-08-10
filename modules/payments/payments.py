"""
Paiements Stripe — BlackWay Connect (CANONICAL LOCK)
====================================================
Compte unique : acct_1U1zzdEWku3DPVf3

Règle d'or :
  - Un seul catalogue PRICE_IDS pour le site marketing
  - TOUS les forfaits = abonnements mensuel OU annuel
  - Annuel = 12 % de rabais sur (mensuel × 12)
  - payment_link + price_id DOIVENT matcher amount (affichage)
  - Ancien compte acct_1TDZjzAG7HUL9Rtr = FERMÉ / ne plus utiliser
  - Provisionner via : scripts/provision-stripe-king-catalog.py
  - Webhook canonical : https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe
"""
import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

STRIPE_ACCOUNT_ID = "acct_1U1zzdEWku3DPVf3"
STRIPE_ACCOUNT_NAME = "BlackWayConnect"
CANONICAL_WEBHOOK_URL = "https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe"

ANNUAL_DISCOUNT = 0.12  # 12 % si engagement 12 mois


def annual_from_monthly(monthly: float) -> float:
    """Montant facturé une fois par an (CAD), rabais 12 % sur 12 × mensuel."""
    return round(float(monthly) * 12 * (1.0 - ANNUAL_DISCOUNT), 2)


def _plan(
    *,
    name: str,
    monthly: float,
    bw_forfait: str,
    delai_jours: int,
    category: str,
):
    annual = annual_from_monthly(monthly)
    return {
        "name": name,
        "type": "abonnement",
        "category": category,
        "bw_forfait": bw_forfait,
        "delai_jours": delai_jours,
        "amount": monthly,
        "amount_monthly": monthly,
        "amount_annual": annual,
        "stripe_amount": monthly,
        "stripe_amount_monthly": monthly,
        "stripe_amount_annual": annual,
        "monthly": None,
        "annual": None,
        "id": None,
        "one_time": None,
        "payment_link": None,
        "payment_link_monthly": None,
        "payment_link_annual": None,
        "payment_link_id": None,
        "payment_link_id_monthly": None,
        "payment_link_id_annual": None,
        "buyable": True,
        "canonical": True,
        "billing_options": ["monthly", "annual"],
        "annual_discount": ANNUAL_DISCOUNT,
    }


# Tous les forfaits KING = abonnements mensuel / annuel (−12 %)
PRICE_IDS = {
    "grow_hub_launch": _plan(
        name="Grow Hub Launch",
        monthly=299.00,
        bw_forfait="grow_hub_launch",
        delai_jours=7,
        category="grow_hub",
    ),
    "grow_hub_growth": _plan(
        name="Grow Hub Growth",
        monthly=749.00,
        bw_forfait="grow_hub_growth",
        delai_jours=7,
        category="grow_hub",
    ),
    "grow_hub_scale": _plan(
        name="Grow Hub Scale",
        monthly=1495.00,
        bw_forfait="grow_hub_scale",
        delai_jours=7,
        category="grow_hub",
    ),
    "website_lead_launch": _plan(
        name="Site haute conversion",
        monthly=1995.00,
        bw_forfait="website_lead_launch",
        delai_jours=21,
        category="activation",
    ),
    "revenue_system": _plan(
        name="Système de revenus complet",
        monthly=4995.00,
        bw_forfait="revenue_system",
        delai_jours=35,
        category="activation",
    ),
    "ai_scale": _plan(
        name="Application mobile iOS & Android",
        monthly=7995.00,
        bw_forfait="ai_scale",
        delai_jours=45,
        category="activation",
    ),
}

BRAND_URL = os.environ.get("BRAND_URL", "https://blackwayconnect.com")
RAILWAY_PUBLIC = os.environ.get(
    "RAILWAY_PUBLIC_DOMAIN",
    "https://dependable-spirit-production.up.railway.app",
)


def normalize_billing(billing: Optional[str]) -> str:
    b = (billing or "monthly").strip().lower()
    if b in ("annual", "annuel", "year", "yearly", "annee", "année"):
        return "annual"
    return "monthly"


def _price_aligned(meta: dict, billing: str = "monthly") -> bool:
    if billing == "annual":
        return abs(
            float(meta["amount_annual"])
            - float(meta.get("stripe_amount_annual", meta["amount_annual"]))
        ) < 0.01
    return abs(
        float(meta["amount_monthly"])
        - float(meta.get("stripe_amount_monthly", meta["amount_monthly"]))
    ) < 0.01


def _display_amount(meta: dict, billing: str) -> float:
    return float(meta["amount_annual"] if billing == "annual" else meta["amount_monthly"])


def _payment_link_for(meta: dict, billing: str) -> Optional[str]:
    if billing == "annual":
        return meta.get("payment_link_annual")
    return meta.get("payment_link_monthly") or meta.get("payment_link")


def _price_id_for(meta: dict, billing: str) -> Optional[str]:
    if billing == "annual":
        return meta.get("annual")
    return meta.get("monthly") or meta.get("id")


def _line_item_for_plan(meta: dict, billing: str) -> dict:
    amount = _display_amount(meta, billing)
    unit_amount = int(round(amount * 100))
    product_data = {
        "name": meta["name"],
        "metadata": {
            "bw_forfait": meta.get("bw_forfait", ""),
            "platform": "blackwayconnect",
            "canonical": "true",
            "billing": billing,
        },
    }
    recurring = {"interval": "year"} if billing == "annual" else {"interval": "month"}
    return {
        "price_data": {
            "currency": "cad",
            "unit_amount": unit_amount,
            "recurring": recurring,
            "product_data": product_data,
        },
        "quantity": 1,
    }


def _line_item_from_price_id(meta: dict, billing: str) -> Optional[dict]:
    price_id = _price_id_for(meta, billing)
    if not price_id:
        return None
    return {"price": price_id, "quantity": 1}


async def create_public_checkout(
    plan_key: str,
    client_email: Optional[str] = None,
    client_id: Optional[str] = None,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
    billing: Optional[str] = "monthly",
):
    meta = PRICE_IDS.get(plan_key)
    if not meta:
        return {"error": "Plan invalide"}

    billing = normalize_billing(billing)
    amount = _display_amount(meta, billing)
    link = _payment_link_for(meta, billing)

    if _price_aligned(meta, billing) and link:
        return {
            "url": link,
            "via": "payment_link",
            "amount": amount,
            "billing": billing,
            "canonical": True,
        }

    if not stripe.api_key:
        return {"error": "Stripe non configuré (STRIPE_SECRET_KEY manquante)"}

    plan_meta = meta.get("bw_forfait", plan_key)
    from_price = _line_item_from_price_id(meta, billing) if _price_aligned(meta, billing) else None
    if from_price:
        line_items = [from_price]
        via = "price_id"
    else:
        line_items = [_line_item_for_plan(meta, billing)]
        via = "price_data"

    params = {
        "mode": "subscription",
        "line_items": line_items,
        "metadata": {
            "client_id": client_id or "",
            "plan": plan_meta,
            "bw_forfait": plan_meta,
            "platform": "blackwayconnect",
            "canonical": "true",
            "billing": billing,
            "annual_discount": str(ANNUAL_DISCOUNT) if billing == "annual" else "0",
            "displayed_amount": str(amount),
        },
        "subscription_data": {
            "metadata": {
                "bw_forfait": plan_meta,
                "billing": billing,
                "platform": "blackwayconnect",
                "canonical": "true",
            }
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
        return {
            "url": session.url,
            "session_id": session.id,
            "via": via,
            "amount": amount,
            "billing": billing,
        }
    except Exception as e:
        logger.error(f"public checkout error: {e}")
        if link:
            return {
                "url": link,
                "via": "payment_link_fallback",
                "warning": str(e),
                "billing": billing,
            }
        return {"error": str(e)}


async def create_checkout_session(
    plan_key, client_email, client_id, mode="subscription", billing="monthly"
):
    return await create_public_checkout(
        plan_key,
        client_email=client_email,
        client_id=client_id,
        billing=billing,
    )


async def create_subscription(client_email, price_id, client_id, billing="monthly"):
    if price_id in PRICE_IDS:
        return await create_public_checkout(
            price_id,
            client_email=client_email,
            client_id=client_id,
            billing=billing,
        )
    return await create_checkout_session(
        price_id, client_email, client_id, billing=billing
    )


async def audit_stripe_health():
    report = {
        "account_expected": STRIPE_ACCOUNT_ID,
        "account_name_expected": STRIPE_ACCOUNT_NAME,
        "canonical_webhook": CANONICAL_WEBHOOK_URL,
        "secret_key_configured": bool(stripe.api_key),
        "annual_discount": ANNUAL_DISCOUNT,
        "plans": [],
        "charges_count": None,
        "paid_sessions_count": None,
        "balance_available_cad": None,
        "warnings": [],
    }
    for key, meta in PRICE_IDS.items():
        report["plans"].append({
            "id": key,
            "type": meta["type"],
            "category": meta.get("category"),
            "amount_monthly": meta["amount_monthly"],
            "amount_annual": meta["amount_annual"],
            "aligned_monthly": _price_aligned(meta, "monthly"),
            "aligned_annual": _price_aligned(meta, "annual"),
            "payment_link_monthly": meta.get("payment_link_monthly"),
            "payment_link_annual": meta.get("payment_link_annual"),
            "buyable": meta.get("buyable"),
            "canonical": meta.get("canonical"),
            "billing_options": meta.get("billing_options"),
        })

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
        report["paid_sessions_count"] = sum(
            1 for s in sessions.data if s.payment_status == "paid"
        )
        hooks = stripe.WebhookEndpoint.list(limit=100)
        canonical = [h for h in hooks.data if h.url == CANONICAL_WEBHOOK_URL]
        report["canonical_webhook_enabled"] = bool(
            canonical and canonical[0].status == "enabled"
        )
        report["other_enabled_webhooks"] = [
            {"id": h.id, "url": h.url}
            for h in hooks.data
            if h.status == "enabled"
            and h.url != CANONICAL_WEBHOOK_URL
            and "blackway" not in (h.url or "").lower()
            and "api.blackwayconnect.com" not in (h.url or "")
        ]
        if not report["canonical_webhook_enabled"]:
            report["warnings"].append(
                "Webhook canonical blackway-pipe.workers.dev absent ou disabled"
            )
    except Exception as e:
        report["warnings"].append(f"audit Stripe API: {e}")
    return report


async def handle_webhook_event(payload, sig_header):
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
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
                client_email=session.get("customer_details", {}).get("email")
                or session.get("customer_email")
                or "",
                client_id=session.get("metadata", {}).get("client_id", ""),
                plan_key=session.get("metadata", {}).get("bw_forfait")
                or session.get("metadata", {}).get("plan", ""),
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
                    "billing": s.metadata.get("billing"),
                })
            if len(out) >= limit:
                break
        return out
    except Exception as e:
        logger.error(f"payment history error: {e}")
        return []
