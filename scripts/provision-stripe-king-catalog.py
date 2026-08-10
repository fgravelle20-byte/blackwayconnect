#!/usr/bin/env python3
"""
Provision the 6 KING products / prices / payment links + webhook
on the sole Stripe account: acct_1U1zzdEWku3DPVf3.

Usage:
  export STRIPE_SECRET_KEY=sk_test_...   # or sk_live_...
  python3 scripts/provision-stripe-king-catalog.py

Writes:
  artifacts/STRIPE-KING-CATALOG.json
  and prints a Python snippet to paste into modules/payments/payments.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    import stripe
except ImportError:
    print("pip install stripe", file=sys.stderr)
    sys.exit(1)

EXPECTED_ACCOUNT = "acct_1U1zzdEWku3DPVf3"
CURRENCY = "cad"
SUCCESS_URL = "https://dependable-spirit-production.up.railway.app/?paid=1"
CANCEL_URL = "https://dependable-spirit-production.up.railway.app/forfaits?canceled=1"
WEBHOOK_URL = "https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe"
WEBHOOK_EVENTS = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
    "invoice.paid",
    "invoice.payment_failed",
]

# Canonical KING catalogue (display amounts CAD)
CATALOG = [
    {
        "key": "grow_hub_launch",
        "name": "Grow Hub Launch",
        "amount": 29900,
        "type": "abonnement",
        "bw_forfait": "grow_hub_launch",
        "delai_jours": 7,
    },
    {
        "key": "grow_hub_growth",
        "name": "Grow Hub Growth",
        "amount": 74900,
        "type": "abonnement",
        "bw_forfait": "grow_hub_growth",
        "delai_jours": 7,
    },
    {
        "key": "grow_hub_scale",
        "name": "Grow Hub Scale",
        "amount": 149500,
        "type": "abonnement",
        "bw_forfait": "grow_hub_scale",
        "delai_jours": 7,
    },
    {
        "key": "website_lead_launch",
        "name": "Site haute conversion",
        "amount": 199500,
        "type": "activation",
        "bw_forfait": "website_lead_launch",
        "delai_jours": 21,
    },
    {
        "key": "revenue_system",
        "name": "Système de revenus complet",
        "amount": 499500,
        "type": "activation",
        "bw_forfait": "revenue_system",
        "delai_jours": 35,
    },
    {
        "key": "ai_scale",
        "name": "Application mobile iOS & Android",
        "amount": 799500,
        "type": "activation",
        "bw_forfait": "ai_scale",
        "delai_jours": 45,
    },
]


def require_key() -> str:
    key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if not key:
        print("STRIPE_SECRET_KEY is required", file=sys.stderr)
        sys.exit(2)
    if key.startswith("sk_live_") or key.startswith("rk_live_"):
        mode = "live"
    elif key.startswith("sk_test_") or key.startswith("rk_test_"):
        mode = "test"
    else:
        print("Unexpected key prefix — expected sk_/rk_ test or live", file=sys.stderr)
        sys.exit(2)
    return mode


def assert_account() -> dict:
    acct = stripe.Account.retrieve()
    if acct.id != EXPECTED_ACCOUNT:
        print(
            f"Refusing to provision: connected to {acct.id} ({acct.get('settings', {}).get('dashboard', {}).get('display_name')}), "
            f"expected {EXPECTED_ACCOUNT}",
            file=sys.stderr,
        )
        sys.exit(3)
    return acct


def find_product_by_forfait(bw_forfait: str):
    products = stripe.Product.list(limit=100, active=True)
    for p in products.auto_paging_iter():
        meta = p.get("metadata") or {}
        if meta.get("bw_forfait") == bw_forfait and meta.get("canonical") == "true":
            return p
    return None


def ensure_product(item: dict):
    existing = find_product_by_forfait(item["bw_forfait"])
    metadata = {
        "bw_forfait": item["bw_forfait"],
        "platform": "blackwayconnect",
        "canonical": "true",
        "delai_jours": str(item["delai_jours"]),
        "type": item["type"],
    }
    if existing:
        return stripe.Product.modify(
            existing.id,
            name=item["name"],
            metadata=metadata,
        )
    return stripe.Product.create(
        name=item["name"],
        metadata=metadata,
    )


def find_matching_price(product_id: str, item: dict):
    prices = stripe.Price.list(product=product_id, active=True, limit=100)
    for price in prices.auto_paging_iter():
        recurring = price.get("recurring")
        want_recurring = item["type"] == "abonnement"
        if want_recurring:
            if not recurring or recurring.get("interval") != "month":
                continue
        else:
            if recurring:
                continue
        if price.unit_amount == item["amount"] and price.currency == CURRENCY:
            return price
    return None


def ensure_price(product_id: str, item: dict):
    existing = find_matching_price(product_id, item)
    if existing:
        return existing
    params = {
        "product": product_id,
        "currency": CURRENCY,
        "unit_amount": item["amount"],
        "metadata": {
            "bw_forfait": item["bw_forfait"],
            "canonical": "true",
        },
    }
    if item["type"] == "abonnement":
        params["recurring"] = {"interval": "month"}
    return stripe.Price.create(**params)


def find_payment_link(price_id: str):
    links = stripe.PaymentLink.list(limit=100, active=True)
    for link in links.auto_paging_iter():
        # PaymentLink.list does not expand line_items; retrieve each candidate lightly
        full = stripe.PaymentLink.retrieve(link.id, expand=["line_items"])
        items = (full.get("line_items") or {}).get("data") or []
        if len(items) == 1 and items[0].get("price") and items[0]["price"].get("id") == price_id:
            return full
    return None


def ensure_payment_link(price_id: str, item: dict):
    existing = find_payment_link(price_id)
    mode_meta = {
        "bw_forfait": item["bw_forfait"],
        "platform": "blackwayconnect",
        "canonical": "true",
    }
    if existing:
        return stripe.PaymentLink.modify(
            existing.id,
            metadata=mode_meta,
            after_completion={
                "type": "redirect",
                "redirect": {"url": SUCCESS_URL},
            },
        )
    params = {
        "line_items": [{"price": price_id, "quantity": 1}],
        "metadata": mode_meta,
        "after_completion": {
            "type": "redirect",
            "redirect": {"url": SUCCESS_URL},
        },
        "allow_promotion_codes": True,
        "billing_address_collection": "required",
    }
    return stripe.PaymentLink.create(**params)


def ensure_webhook():
    hooks = stripe.WebhookEndpoint.list(limit=100)
    for h in hooks.auto_paging_iter():
        if h.url == WEBHOOK_URL:
            if h.status != "enabled":
                return stripe.WebhookEndpoint.modify(h.id, disabled=False, enabled_events=WEBHOOK_EVENTS), False
            # Cannot re-read secret; return existing without secret
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
    display = getattr(acct, "business_profile", None)
    display_name = None
    if display:
        display_name = getattr(display, "name", None)
    if not display_name:
        display_name = acct.get("settings", {}).get("dashboard", {}).get("display_name") or "BlackWayConnect"

    print(f"Account OK: {acct.id} ({display_name}) mode={mode}")

    results = {
        "account_id": acct.id,
        "account_name": display_name,
        "mode": mode,
        "webhook_url": WEBHOOK_URL,
        "plans": {},
    }

    for item in CATALOG:
        product = ensure_product(item)
        price = ensure_price(product.id, item)
        link = ensure_payment_link(price.id, item)
        plan = {
            "key": item["key"],
            "name": item["name"],
            "amount": item["amount"] / 100.0,
            "type": item["type"],
            "bw_forfait": item["bw_forfait"],
            "delai_jours": item["delai_jours"],
            "product_id": product.id,
            "price_id": price.id,
            "payment_link_id": link.id,
            "payment_link": link.url,
        }
        results["plans"][item["key"]] = plan
        print(f"  {item['key']}: {price.id} → {link.url}")

    hook, created_new = ensure_webhook()
    results["webhook"] = {
        "id": hook.id,
        "url": hook.url,
        "status": hook.status,
        "secret": getattr(hook, "secret", None) if created_new else None,
        "secret_note": "whsec only returned on create — copy now if present"
        if created_new
        else "existing endpoint — rotate secret in Dashboard if needed",
    }
    print(f"Webhook: {hook.id} status={hook.status} new={created_new}")
    if results["webhook"]["secret"]:
        print(f"STRIPE_WEBHOOK_SECRET={results['webhook']['secret']}")

    out = Path("artifacts/STRIPE-KING-CATALOG.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {out}")

    # Emit payments.py PRICE_IDS block
    print("\n# --- paste into modules/payments/payments.py PRICE_IDS ---\n")
    print("PRICE_IDS = {")
    order = [
        "website_lead_launch",
        "revenue_system",
        "ai_scale",
        "grow_hub_launch",
        "grow_hub_growth",
        "grow_hub_scale",
    ]
    for key in order:
        p = results["plans"][key]
        is_sub = p["type"] == "abonnement"
        print(f'    "{key}": {{')
        if is_sub:
            print(f'        "monthly": "{p["price_id"]}",')
            print(f'        "id": "{p["price_id"]}",')
            print(f'        "one_time": "{p["price_id"]}",')
        else:
            print(f'        "one_time": "{p["price_id"]}",')
            print(f'        "id": "{p["price_id"]}",')
        print(f'        "amount": {p["amount"]:.2f},')
        print(f'        "stripe_amount": {p["amount"]:.2f},')
        print(f'        "name": {json.dumps(p["name"], ensure_ascii=False)},')
        print(f'        "type": "{p["type"]}",')
        print(f'        "bw_forfait": "{p["bw_forfait"]}",')
        print(f'        "delai_jours": {p["delai_jours"]},')
        print(f'        "payment_link": "{p["payment_link"]}",')
        print(f'        "payment_link_id": "{p["payment_link_id"]}",')
        print(f'        "product_id": "{p["product_id"]}",')
        print('        "buyable": True,')
        print('        "canonical": True,')
        print("    },")
    print("}")


if __name__ == "__main__":
    main()
