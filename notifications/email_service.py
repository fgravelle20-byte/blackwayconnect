"""
Service email transactionnel - Templates et envoi SMTP.
"""

import os
from typing import Optional, List
from utils.logger import logger


class EmailService:
    """Service d'emails transactionnels (confirmations, reçus, alertes)."""

    def __init__(self):
        self.smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_user = os.environ.get("SMTP_USER")
        self.from_email = os.environ.get("FROM_EMAIL", "service@blackwayconnect.com")

    async def send_transactional(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> dict:
        """Envoie un email transactionnel (confirmation, reçu, alerte)."""
        logger.info(f"Email transactionnel -> {to_email}: {subject}")
        # TODO: Intégration SMTP ou SendGrid transactional
        return {"status": "sent", "to": to_email, "subject": subject}

    async def send_welcome_email(self, user_email: str, user_name: str) -> dict:
        """Email de bienvenue après inscription."""
        subject = f"Bienvenue chez BlackWayConnect, {user_name}!"
        html = f"""
        <h1>Bienvenue {user_name}!</h1>
        <p>Votre compte BlackWayConnect est maintenant actif.</p>
        <p>Accédez à votre portail pour suivre vos métriques en temps réel.</p>
        """
        return await self.send_transactional(user_email, subject, html)

    async def send_payment_receipt(self, user_email: str, amount: float, plan: str) -> dict:
        """Reçu de paiement après une transaction Stripe."""
        subject = f"Reçu de paiement - {plan}"
        html = f"""
        <h2>Paiement confirmé</h2>
        <p>Montant: {amount:.2f}$ CAD</p>
        <p>Plan: {plan}</p>
        <p>Merci pour votre confiance!</p>
        """
        return await self.send_transactional(user_email, subject, html)

    async def send_lead_alert(self, admin_email: str, lead_data: dict) -> dict:
        """Alerte email quand un nouveau lead arrive."""
        subject = f"🔔 Nouveau lead: {lead_data.get('company', 'Inconnu')}"
        html = f"""
        <h2>Nouveau Lead Capturé!</h2>
        <ul>
            <li><strong>Entreprise:</strong> {lead_data.get('company', 'N/A')}</li>
            <li><strong>Contact:</strong> {lead_data.get('name', 'N/A')}</li>
            <li><strong>Email:</strong> {lead_data.get('email', 'N/A')}</li>
            <li><strong>Téléphone:</strong> {lead_data.get('phone', 'N/A')}</li>
            <li><strong>Source:</strong> {lead_data.get('source', 'N/A')}</li>
        </ul>
        """
        return await self.send_transactional(admin_email, subject, html)


email_service = EmailService()
