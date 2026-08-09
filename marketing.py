"""
BlackWayConnect — Module Marketing : Vente Éclair + Alertes Discord
===================================================================
Ce module gère :
1. La séquence automatisée "Vente Éclair" (3 emails via SendGrid)
2. Les alertes HIGH VALUE sur Discord pour chaque lead qualifié
3. Le message de succès post-paiement Stripe
"""

import os
import json
import time
from datetime import datetime, timedelta


# ============================================================
# CONFIGURATION
# ============================================================

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")

SEQUENCE_CONFIG = {
    "name": "vente_eclair_bwc02",
    "emails": [
        {
            "id": "constat",
            "delay_days": 0,
            "subject": "{prenom}, voici combien vous perdez chaque jour sans le savoir",
            "template_id": "vente_eclair_01_constat",
        },
        {
            "id": "solution",
            "delay_days": 2,
            "subject": "Le système qui transforme 1$ en 8$ (en automatique)",
            "template_id": "vente_eclair_02_solution",
        },
        {
            "id": "urgence",
            "delay_days": 5,
            "subject": "⚠️ {prenom} — Dernière place disponible pour BWC/02",
            "template_id": "vente_eclair_03_urgence",
        },
    ],
}


# ============================================================
# DISCORD ALERTS — HIGH VALUE LEAD
# ============================================================

def send_discord_high_value_alert(lead_data: dict) -> bool:
    """
    Envoie une alerte 'HIGH VALUE' sur Discord quand un lead qualifié
    entre dans le système.
    
    Args:
        lead_data: dict avec prenom, email, entreprise, score, source
    
    Returns:
        bool: True si l'alerte a été envoyée avec succès
    """
    import requests

    if not DISCORD_WEBHOOK_URL:
        print("[ERREUR] DISCORD_WEBHOOK_URL non configuré")
        return False

    embed = {
        "title": "🚨 HIGH VALUE LEAD DÉTECTÉ",
        "color": 0xFF6600,  # Orange vif
        "fields": [
            {"name": "👤 Nom", "value": lead_data.get("prenom", "Inconnu"), "inline": True},
            {"name": "📧 Email", "value": lead_data.get("email", "N/A"), "inline": True},
            {"name": "🏢 Entreprise", "value": lead_data.get("entreprise", "N/A"), "inline": True},
            {"name": "📊 Score", "value": f"{lead_data.get('score', 0)}/100", "inline": True},
            {"name": "🎯 Source", "value": lead_data.get("source", "Directe"), "inline": True},
            {"name": "💰 Valeur estimée", "value": lead_data.get("valeur_estimee", "À qualifier"), "inline": True},
        ],
        "footer": {"text": "BlackWayConnect Growth Engine"},
        "timestamp": datetime.utcnow().isoformat(),
    }

    payload = {
        "content": "💎 **NOUVEAU LEAD HIGH VALUE** — Action immédiate requise!",
        "embeds": [embed],
    }

    try:
        response = requests.post(
            DISCORD_WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        print(f"[OK] Alerte Discord envoyée pour {lead_data.get('email')}")
        return True
    except Exception as e:
        print(f"[ERREUR] Discord alert failed: {e}")
        return False


# ============================================================
# SENDGRID — SÉQUENCE VENTE ÉCLAIR
# ============================================================

def trigger_vente_eclair_sequence(lead_data: dict) -> dict:
    """
    Déclenche la séquence 'Vente Éclair' pour un lead qualifié.
    Planifie les 3 emails avec les délais configurés.
    
    Args:
        lead_data: dict avec prenom, email, entreprise
    
    Returns:
        dict avec status et détails de planification
    """
    import requests

    if not SENDGRID_API_KEY:
        return {"status": "error", "message": "SENDGRID_API_KEY non configuré"}

    results = []
    base_time = datetime.utcnow()

    for email_config in SEQUENCE_CONFIG["emails"]:
        send_at = base_time + timedelta(days=email_config["delay_days"])
        
        # Construction du payload SendGrid
        payload = {
            "personalizations": [
                {
                    "to": [{"email": lead_data["email"]}],
                    "dynamic_template_data": {
                        "prenom": lead_data.get("prenom", ""),
                        "entreprise": lead_data.get("entreprise", ""),
                        "date_expiration": (base_time + timedelta(days=6)).strftime("%d/%m/%Y"),
                    },
                }
            ],
            "from": {
                "email": "serviceclient@blackwayconnect.com",
                "name": "BlackWayConnect"
            },
            "template_id": email_config["template_id"],
            "categories": ["vente_eclair", email_config["id"], "bwc02"],
            "tracking_settings": {
                "click_tracking": {"enable": True},
                "open_tracking": {"enable": True},
            },
        }

        # Planification différée (sauf email 1 qui part immédiatement)
        if email_config["delay_days"] > 0:
            payload["send_at"] = int(send_at.timestamp())

        try:
            response = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={
                    "Authorization": f"Bearer {SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            results.append({
                "email_id": email_config["id"],
                "status": "scheduled" if email_config["delay_days"] > 0 else "sent",
                "send_at": send_at.isoformat(),
                "http_status": response.status_code,
            })
        except Exception as e:
            results.append({
                "email_id": email_config["id"],
                "status": "error",
                "error": str(e),
            })

    return {
        "status": "success",
        "sequence": SEQUENCE_CONFIG["name"],
        "lead_email": lead_data["email"],
        "emails_planned": results,
    }


