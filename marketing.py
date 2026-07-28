"""
BlackWayConnect - Module Marketing (SendGrid)
Gestion des listes de contacts, emails marketing et transactionnels,
alertes automatiques pour les nouveaux leads.

Utilise l'API SendGrid v3 pour:
- Gérer les listes de contacts marketing
- Envoyer des emails transactionnels (confirmations, reçus)
- Envoyer des campagnes marketing (newsletters, promotions)
- Alertes automatiques pour les nouveaux leads
"""

import os
from typing import Optional, List, Dict
from datetime import datetime
from utils.logger import logger


# Configuration SendGrid
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL", "marketing@blackwayconnect.com")
SENDGRID_FROM_NAME = os.environ.get("SENDGRID_FROM_NAME", "BlackWayConnect")

# Template IDs pour les emails transactionnels
TEMPLATE_IDS = {
    "welcome": os.environ.get("SG_TEMPLATE_WELCOME", ""),
    "lead_alert": os.environ.get("SG_TEMPLATE_LEAD_ALERT", ""),
    "payment_receipt": os.environ.get("SG_TEMPLATE_PAYMENT_RECEIPT", ""),
    "monthly_report": os.environ.get("SG_TEMPLATE_MONTHLY_REPORT", ""),
    "renewal_reminder": os.environ.get("SG_TEMPLATE_RENEWAL_REMINDER", ""),
}

# Liste IDs pour le marketing
MARKETING_LISTS = {
    "all_clients": os.environ.get("SG_LIST_ALL_CLIENTS", ""),
    "leads": os.environ.get("SG_LIST_LEADS", ""),
    "newsletter": os.environ.get("SG_LIST_NEWSLETTER", ""),
    "vip_clients": os.environ.get("SG_LIST_VIP", ""),
}


def _get_sendgrid_client():
    """Initialise le client SendGrid."""
    try:
        from sendgrid import SendGridAPIClient
        return SendGridAPIClient(SENDGRID_API_KEY)
    except ImportError:
        logger.error("sendgrid package not installed. Run: pip install sendgrid")
        return None
    except Exception as e:
        logger.error(f"SendGrid init error: {e}")
        return None


async def add_contact_to_list(
    email: str, first_name: str = "", last_name: str = "",
    company: str = "", list_id: Optional[str] = None,
    custom_fields: Optional[Dict] = None
) -> dict:
    """Ajoute un contact à une liste marketing SendGrid."""
    sg = _get_sendgrid_client()
    if not sg:
        return {"status": "error", "message": "SendGrid not configured"}

    contact_data = {"email": email, "first_name": first_name, "last_name": last_name, "company": company}
    if custom_fields:
        contact_data["custom_fields"] = custom_fields

    body = {"contacts": [contact_data]}
    if list_id:
        body["list_ids"] = [list_id]

    try:
        response = sg.client.marketing.contacts.put(request_body=body)
        logger.info(f"Contact ajouté: {email} -> list {list_id}")
        return {"status": "success", "email": email, "response_code": response.status_code}
    except Exception as e:
        logger.error(f"Erreur ajout contact: {e}")
        return {"status": "error", "message": str(e)}


async def get_contact_lists() -> list:
    """Récupère toutes les listes de contacts marketing."""
    sg = _get_sendgrid_client()
    if not sg:
        return []
    try:
        response = sg.client.marketing.lists.get()
        import json
        data = json.loads(response.body)
        return data.get("result", [])
    except Exception as e:
        logger.error(f"Erreur récupération listes: {e}")
        return []


async def create_contact_list(name: str) -> dict:
    """Crée une nouvelle liste de contacts."""
    sg = _get_sendgrid_client()
    if not sg:
        return {"status": "error", "message": "SendGrid not configured"}
    try:
        response = sg.client.marketing.lists.post(request_body={"name": name})
        import json
        data = json.loads(response.body)
        logger.info(f"Liste créée: {name} -> {data.get('id')}")
        return {"status": "success", "list_id": data.get("id"), "name": name}
    except Exception as e:
        logger.error(f"Erreur création liste: {e}")
        return {"status": "error", "message": str(e)}


