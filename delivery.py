"""
BlackWayConnect - Module Delivery (Asana)
Automatisation de la livraison de service.

Dès qu'un paiement Stripe est confirmé (webhook checkout.session.completed),
une tâche Asana est automatiquement créée pour lancer le processus de livraison.

Chaque tâche inclut:
- Le nom du client
- Le forfait acheté (Site & Présence Google, Conversion & CRM, Automatisation & IA)
- Les liens vers le dossier client
- Une date d'échéance (démarrage immédiat, livraison sous 5 jours ouvrables)

CONFIGURATION (variables d'environnement):
- ASANA_ACCESS_TOKEN: Personal Access Token Asana
- ASANA_WORKSPACE_GID: GID du workspace (default: 1216895175256768)
- ASANA_DELIVERY_PROJECT_GID: GID du projet de livraison (default: 1216895175895720)
"""

import os
import httpx
from typing import Optional, Dict
from datetime import datetime, timedelta
from utils.logger import logger


# Configuration Asana
ASANA_ACCESS_TOKEN = os.environ.get("ASANA_ACCESS_TOKEN")
ASANA_WORKSPACE_GID = os.environ.get("ASANA_WORKSPACE_GID", "1216895175256768")
ASANA_DELIVERY_PROJECT_GID = os.environ.get("ASANA_DELIVERY_PROJECT_GID", "1216895175895720")
ASANA_BASE_URL = "https://app.asana.com/api/1.0"

# Mapping des forfaits vers des templates de livraison (grille 4 août 2026)
DELIVERY_TEMPLATES = {
    "website_lead_launch": {
        "name": "Site haute conversion",
        "checklist": [
            "Appel découverte avec le client (30 min)",
            "Collecte du contenu (textes, images, logo)",
            "Design de la maquette haute conversion",
            "Développement du site web",
            "Formulaires reliés au Grow Hub",
            "Optimisation SEO de base",
            "Formation client (portail + analytics)",
            "Mise en ligne et validation finale",
        ],
        "delivery_days": 21,
    },
    "revenue_system": {
        "name": "Système de revenus complet",
        "checklist": [
            "Appel stratégique avec le client (60 min)",
            "Audit de la présence numérique actuelle",
            "Configuration CRM et pipeline de ventes",
            "Site + soumissions + paiements reliés",
            "Mise en place du suivi de leads automatisé",
            "Intégration email marketing (séquences)",
            "Configuration des rapports et KPIs",
            "Formation équipe client",
            "Test end-to-end du funnel",
            "Lancement et optimisation initiale",
        ],
        "delivery_days": 35,
    },
    "ai_scale": {
        "name": "Application mobile iOS & Android",
        "checklist": [
            "Appel architecture avec le client (90 min)",
            "Cartographie des parcours mobiles",
            "Design UX iOS & Android",
            "Développement application connectée CRM",
            "Automatisations IA reliées",
            "Tests et QA des scénarios",
            "Publication stores / déploiement",
            "Formation avancée de l'équipe",
            "Monitoring et optimisation post-lancement",
        ],
        "delivery_days": 45,
    },
    "grow_hub_launch": {
        "name": "Grow Hub Launch",
        "checklist": [
            "Onboarding Grow Hub Launch",
            "Configuration 1 pipeline + formulaires",
            "Tâches et 2 automatisations",
            "Hébergement et maintenance",
            "Formation de démarrage",
        ],
        "delivery_days": 7,
    },
    "grow_hub_growth": {
        "name": "Grow Hub Growth",
        "checklist": [
            "Onboarding Grow Hub Growth",
            "Scoring leads + chatbot IA",
            "Soumissions et paiements en ligne",
            "8 automatisations + SEO mensuel",
            "Formation équipe commerciale",
        ],
        "delivery_days": 7,
    },
    "grow_hub_scale": {
        "name": "Grow Hub Scale",
        "checklist": [
            "Onboarding Grow Hub Scale",
            "Multi-pipelines et IA avancée",
            "Accès API + app mobile",
            "Support prioritaire + stratège dédié",
            "Revue stratégique de lancement",
        ],
        "delivery_days": 7,
    },
    # Alias historiques
    "site_presence_google": {
        "name": "Site haute conversion",
        "checklist": [
            "Appel découverte avec le client (30 min)",
            "Collecte du contenu (textes, images, logo)",
            "Design de la maquette",
            "Développement du site web",
            "Configuration Google Business Profile",
            "Optimisation SEO de base",
            "Formation client (portail + analytics)",
            "Mise en ligne et validation finale",
        ],
        "delivery_days": 21,
    },
    "conversion_crm": {
        "name": "Système de revenus complet",
        "checklist": [
            "Appel stratégique avec le client (60 min)",
            "Audit de la présence numérique actuelle",
            "Configuration CRM et pipeline de ventes",
            "Création des landing pages de conversion",
            "Mise en place du suivi de leads automatisé",
            "Intégration email marketing (séquences)",
            "Configuration des rapports et KPIs",
            "Formation équipe client",
            "Test end-to-end du funnel",
            "Lancement et optimisation initiale",
        ],
        "delivery_days": 35,
    },
    "automatisation_ia": {
        "name": "Application mobile & IA",
        "checklist": [
            "Appel architecture avec le client (90 min)",
            "Cartographie des processus à automatiser",
            "Design des workflows IA",
            "Développement chatbot / assistant IA",
            "Intégration avec les systèmes existants",
            "Configuration des automatisations",
            "Tests et QA des scénarios",
            "Formation avancée de l'équipe",
            "Déploiement progressif",
            "Monitoring et optimisation post-lancement",
        ],
        "delivery_days": 45,
    },
}

