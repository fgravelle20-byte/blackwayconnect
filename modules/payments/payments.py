import os
import stripe
from typing import Optional
from utils.logger import logger

# Configuration Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Price IDs (production)
PRICE_IDS = {
    "site_presence_google": {
        "one_time": "price_1TyIHGAG7HUL9RtrPWz5NYI3",
        "monthly": "price_1TxzdNAG7HUL9Rtrhlqo7JGF",
        "annual": "price_1TxzfOAG7HUL9RtrrwnRgEkG",
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
        "monthly": "price_Placeholder_CRM_Monthly",
        "annual": "price_1TxzfOAG7HUL9RtrX5hi2NEU",
        "amount": 699500,
        "name": "Conversion & CRM",
    },
    "automatisation_ia": {
        "one_time": "price_1TyIHFAG7HUL9RtrvhJ6ymFc",
        "monthly": "price_Placeholder_IA_Monthly",
        "annual": "price_1TxzfPAG7HUL9RtrmJeoupUZ",
        "amount": 499500,
        "name": "Automatisation & IA",
    },
}

BRAND_URL = "https://blackwayconnect.com"


def _resolve_plan_key(price_id: str) -> Optional[str]:
    """Résout un price_id Stripe vers la clé de plan interne."""
    for key, data in PRICE_IDS.items():
        if price_id in [data.get("one_time"), data.get("monthly"), data.get("annual")]:
            return key
    return None


async def create_checkout_session(
    price_id: str,
    client_email: str,
    client_id: str,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
    mode: str = "payment",
) -> dict:
    """Crée une Stripe Checkout Session avec plan_key dans les metadata."""
    plan_key = _resolve_plan_key(price_id) or "unknown"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=client_email,
            metadata={
                "client_id": client_id,
                "plan_key": plan_key,
                "platform": "blackwayconnect",
            },
            success_url=success_url or f"{BRAND_URL}/portal/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=cancel_url or f"{BRAND_URL}/portal/payment-cancelled",
        )
        logger.info(f"Checkout session created: {session.id} for {client_email} [{plan_key}]")
        return {"session_id": session.id, "url": session.url, "status": "created"}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        return {"status": "error", "message": str(e)}


async def handle_webhook_event(payload: bytes, sig_header: str) -> dict:
    """
    Traite les webhooks Stripe.
    Sur checkout.session.completed: crée automatiquement une tâche Asana via delivery.py
    """
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.error(f"Webhook signature invalide: {e}")
        return {"status": "error", "message": "Signature invalide"}

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        logger.info(f"Paiement réussi: {data['id']} - {data.get('customer_email')}")

        # DELIVERY AUTOMATIQUE - Crée tâche Asana
        from delivery import on_payment_success
        delivery_result = await on_payment_success(data)
        logger.info(f"Delivery Asana: {delivery_result.get('status')} | {delivery_result.get('task_url', 'N/A')}")

        return {"status": "processed", "event": event_type, "delivery": delivery_result}

    elif event_type == "payment_intent.payment_failed":
        logger.warning(f"Paiement échoué: {data['id']}")
        return {"status": "processed", "event": event_type}

    elif event_type == "customer.subscription.deleted":
        logger.info(f"Abonnement annulé: {data['id']}")
        return {"status": "processed", "event": event_type}

    elif event_type == "invoice.payment_succeeded":
        logger.info(f"Paiement récurrent réussi: {data['id']}")
        return {"status": "processed", "event": event_type}

    return {"status": "ignored", "event": event_type}


async def get_payment_history(client_email: str, limit: int = 10) -> list:
    """Récupère l'historique de paiements d'un client via Stripe."""
    try:
        customers = stripe.Customer.list(email=client_email, limit=1)
        if not customers.data:
            return []
        customer = customers.data[0]
        charges = stripe.Charge.list(customer=customer.id, limit=limit)
        return [
            {"id": c.id, "amount": c.amount / 100, "currency": c.currency, "status": c.status, "created": c.created, "description": c.description}
            for c in charges.data
        ]
    except stripe.error.StripeError as e:
        logger.error(f"Erreur historique paiements: {e}")
        return []


async def create_subscription(client_email: str, price_id: str, client_id: str) -> dict:
    """Crée un abonnement récurrent Stripe."""
    try:
        customers = stripe.Customer.list(email=client_email, limit=1)
        if customers.data:
            customer = customers.data[0]
        else:
            customer = stripe.Customer.create(email=client_email, metadata={"client_id": client_id, "platform": "blackwayconnect"})
        session = stripe.checkout.Session.create(
            customer=customer.id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{BRAND_URL}/portal/subscription-active?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{BRAND_URL}/portal/subscription-cancelled",
        )
        return {"session_id": session.id, "url": session.url, "status": "created"}
    except stripe.error.StripeError as e:
        logger.error(f"Erreur création abonnement: {e}")
        return {"status": "error", "message": str(e)}