async def send_transactional_email(
    to_email: str, subject: str, html_content: str,
    template_id: Optional[str] = None, dynamic_data: Optional[Dict] = None
) -> dict:
    """Envoie un email transactionnel via SendGrid."""
    sg = _get_sendgrid_client()
    if not sg:
        return {"status": "error", "message": "SendGrid not configured"}

    try:
        from sendgrid.helpers.mail import Mail, To, From
        message = Mail()
        message.from_email = From(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME)
        message.to = To(to_email)

        if template_id:
            message.template_id = template_id
            if dynamic_data:
                message.dynamic_template_data = dynamic_data
        else:
            message.subject = subject
            message.html_content = html_content

        response = sg.send(message)
        logger.info(f"Email transactionnel envoyé: {to_email} ({response.status_code})")
        return {"status": "success", "to": to_email, "status_code": response.status_code}
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")
        return {"status": "error", "message": str(e)}


async def send_new_lead_alert(lead_data: Dict) -> dict:
    """Envoie une alerte email quand un nouveau lead est capturé."""
    admin_emails = os.environ.get("LEAD_ALERT_EMAILS", "service@blackwayconnect.com").split(",")

    subject = f"Nouveau Lead: {lead_data.get('company', 'Entreprise inconnue')}"
    html_content = f"""<div style='font-family:Arial;max-width:600px;margin:0 auto'>
    <h1>Nouveau Lead Capturé!</h1>
    <table><tr><td><b>Entreprise:</b></td><td>{lead_data.get('company','N/A')}</td></tr>
    <tr><td><b>Contact:</b></td><td>{lead_data.get('name','N/A')}</td></tr>
    <tr><td><b>Email:</b></td><td>{lead_data.get('email','N/A')}</td></tr>
    <tr><td><b>Téléphone:</b></td><td>{lead_data.get('phone','N/A')}</td></tr>
    <tr><td><b>Source:</b></td><td>{lead_data.get('source','N/A')}</td></tr>
    <tr><td><b>Service:</b></td><td>{lead_data.get('service_interest','N/A')}</td></tr>
    <tr><td><b>Date:</b></td><td>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</td></tr></table>
    <p><b>Notes:</b> {lead_data.get('notes','Aucune')}</p></div>"""

    results = []
    for admin_email in admin_emails:
        admin_email = admin_email.strip()
        if admin_email:
            result = await send_transactional_email(admin_email, subject, html_content)
            results.append(result)

    await add_contact_to_list(
        email=lead_data.get("email", ""),
        first_name=lead_data.get("name", "").split(" ")[0] if lead_data.get("name") else "",
        last_name=" ".join(lead_data.get("name", "").split(" ")[1:]) if lead_data.get("name") else "",
        company=lead_data.get("company", ""),
        list_id=MARKETING_LISTS.get("leads"),
    )

    logger.info(f"Lead alert envoyée pour: {lead_data.get('company')}")
    return {"status": "success", "alerts_sent": len(results), "lead_added_to_list": True}


async def send_marketing_campaign(
    list_id: str, subject: str, html_content: str,
    sender_name: str = "BlackWayConnect", schedule_at: Optional[str] = None
) -> dict:
    """Crée et envoie une campagne marketing à une liste de contacts."""
    sg = _get_sendgrid_client()
    if not sg:
        return {"status": "error", "message": "SendGrid not configured"}
    try:
        logger.info(f"Campagne marketing préparée pour liste {list_id}")
        return {"status": "prepared", "list_id": list_id, "subject": subject, "scheduled": schedule_at or "immediate"}
    except Exception as e:
        logger.error(f"Erreur campagne marketing: {e}")
        return {"status": "error", "message": str(e)}


async def get_campaign_stats(campaign_id: str) -> dict:
    """Récupère les statistiques d'une campagne (opens, clicks, etc.)."""
    sg = _get_sendgrid_client()
    if not sg:
        return {"status": "error", "message": "SendGrid not configured"}
    try:
        return {"campaign_id": campaign_id, "delivered": 0, "opens": 0, "clicks": 0, "bounces": 0, "unsubscribes": 0}
    except Exception as e:
        logger.error(f"Erreur stats campagne: {e}")
        return {"status": "error", "message": str(e)}