# URL templates
CLIENT_FOLDER_URL = "https://drive.google.com/drive/folders/{client_id}"
PORTAL_URL = "https://app.blackwayconnect.com/admin/clients/{client_id}"


def _get_headers() -> dict:
    """Headers d'authentification Asana."""
    return {
        "Authorization": f"Bearer {ASANA_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _is_configured() -> bool:
    """Vérifie si Asana est configuré."""
    return bool(ASANA_ACCESS_TOKEN)


def _get_plan_key_from_price_id(price_id: str) -> Optional[str]:
    """Résout le price_id Stripe vers la clé de plan interne."""
    from modules.payments.payments import PRICE_IDS
    for key, data in PRICE_IDS.items():
        if price_id in [data.get("one_time"), data.get("monthly"), data.get("annual"), data.get("id")]:
            return key
    return None


async def create_delivery_task(
    client_name: str,
    client_email: str,
    client_id: str,
    plan_key: str,
    amount_paid: float,
    payment_id: str,
) -> dict:
    """
    Crée une tâche de livraison dans Asana après un paiement réussi.
    Appelée automatiquement par le webhook Stripe.
    """
    if not _is_configured():
        logger.warning("Asana non configuré - tâche de livraison non créée")
        return {"status": "not_configured", "message": "ASANA_ACCESS_TOKEN manquant."}

    template = DELIVERY_TEMPLATES.get(plan_key)
    if not template:
        logger.error(f"Plan inconnu pour la livraison: {plan_key}")
        return {"status": "error", "message": f"Plan inconnu: {plan_key}"}

    due_date = datetime.utcnow() + timedelta(days=template["delivery_days"])
    due_date_str = due_date.strftime("%Y-%m-%d")

    checklist_md = "\n".join(f"  - [ ] {item}" for item in template["checklist"])
    client_folder_link = CLIENT_FOLDER_URL.format(client_id=client_id)
    portal_link = PORTAL_URL.format(client_id=client_id)

    task_notes = (
        f"NOUVELLE LIVRAISON - Démarrage immédiat!\n\n"
        f"INFORMATIONS CLIENT\n"
        f"Client: {client_name}\nEmail: {client_email}\nID Client: {client_id}\n\n"
        f"DÉTAILS DU PAIEMENT\n"
        f"Forfait: {template['name']}\nMontant: {amount_paid:.2f}$ CAD\n"
        f"Paiement Stripe: {payment_id}\nDate: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"LIENS RAPIDES\n"
        f"Dossier client: {client_folder_link}\nPortail admin: {portal_link}\n\n"
        f"CHECKLIST DE LIVRAISON\n{checklist_md}\n\n"
        f"OBJECTIF: Livraison complète d'ici le {due_date_str}\n"
        f"Le client a payé. La livraison commence MAINTENANT."
    )

    task_name = f"[{template['name']}] {client_name} - Livraison service"

    payload = {
        "data": {
            "name": task_name,
            "notes": task_notes,
            "workspace": ASANA_WORKSPACE_GID,
            "projects": [ASANA_DELIVERY_PROJECT_GID],
            "due_on": due_date_str,
            "assignee": "me",
            "followers": ["me"],
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{ASANA_BASE_URL}/tasks",
                headers=_get_headers(),
                json=payload,
            )

            if response.status_code == 201:
                task_data = response.json().get("data", {})
                task_gid = task_data.get("gid", "")
                task_url = f"https://app.asana.com/0/{ASANA_DELIVERY_PROJECT_GID}/{task_gid}"
                logger.info(f"Tâche Asana créée: {task_name} | GID: {task_gid}")
                await _create_subtasks(task_gid, template["checklist"])
                return {
                    "status": "success",
                    "task_gid": task_gid,
                    "task_url": task_url,
                    "task_name": task_name,
                    "due_date": due_date_str,
                    "delivery_days": template["delivery_days"],
                }
            else:
                error_body = response.text
                logger.error(f"Asana API error ({response.status_code}): {error_body}")
                return {"status": "error", "http_status": response.status_code, "message": error_body}

    except httpx.TimeoutException:
        logger.error("Asana API timeout")
        return {"status": "error", "message": "Timeout Asana API"}
    except Exception as e:
        logger.error(f"Erreur inattendue création tâche Asana: {e}")
        return {"status": "error", "message": str(e)}


async def _create_subtasks(parent_gid: str, checklist: list) -> None:
    """Crée des sous-tâches Asana pour chaque élément de la checklist."""
    if not _is_configured():
        return
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            for i, item in enumerate(checklist, 1):
                subtask_payload = {"data": {"name": f"{i}. {item}", "parent": parent_gid}}
                response = await client.post(
                    f"{ASANA_BASE_URL}/tasks", headers=_get_headers(), json=subtask_payload
                )
                if response.status_code != 201:
                    logger.warning(f"Subtask failed: {item} -> {response.status_code}")
    except Exception as e:
        logger.warning(f"Erreur création sous-tâches: {e}")


async def on_payment_success(session_data: dict) -> dict:
    """
    Point d'entrée appelé par le webhook Stripe.
    Extrait les données de la session et lance la livraison.
    """
    client_email = session_data.get("customer_email", "")
    client_id = session_data.get("metadata", {}).get("client_id", client_email)
    client_name = session_data.get("customer_details", {}).get("name", client_email)
    payment_id = session_data.get("id", "unknown")
    amount_total = session_data.get("amount_total", 0) / 100

    plan_key = session_data.get("metadata", {}).get("plan_key", "")
    if not plan_key:
        if amount_total <= 1500:
            plan_key = "site_presence_google"
        elif amount_total <= 5000:
            plan_key = "automatisation_ia"
        else:
            plan_key = "conversion_crm"

    logger.info(f"Paiement réussi! Lancement livraison: {client_name} | {plan_key} | {amount_total}$ CAD")

    result = await create_delivery_task(
        client_name=client_name,
        client_email=client_email,
        client_id=client_id,
        plan_key=plan_key,
        amount_paid=amount_total,
        payment_id=payment_id,
    )
    return result