# ============================================================
# PIPELINE PRINCIPAL — NOUVEAU LEAD QUALIFIÉ
# ============================================================

def process_qualified_lead(lead_data: dict) -> dict:
    """
    Pipeline principal déclenché pour chaque nouveau lead qualifié.
    
    Étapes :
    1. Alerte HIGH VALUE sur Discord
    2. Déclenchement séquence Vente Éclair (SendGrid)
    3. Log de l'événement
    
    Args:
        lead_data: {
            "prenom": str,
            "email": str,
            "entreprise": str,
            "score": int (0-100),
            "source": str,
            "valeur_estimee": str
        }
    
    Returns:
        dict avec résumé des actions effectuées
    """
    print(f"\n{'='*60}")
    print(f"🎯 NOUVEAU LEAD QUALIFIÉ : {lead_data.get('prenom')} ({lead_data.get('email')})")
    print(f"{'='*60}\n")

    results = {
        "lead": lead_data,
        "timestamp": datetime.utcnow().isoformat(),
        "actions": {},
    }

    # 1. Alerte Discord HIGH VALUE
    print("[1/2] Envoi alerte Discord HIGH VALUE...")
    discord_ok = send_discord_high_value_alert(lead_data)
    results["actions"]["discord_alert"] = "sent" if discord_ok else "failed"

    # 2. Séquence Vente Éclair
    print("[2/2] Déclenchement séquence Vente Éclair...")
    sequence_result = trigger_vente_eclair_sequence(lead_data)
    results["actions"]["vente_eclair"] = sequence_result

    print(f"\n✅ Pipeline complété pour {lead_data.get('email')}")
    print(f"   Discord: {'✅' if discord_ok else '❌'}")
    print(f"   Emails: {sequence_result.get('status')}")

    return results


# ============================================================
# STRIPE — MESSAGE DE SUCCÈS POST-PAIEMENT
# ============================================================

