import os
import stripe
from typing import Optional
from utils.logger import logger

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# MASTER PRICING - 10 FORFAITS
PRICE_IDS = {
    "site_blitz": {"id": "price_1TyIHGAG7HUL9RtrPWz5NYI3", "amount": 1495.00, "name": "Site & Présence Google (Blitz)"},
    "ia_performance": {"id": "price_1TyIHFAG7HUL9RtrvhJ6ymFc", "amount": 4995.00, "name": "IA Ghost Performance"},
    "crm_elite": {"id": "price_1TyIHGAG7HUL9RtrNKjKE19h", "amount": 6995.00, "name": "CRM Elite & Conversion"},
    "site_annuel": {"id": "price_1TxzfOAG7HUL9RtrrwnRgEkG", "amount": 3000.00, "name": "Site & Présence (Annuel)"},
    "ia_annuel": {"id": "price_1TxzfPAG7HUL9RtrmJeoupUZ", "amount": 15000.00, "name": "IA Ghost (Annuel)"},
    "crm_annuel": {"id": "price_1TxzfOAG7HUL9RtrX5hi2NEU", "amount": 9000.00, "name": "CRM Elite (Annuel)"},
    "site_mensuel": {"id": "price_1TxzdNAG7HUL9Rtrhlqo7JGF", "amount": 250.00, "name": "Site & Présence (Mensuel)"},
    "unexa_pro": {"id": "price_1UtnInm4eBlM5WOh", "amount": 499.00, "name": "UNEXA Pro"},
    "unexa_business": {"id": "price_1UtnIaXrrRQVdEC7", "amount": 999.00, "name": "UNEXA Business"},
    "unexa_starter": {"id": "price_1UtnIYksQqIPmLsk", "amount": 199.00, "name": "UNEXA Starter"},
}

BRAND_URL = "https://blackwayconnect.com"

async def create_checkout_session(price_id, client_email, client_id, mode="payment"):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=client_email,
            metadata={"client_id": client_id, "platform": "blackwayconnect"},
            success_url=f"{BRAND_URL}/app?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{BRAND_URL}",
        )
        return {"url": session.url}
    except Exception as e: return {"error": str(e)}
