#!/usr/bin/env python3
"""
Provision ALL 6 KING forfaits as subscriptions on acct_1U1zzdEWku3DPVf3:

  - Each product: monthly price + annual price (−12 %)
  - Payment Link for each price
  - Canonical webhook

Usage:
  export STRIPE_SECRET_KEY=sk_test_...
  .venv/bin/python scripts/provision-stripe-king-catalog.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    import stripe
except ImportError:
    print("pip install stripe (use .venv)", file=sys.stderr)
    sys.exit(1)

EXPECTED_ACCOUNT = "acct_1U1zzdEWku3DPVf3"
CURRENCY = "cad"
ANNUAL_DISCOUNT = 0.12
SUCCESS_URL = "https://dependable-spirit-production.up.railway.app/?paid=1"
WEBHOOK_URL = "https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe"
WEBHOOK_EVENTS = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
]

CATALOG = [
    {"key": "grow_hub_launch", "name": "Grow Hub Launch", "monthly": 299.00, "delai_jours": 7, "category": "grow_hub"},
    {"key": "grow_hub_growth", "name": "Grow Hub Growth", "monthly": 749.00, "delai_jours": 7, "category": "grow_hub"},
    {"key": "grow_hub_scale", "name": "Grow Hub Scale", "monthly": 1495.00, "delai_jours": 7, "category": "grow_hub"},
    {"key": "website_lead_launch", "name": "Site haute conversion", "monthly": 1995.00, "delai_jours": 21, "category": "activation"},
    {"key": "revenue_system", "name": "Système de revenus complet", "monthly": 4995.00, "delai_jours": 35, "category": "activation"},
    {"key": "ai_scale", "name": "Application mobile iOS & Android", "monthly": 7995.00, "delai_jours": 45, "category": "activation"},
]


def annual_amount(monthly: float) -> float:
    return round(float(monthly) * 12 * (1.0 - ANNUAL_DISCOUNT), 2)


def cents(amount: float) -> int:
    return int(round(float(amount) * 100))


def require_key() -> str:
    key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if not key:
        print("STRIPE_SECRET_KEY is required", file=sys.stderr)
        sys.exit(2)
    if key.startswith(("sk_live_", "rk_live_")):
        return "live"
    if key.startswith(("sk_test_", "rk_test_")):
        return "test"
    print("Unexpected key prefix", file=sys.stderr)
    sys.exit(2)


def assert_account():
    acct = stripe.Account.retrieve()
    if acct.id != EXPECTED_ACCOUNT:
        print(f"Refusing: connected to {acct.id}, expected {EXPECTED_ACCOUNT}", file=sys.stderr)
        sys.exit(3)
    return acct


def find_product(bw_forfait: str):
    for p in stripe.Product.list(limit=100, active=True).auto_paging_iter():
        meta = p.get("metadata") or {}
        if meta.get("bw_forfait") == bw_forfait and meta.get("canonical") == "true":
            return p
    return None


def ensure_product(item: dict):
    metadata = {
        "bw_forfait": item["key"],
        "platform": "blackwayconnect",
        "canonical": "true",
        "delai_jours": str(item["delai_jours"]),
        "category": item["category"],
        "type": "abonnement",
    }
    existing = find_product(item["key"])
    if existing:
        return stripe.Product.modify(existing.id, name=item["name"], metadata=metadata)
    return stripe.Product.create(name=item["name"], metadata=metadata)


def find_price(product_id: str, unit_amount: int, interval: str):
    for price in stripe.Price.list(product=product_id, active=True, limit=100).auto_paging_iter():
        rec = price.get("recurring") or {}
        if (
            price.unit_amount == unit_amount
            and price.currency == CURRENCY
            and rec.get("interval") == interval
        ):
            return price
    return None


def ensure_price(product_id: str, item: dict, billing: str):
    amount = annual_amount(item["monthly"]) if billing == "annual" else float(item["monthly"])
    interval = "year" if billing == "annual" else "month"
    unit = cents(amount)
    existing = find_price(product_id, unit, interval)
    if existing:
        return existing, amount
    price = stripe.Price.create(
        product=product_id,
        currency=CURRENCY,
        unit_amount=unit,
        recurring={"interval": interval},
        metadata={
            "bw_forfait": item["key"],
            "canonical": "true",
            "billing": billing,
            "annual_discount": str(ANNUAL_DISCOUNT) if billing == "annual" else "0",
        },
    )
    return price, amount


def find_payment_link(price_id: str):
    for link in stripe.PaymentLink.list(limit=100, active=True).auto_paging_iter():
        full = stripe.PaymentLink.retrieve(link.id, expand=["line_items"])
        items = (full.get("line_items") or {}).get("data") or []
        if len(items) == 1 and items[0].get("price") and items[0]["price"].get("id") == price_id:
            return full
    return None


def ensure_payment_link(price_id: str, item: dict, billing: str):
    existing = find_payment_link(price_id)
    metadata = {
        "bw_forfait": item["key"],
        "platform": "blackwayconnect",
        "canonical": "true",
        "billing": billing,
    }
    if existing:
        return stripe.PaymentLink.modify(
            existing.id,
            metadata=metadata,
            after_completion={"type": "redirect", "redirect": {"url": SUCCESS_URL}},
        )
    return stripe.PaymentLink.create(
        line_items=[{"price": price_id, "quantity": 1}],
        metadata=metadata,
        after_completion={"type": "redirect", "redirect": {"url": SUCCESS_URL}},
        allow_promotion_codes=True,
        billing_address_collection="required",
    )


def ensure_webhook():
    for h in stripe.WebhookEndpoint.list(limit=100).auto_paging_iter():
        if h.url == WEBHOOK_URL:
            if h.status != "enabled":
                return stripe.WebhookEndpoint.modify(
                    h.id, disabled=False, enabled_events=WEBHOOK_EVENTS
                ), False
            return h, False
    created = stripe.WebhookEndpoint.create(
        url=WEBHOOK_URL,
        enabled_events=WEBHOOK_EVENTS,
        description="BlackWayConnect KING canonical",
        metadata={"platform": "blackwayconnect", "canonical": "true"},
    )
    return created, True


def main():
    mode = require_key()
    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    acct = assert_account()
    print(f"Account OK: {acct.id} mode={mode} annual_discount={int(ANNUAL_DISCOUNT*100)}%")

    results = {
        "account_id": acct.id,
        "mode": mode,
        "annual_discount": ANNUAL_DISCOUNT,
        "webhook_url": WEBHOOK_URL,
        "plans": {},
    }

    for item in CATALOG:
        product = ensure_product(item)
        mo_price, mo_amt = ensure_price(product.id, item, "monthly")
        yr_price, yr_amt = ensure_price(product.id, item, "annual")
        mo_link = ensure_payment_link(mo_price.id, item, "monthly")
        yr_link = ensure_payment_link(yr_price.id, item, "annual")
        results["plans"][item["key"]] = {
            "type": "abonnement",
            "category": item["category"],
            "name": item["name"],
            "amount_monthly": mo_amt,
            "amount_annual": yr_amt,
            "product_id": product.id,
            "price_id_monthly": mo_price.id,
            "price_id_annual": yr_price.id,
            "payment_link_monthly": mo_link.url,
            "payment_link_annual": yr_link.url,
            "payment_link_id_monthly": mo_link.id,
            "payment_link_id_annual": yr_link.id,
        }
        print(f"  {item['key']}: mo={mo_amt} / yr={yr_amt} (−12%)")

    hook, created_new = ensure_webhook()
    results["webhook"] = {
        "id": hook.id,
        "url": hook.url,
        "status": hook.status,
        "secret": getattr(hook, "secret", None) if created_new else None,
    }
    print(f"Webhook: {hook.id} new={created_new}")
    if results["webhook"]["secret"]:
        print(f"STRIPE_WEBHOOK_SECRET={results['webhook']['secret']}")

    out = Path("artifacts/STRIPE-KING-CATALOG.json")
    out.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
