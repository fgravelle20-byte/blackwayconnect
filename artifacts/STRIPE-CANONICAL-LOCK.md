# Stripe plumbing — BlackWayConnect (CANONICAL)

**Compte unique :** `acct_1U1zzdEWku3DPVf3`  
Dashboard test keys : https://dashboard.stripe.com/acct_1U1zzdEWku3DPVf3/test/apikeys  

~~`acct_1TDZjzAG7HUL9Rtr` (BlackWayConnect Inc)~~ — **À FERMER** après cutover complet. Ne plus créer de liens / webhooks dessus.

## Cutover (2026-08-10)

1. Coller `STRIPE_SECRET_KEY` (`sk_test_…` d’abord, puis `sk_live_…`) du compte `acct_1U1zzdEWku3DPVf3`
2. Lancer :
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...
   python3 scripts/provision-stripe-king-catalog.py
   ```
3. Coller les `price_id` / `payment_link` générés dans `modules/payments/payments.py`
4. Mettre `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` sur Railway + `blackway-pipe`
5. Vérifier `/api/v1/payments/buy/grow_hub_launch` → Checkout du **nouveau** compte
6. Seulement ensuite : fermer les autres comptes Stripe

## Catalogue KING — TOUS abonnements (mensuel **ou** annuel −12 %)

| Forfait | Mensuel | Annuel (−12 %) |
|---|---|---|
| Grow Hub Launch | 299 $/mois | 3 157,44 $/an |
| Grow Hub Growth | 749 $/mois | 7 909,44 $/an |
| Grow Hub Scale | 1 495 $/mois | 15 787,20 $/an |
| Site haute conversion | 1 995 $/mois | 21 067,20 $/an |
| Système de revenus | 4 995 $/mois | 52 747,20 $/an |
| App mobile / IA | 7 995 $/mois | 84 427,20 $/an |

Buy : `/api/v1/payments/buy/{plan}?billing=monthly` ou `billing=annual`  
Liens Stripe : `artifacts/STRIPE-KING-CATALOG.json` (après provision).

Source générée : `artifacts/STRIPE-KING-CATALOG.json` (après provision).

Anciens liens `buy.stripe.com` du compte `…AG7HUL9Rtr` = **morts / ne plus partager**.

### Webhook canonical

`https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe`  
Créé/activé par le script de provision sur `acct_1U1zzdEWku3DPVf3`.

~~`api.blackwayconnect.com/webhooks/stripe`~~ = FAUX (Cloudflare challenge)

### Projets

1. **blackwayconnect (Railway)** — site + `/api/v1/payments/buy/{plan}`
2. **blackway-pipe** — leads HubSpot + webhook Stripe
3. **bw-stripe-webhook** / **blackway-engine** — LEGACY (ne plus pointer)

## Email UNIQUE (verrouillé)

**`serviceclient@blackwayconnect.com`**

Stripe Dashboard (manuel) :
- Login team + support + Connect recipients → **uniquement** `serviceclient@blackwayconnect.com`