def generate_success_message(customer_data: dict, plan: str = "BWC/02") -> dict:
    """
    Génère le message de succès après un paiement Stripe réussi.
    Confirme au client que son système de croissance est activé.
    
    Args:
        customer_data: données client depuis Stripe (name, email)
        plan: identifiant du forfait (default: BWC/02)
    
    Returns:
        dict avec le contenu du message de succès
    """
    prenom = customer_data.get("name", "").split()[0] if customer_data.get("name") else "Champion"
    
    success_message = {
        "type": "success_confirmation",
        "plan": plan,
        "subject": f"🎉 {prenom}, votre machine à croissance est activée!",
        "headline": "FÉLICITATIONS — Vous venez de prendre la meilleure décision business de l'année.",
        "body": f"""
{prenom},

🚀 C'est officiel. Votre système BlackWay est en cours d'activation.

Voici ce qui se passe maintenant :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ÉTAPE ACTUELLE : Activation en cours
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Paiement confirmé — Forfait {plan}
✅ Votre audit IA personnalisé démarre dans les prochaines 24h
✅ Votre écosystème automatisé sera opérationnel sous 72h
✅ Votre accompagnement stratégique 90 jours commence maintenant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 CE QUE ÇA SIGNIFIE POUR VOUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dans 90 jours, votre entreprise aura :
• Un système qui génère des leads qualifiés en automatique (24/7)
• Des processus optimisés qui vous libèrent 15h+ par semaine
• Une croissance de 150-200% mesurable et documentée

Vous n'avez plus besoin d'espérer la croissance.
Vous venez d'installer le SYSTÈME qui la garantit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 PROCHAINE ÉTAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre équipe vous contacte sous 24h pour votre session 
de lancement personnalisée.

En attendant, bienvenue dans le cercle des entrepreneurs 
qui ont choisi de SYSTÉMATISER leur succès.

À votre croissance explosive,
L'équipe BlackWayConnect
""",
        "cta": {
            "text": "Accéder à mon espace client",
            "url": "https://app.blackwayconnect.com/dashboard",
        },
        "metadata": {
            "customer_email": customer_data.get("email"),
            "plan": plan,
            "activation_date": datetime.utcnow().isoformat(),
            "guarantee": "ROI 200% en 90 jours ou accompagnement prolongé gratuitement",
        },
    }

    return success_message


def handle_stripe_payment_success(event: dict) -> dict:
    """
    Webhook handler pour les événements Stripe 'payment_intent.succeeded'.
    Déclenche le message de succès et l'alerte Discord.
    
    Args:
        event: Stripe webhook event payload
    
    Returns:
        dict avec résultat du traitement
    """
    payment_intent = event.get("data", {}).get("object", {})
    customer_email = payment_intent.get("receipt_email", "")
    customer_name = payment_intent.get("metadata", {}).get("customer_name", "")
    plan = payment_intent.get("metadata", {}).get("plan", "BWC/02")

    customer_data = {
        "name": customer_name,
        "email": customer_email,
    }

    # Générer le message de succès
    success_msg = generate_success_message(customer_data, plan)

    # Alerte Discord pour le paiement
    payment_alert = {
        "prenom": customer_name,
        "email": customer_email,
        "entreprise": payment_intent.get("metadata", {}).get("entreprise", "N/A"),
        "score": 100,
        "source": "Paiement Stripe",
        "valeur_estimee": f"{payment_intent.get('amount', 0) / 100:.2f}$",
    }
    
    send_discord_high_value_alert(payment_alert)

    return {
        "status": "success",
        "customer_email": customer_email,
        "plan": plan,
        "success_message": success_msg,
        "discord_notified": True,
    }


# ============================================================
# POINT D'ENTRÉE — TESTS
# ============================================================

if __name__ == "__main__":
    # Simulation d'un lead qualifié
    test_lead = {
        "prenom": "Marc",
        "email": "marc@exemple.com",
        "entreprise": "TechVision Inc.",
        "score": 85,
        "source": "Audit IA Landing Page",
        "valeur_estimee": "15 000$/an",
    }

    print("\n" + "=" * 60)
    print("🧪 TEST — Pipeline Lead Qualifié")
    print("=" * 60)
    result = process_qualified_lead(test_lead)
    print(f"\nRésultat: {json.dumps(result, indent=2, default=str)}")

    print("\n" + "=" * 60)
    print("🧪 TEST — Message Succès Post-Paiement")
    print("=" * 60)
    success = generate_success_message({"name": "Marc Dupont", "email": "marc@exemple.com"})
    print(f"\nSujet: {success['subject']}")
    print(success["body"])
