"""
Emails canoniques BlackWayConnect — source unique de vérité.
=============================================================
NE JAMAIS utiliser f.gravelle20@icloud.com dans les apps, Stripe,
HubSpot, Base44, Workers ou notifications business.

Règle :
  - Clients / support / Stripe business  → SERVICE_EMAIL
  - Comptabilité / factures internes     → ACCOUNTING_EMAIL
  - iCloud perso                         → interdit (PERSONAL_BLOCKED)
"""

# === ADRESSE SAUVEGARDÉE POUR L'AVENIR (unique, business) ===
SERVICE_EMAIL = "serviceclient@blackwayconnect.com"

# Comptabilité (légal / Stripe representative déjà sur accounting@unexa.ca côté personne)
ACCOUNTING_EMAIL = "accounting@blackwayconnect.com"
ACCOUNTING_LEGACY_UNEXA = "accounting@unexa.ca"  # personne Stripe ; ne pas utiliser pour clients

# Expéditeur transactionnel (reçus, alertes admin)
FROM_EMAIL = SERVICE_EMAIL

# Alertes admin (leads, paiements) — JAMAIS iCloud
ADMIN_ALERT_EMAIL = SERVICE_EMAIL

# Adresse personnelle — bloquée pour toute tuyauterie business
PERSONAL_BLOCKED = (
    "f.gravelle20@icloud.com",
    "f.gravelle20@me.com",
)

BRAND_SUPPORT = SERVICE_EMAIL
