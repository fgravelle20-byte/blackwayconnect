# BlackWayConnect Engine v2.0

Plateforme BaaS (Business-as-a-Service) complète pour entreprises locales.

BlackWayConnect est un moteur backend qui fournit aux PME locales une suite d'outils numériques: site web, CRM, automatisation IA, paiements, marketing et plus encore.

## Architecture

```
blackwayconnect/
├── main.py                  # Point d'entrée FastAPI + Sentry
├── config/settings.py       # Configuration centralisée
├── auth/                    # JWT auth, rôles, bcrypt
├── portal/                  # Dashboard client, métriques
├── notifications/           # Push iOS/Android, emails
├── rewards/                 # Fidélité 4 niveaux, parrainages
├── flex/                    # Rendez-vous, disponibilités
├── modules/payments/        # Stripe checkout, webhooks
├── delivery.py              # Asana livraison automatique
├── marketing.py             # SendGrid campagnes
├── sms_service.py           # Twilio SMS (placeholder)
├── middleware/              # Rate limit, cache, perf
└── utils/                   # Logger, Sentry helpers
```

## Modules

### Auth
- JWT access + refresh tokens, bcrypt, rôles (admin/client/manager)
- Endpoints: /api/v1/auth/register, /login, /refresh, /me

### Portail Client
- Dashboard métriques temps réel, suivi projets, facturation
- Endpoints: /api/v1/portal/dashboard, /metrics, /projects

### Notifications
- Push APNS/FCM + emails transactionnels
- Endpoints: /api/v1/notifications/register-device, /send

### Rewards
- 4 niveaux (Bronze > Platinum), points par action
- Endpoints: /api/v1/rewards/status, /referral-code, /leaderboard

### Flex
- Créneaux, réservation, annulation
- Endpoints: /api/v1/flex/slots, /book, /cancel/{id}

### Payments (Stripe)
- 3 plans CAD: Site 1495$, IA 4995$, CRM 6995$
- Webhooks confirmation automatique
- Endpoints: /api/v1/payments/plans, /checkout, /webhook

### Delivery (Asana)
- Tâche Asana créée automatiquement post-paiement
- Templates: Site 5j/8 étapes, CRM 10j/10 étapes, IA 15j/10 étapes

### Marketing (SendGrid)
- Listes contacts, campagnes, alertes leads

### SMS (Twilio - Placeholder)
- Envoi individuel/masse, rappels RDV, confirmations paiement
- Prêt à activer avec credentials Twilio

## Installation

```bash
git clone https://github.com/fgravelle20-byte/blackwayconnect.git
cd blackwayconnect
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

## Configuration

Variables d'environnement requises (.env.example):
- SENTRY_DSN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- SENDGRID_API_KEY, JWT_SECRET_KEY
- ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_GID, ASANA_DELIVERY_PROJECT_GID
- DISCORD_WEBHOOK_URL
- TWILIO_* (optionnel)

## Intégrations actives

Sentry, Stripe, SendGrid, Discord, Asana, OpenAI (Twilio: placeholder)

## Déploiement

Recommandé: Railway ou Render.

```bash
ENV=production uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
```

---
BlackWayConnect 2025-2026. Tous droits réservés.
