# Stripe RECEIVE — GO check

| Item | Valeur |
|---|---|
| Compte | `acct_1U1zzdEWku3DPVf3` (**seul**) |
| Mode | TEST d’abord → puis LIVE |
| Provision | `scripts/provision-stripe-king-catalog.py` |
| Catalogue | `artifacts/STRIPE-KING-CATALOG.json` |
| `/buy/{plan}` × 6 | Checkout Session (price_data) jusqu’à provision des Payment Links |
| Webhook | `https://blackway-pipe.f-gravelle20.workers.dev/webhooks/stripe` |

## Après provision

Liens KING : lire `artifacts/STRIPE-KING-CATALOG.json`.

## Secrets à coller

- Railway : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- blackway-pipe : `STRIPE_SECRET_KEY` (optionnel), `STRIPE_WEBHOOK_SECRET`

## Ne plus utiliser

- Compte `acct_1TDZjzAG7HUL9Rtr` et tous ses `buy.stripe.com`
- Fermer ce compte **seulement** après GO test + live sur `acct_1U1zzdEWku3DPVf3`
