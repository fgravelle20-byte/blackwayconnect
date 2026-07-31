import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

PRICE_IDS = {
    "site_presence_google": {
        "one_time": "price_1TyIHGAG7HUL9RtrPWz5NYI3",
        "monthly": "price_1TxzdNAG7HUL9Rtrhlqo7JGF",
        "amount": 149500,
        "name": "Site & Présence Google",
    },
    "optimisation_elite": {
        "monthly": "price_Placeholder_495_Monthly",
        "amount": 49500,
        "name": "Optimisation Elite (Maintenance)",
    },
    "conversion_crm": {
        "one_time": "price_1TyIHGAG7HUL9RtrNKjKE19h",
        "amount": 699500,
        "name": "Conversion & CRM",
    },
    "automatisation_ia": {
        "one_time": "price_1TyIHFAG7HUL9RtrvhJ6ymFc",
        "amount": 499500,
        "name": "Automatisation & IA",
    },
}

BRAND_URL = "https://blackwayconnect.com"

def _resolve_plan_key(price_id: str) -> Optional[str]:
    for key, data in PRICE_IDS.items():
        if price_id in [data.get("one_time"), data.get("monthly"), data.get("annual")]:
            return key
    return None

async def create_checkout_session(price_id, client_email, client_id, mode="payment"):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=client_email,
            success_url=f"{BRAND_URL}/portal/payment-success",
            cancel_url=f"{BRAND_URL}/portal/payment-cancelled",
        )
        return {"url": session.url}
    except Exception as e: return {"error": str(e)}
