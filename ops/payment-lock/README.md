# Payment system LOCK (BlackWayConnect)

**Status: LOCKED.** Live Paddle pay → auto-forfait → money to seller Paddle account.

## What is locked

| Invariant | Value |
| --- | --- |
| Processor | `paddle` (not Stripe checkout for Grow Hub Launch/Growth/Scale) |
| Prices | Launch / Growth / Scale `pri_01kxtn6…` in `LOCKED.json` |
| Client token fallback | `live_a4f8ad8f1c8be908ec3784e8d8b` |
| Fulfill key (`/portal/provision`) | `BW_PADDLE_FULFILL_KEY` in `pipe/wrangler.jsonc` |
| HubSpot `bw_source` for Paddle | `portail` (enum — never send `paddle`) |
| Checkout route | `/payer` via `paddlePlanUrl` |
| Webhook destination | `https://api.blackwayconnect.com/webhooks/paddle` — Paddle "BlackWay pipe direct" (`ntfset_01m3nrs0n7vqyamecfsjx83jcd`) |
| Payment record | D1 `bw-master` (`payments`, `customers`) — HubSpot is an optional mirror (`HUBSPOT_SYNC=on`) |
| Pipe secrets | `PADDLE_API_KEY` (Transactions + Customers **read**), `PADDLE_WEBHOOK_SECRET` — owner card `~/.blackway/cles-blackway.env` → `npm run cles` |

## Chain (live, verified 2026-09-29)

1. Client pays on `/payer` → money lands in the Paddle seller account.
2. Paddle → `POST /webhooks/paddle` (HMAC `Paddle-Signature`) → payment + customer in D1 (idempotent on `txn_…`).
3. Portal `/portail?txn=…` claim: KV/cache → D1 → **Paddle API verify** (pull fallback if the webhook is late).
4. `subscription.canceled` / `paused` → access cut; `past_due` keeps access; replays never revive a customer.

The old Vorixa relay destination (`vorixa.ca/api/functions/blackwayPaddleWebhook`) is **deactivated** — do not re-enable it.

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
- Let the pipe `PADDLE_API_KEY` expire (current key expires 2026-12-28 — replace it before, via the owner card)
- Treat client-side `/payer` success redirect as payment proof (webhook only)
