"""
Email UNIQUE BlackWayConnect / Stripe.
======================================
Une seule adresse confirmée et fonctionnelle :

    serviceclient@blackwayconnect.com

Toute autre adresse (iCloud, accounting@, hello@, etc.)
est interdite dans la tuyauterie Stripe / apps / alertes.
"""

SERVICE_EMAIL = "serviceclient@blackwayconnect.com"
FROM_EMAIL = SERVICE_EMAIL
SUPPORT_EMAIL = SERVICE_EMAIL
ADMIN_ALERT_EMAIL = SERVICE_EMAIL
BRAND_SUPPORT = SERVICE_EMAIL

# Adresses à ne jamais utiliser pour Stripe / apps
BLOCKED_EMAILS = (
    "f.gravelle20@icloud.com",
    "f.gravelle20@me.com",
    "accounting@blackwayconnect.com",
    "accounting@unexa.ca",
    "hello@blackwayconnect.com",
    "hello@blackway.io",
    "service@blackwayconnect.com",
    "growth@blackwayconnect.com",
)

# Alias historiques pour imports — tous pointent vers SERVICE_EMAIL
PERSONAL_BLOCKED = BLOCKED_EMAILS
ACCOUNTING_EMAIL = SERVICE_EMAIL  # plus d'email accounting séparé
