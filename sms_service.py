"""
BlackWayConnect - SMS Service (Twilio)
Module placeholder pour l'envoi de SMS et la gestion des conversations.

CONFIGURATION REQUISE (variables d'environnement):
- TWILIO_ACCOUNT_SID: SID du compte Twilio
- TWILIO_AUTH_TOKEN: Token d'authentification Twilio
- TWILIO_PHONE_NUMBER: Numéro Twilio (format E.164, ex: +15145551234)
- TWILIO_MESSAGING_SERVICE_SID: (optionnel) SID du service de messaging

NOTE: Ce module est un placeholder. Les secrets Twilio ne sont pas encore configurés.
      Toutes les fonctions retournent un statut 'not_configured' tant que les
      variables d'environnement ne sont pas définies.
"""

import os
from typing import Optional, List
from datetime import datetime
from utils.logger import logger


TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
TWILIO_MESSAGING_SERVICE_SID = os.environ.get("TWILIO_MESSAGING_SERVICE_SID")


def _is_configured() -> bool:
    return all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER])


def _get_twilio_client():
    if not _is_configured():
        logger.warning("Twilio non configuré")
        return None
    try:
        from twilio.rest import Client
        return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except ImportError:
        logger.error("twilio package not installed")
        return None
    except Exception as e:
        logger.error(f"Twilio init error: {e}")
        return None


async def send_sms(to_number: str, message: str, media_url: Optional[str] = None) -> dict:
    if not _is_configured():
        return {"status": "not_configured", "message": "Twilio non configuré", "required_vars": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]}
    client = _get_twilio_client()
    if not client:
        return {"status": "error", "message": "Impossible d'initialiser le client Twilio"}
    try:
        kwargs = {"body": message, "from_": TWILIO_PHONE_NUMBER, "to": to_number}
        if TWILIO_MESSAGING_SERVICE_SID:
            kwargs["messaging_service_sid"] = TWILIO_MESSAGING_SERVICE_SID
        if media_url:
            kwargs["media_url"] = [media_url]
        sms = client.messages.create(**kwargs)
        logger.info(f"SMS envoyé: {sms.sid} -> {to_number}")
        return {"status": "sent", "message_sid": sms.sid, "to": to_number, "segments": sms.num_segments}
    except Exception as e:
        logger.error(f"Erreur envoi SMS: {e}")
        return {"status": "error", "message": str(e)}


async def send_bulk_sms(recipients: List[str], message: str) -> dict:
    if not _is_configured():
        return {"status": "not_configured", "message": "Twilio non configuré"}
    results = {"sent": 0, "failed": 0, "errors": []}
    for number in recipients:
        result = await send_sms(number, message)
        if result["status"] == "sent":
            results["sent"] += 1
        else:
            results["failed"] += 1
            results["errors"].append({"number": number, "error": result.get("message")})
    return results


async def send_appointment_reminder(client_phone: str, client_name: str, appointment_date: str, service_type: str) -> dict:
    msg = f"Bonjour {client_name}! Rappel: votre rendez-vous BlackWayConnect ({service_type}) est prévu le {appointment_date}. Répondez CONFIRMER ou ANNULER."
    return await send_sms(client_phone, msg)


async def send_payment_confirmation_sms(client_phone: str, client_name: str, amount: float, plan_name: str) -> dict:
    msg = f"{client_name}, votre paiement de {amount:.2f}$ CAD pour {plan_name} est confirmé! Merci de votre confiance. - BlackWayConnect"
    return await send_sms(client_phone, msg)


async def send_new_lead_sms_alert(admin_phone: str, lead_name: str, lead_company: str) -> dict:
    msg = f"Nouveau lead! Contact: {lead_name} - Entreprise: {lead_company}. Consultez le portail."
    return await send_sms(admin_phone, msg)


async def handle_incoming_sms(from_number: str, body: str, media_urls: Optional[List[str]] = None) -> dict:
    logger.info(f"SMS reçu de {from_number}: {body[:50]}...")
    body_upper = body.strip().upper()
    if body_upper in ["CONFIRMER", "CONFIRM", "OUI", "YES"]:
        return {"action": "appointment_confirmed", "from": from_number}
    elif body_upper in ["ANNULER", "CANCEL", "NON", "NO"]:
        return {"action": "appointment_cancelled", "from": from_number}
    elif body_upper in ["STOP", "UNSUBSCRIBE"]:
        return {"action": "unsubscribed", "from": from_number}
    else:
        return {"action": "forwarded_to_agent", "from": from_number, "message": body}


async def get_conversation_history(phone_number: str, limit: int = 20) -> list:
    if not _is_configured():
        return []
    client = _get_twilio_client()
    if not client:
        return []
    try:
        messages = client.messages.list(to=phone_number, limit=limit)
        return [{"sid": msg.sid, "direction": msg.direction, "body": msg.body, "status": msg.status, "date_sent": str(msg.date_sent)} for msg in messages]
    except Exception as e:
        logger.error(f"Erreur historique SMS: {e}")
        return []
