# Vorixa Base44 — Paddle API (LIVE)

App `6a2a047fbc1c05e8396f0ad2` · `vorixa.ca`

## Statut — 100 % (2026-09-19)

| Composant | Statut |
|-----------|--------|
| `PADDLE_ENVIRONMENT=production` | OK |
| `PADDLE_CLIENT_TOKEN` (`live_…`) | OK via `paddle-pricing-config` |
| `PADDLE_API_KEY` (`pdl_live_apikey_…`) | OK — transactions serveur |
| Checkout serveur `creerCheckoutForfaitPaddle` | OK — retourne `txn_…` + URL overlay |
| Overlay fallback (`PaddleCheckoutGrid`) | OK si serveur indisponible |
| Admin inventory | Paddle (plus Stripe) |

## Preuve live

```bash
# Config publique
curl -sS https://vorixa.ca/api/functions/paddle-pricing-config | jq '.environment,.priceIds.Starter'

# Transaction serveur (Présence mensuel)
curl -sS -X POST https://vorixa.ca/api/functions/creerCheckoutForfaitPaddle \
  -H 'Content-Type: application/json' \
  -d '{"plan_id":"presence","billing_cycle":"monthly"}' | jq '.ok,.provider,.transaction_id,.price_id'
```

Attendu : `environment=production`, `ok=true`, `provider=paddle`, `transaction_id` préfixe `txn_`.

## Secrets requis (Base44 → Secrets)

- `PADDLE_API_KEY` — clé serveur Authentication (pas le jeton client)
- `PADDLE_CLIENT_TOKEN` — jeton client `live_…`
- `PADDLE_ENVIRONMENT=production`
- `PADDLE_WEBHOOK_SECRET` — webhook `paddleWebhookV2`
- optionnel `PADDLE_CHECKOUT_ORIGIN=https://vorixa.ca`

## Code clé

- `base44/shared/paddle.ts` — API + sanitization clé
- `base44/shared/paddlePriceMap.ts` — price IDs LIVE
- `base44/functions/creerCheckoutForfaitPaddle`
- `base44/functions/paddle-pricing-config`
- `base44/functions/paddleWebhookV2`
- `base44/shared/integrationInventory.ts` — infra admin = Paddle
