# Payment system LOCK (BlackWayConnect)

**Status: LOCKED.** Live Paddle pay → auto-forfait → money to seller Paddle account.

## What is locked

| Invariant | Value |
| --- | --- |
| Processor | `paddle` (not Stripe checkout for Grow Hub Launch/Growth/Scale) |
| Prices | Launch / Growth / Scale `pri_01kxtn6…` in `LOCKED.json` |
| Client token fallback | `live_a4f8ad8f1c8be908ec3784e8d8b` |
| Fulfill key (Vorixa → pipe) | `BW_PADDLE_FULFILL_KEY` in `pipe/wrangler.jsonc` |
| HubSpot `bw_source` for Paddle | `portail` (enum — never send `paddle`) |
| Checkout route | `/payer` via `paddlePlanUrl` |
| Webhook destination | `https://vorixa.ca/api/functions/blackwayPaddleWebhook` |

## Builder / agent rule (HARD)

Any Cursor / cloud builder / PR that edits a **guarded** payment file **fails CI** while `"locked": true` unless the owner unlocks.

Guarded paths (also listed in `LOCKED.json` + `.github/CODEOWNERS`):

- `src/paddleCatalog.ts`
- `src/pages/CheckoutPage.tsx`
- `src/stripeConfig.ts`
- `pipe/index.js`
- `pipe/wrangler.jsonc`
- `ops/payment-lock/LOCKED.json`
- `scripts/assert-payment-lock.mjs`
- `.github/workflows/payment-lock.yml`

Local check (runs in CI on every PR + push to `main`):

```bash
node scripts/assert-payment-lock.mjs
node --test pipe/paddle.test.mjs
```

## Unlock procedure (owner only)

1. Set `"locked": false` and `"unlock_ack": "I_UNDERSTAND_UNLOCKING_LIVE_PAYMENTS"` in `LOCKED.json`.
2. Bump `lock_version`.
3. Change code + update every matching field in `LOCKED.json`.
4. Merge with human CODEOWNERS review (`@fgravelle20-byte`).
5. Set `"locked": true`, **delete** `unlock_ack`, re-run assert script.

## Do not

- Swap processor back to Stripe for Grow Hub Launch/Growth/Scale
- Change price IDs without Paddle dashboard sync
- Send HubSpot `bw_source=paddle` (breaks provision — enum rejects it)
- Remove or rotate `BW_PADDLE_FULFILL_KEY` without Vorixa + pipe coordinated update
- Treat client-side `/payer` success redirect as payment proof (webhook only)
