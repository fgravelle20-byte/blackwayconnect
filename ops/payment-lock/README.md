# Payment system LOCK (BlackWayConnect)

**Status: LOCKED.** Live Paddle pay → auto-forfait → money to seller Paddle account.

## What is locked

| Invariant | Value |
| --- | --- |
| Processor | `paddle` (no Stripe checkout anywhere) |
| Billing | Immediate on subscription for all 16 live prices |
| Legacy Stripe outbound | Disabled; Stripe webhook retained history-only |
| Prices | 16 live CAD monthly prices in `LOCKED.json` (see table below) |
| Client token fallback | `live_a4f8ad8f1c8be908ec3784e8d8b` |
| Fulfill key (`/portal/provision`) | `BW_PADDLE_FULFILL_KEY` in `pipe/wrangler.jsonc` |
| HubSpot `bw_source` for Paddle | `portail` (enum — never send `paddle`) |
| Checkout route | `/payer` via `paddlePlanUrl` |
| Webhook destination | `https://api.blackwayconnect.com/webhooks/paddle` — Paddle "BlackWay pipe direct" (`ntfset_01m3nrs0n7vqyamecfsjx83jcd`) |
| Payment record | D1 `bw-master` (`payments`, `customers`) — HubSpot is an optional mirror (`HUBSPOT_SYNC=on`) |
| Pipe secrets | `PADDLE_API_KEY` (Transactions + Customers **read**), `PADDLE_WEBHOOK_SECRET` — owner card `~/.blackway/cles-blackway.env` → `npm run cles` |

## Catalog (Paddle live, CAD / month)

Every row is sold on `/payer?plan=<key>`. The pipe maps the **paid price ID** to the forfait
(browser `custom_data` is ignored when the transaction has items) and stores it in its own
D1 column, so one customer can hold several lines at once. Canceling one line keeps the others.

| Line (D1 column) | Key | Price | Billing |
| --- | --- | --- | --- |
| Grow Hub (`forfait`) | `grow_hub_spark` | 99 $ | immediate |
| | `grow_hub_launch` | 149 $ | immediate |
| | `grow_hub_growth` | 349 $ | immediate |
| | `grow_hub_scale` | 699 $ | immediate |
| | `grow_hub_command` | 1 249 $ | immediate |
| | `grow_hub_partner` | 2 499 $ | immediate |
| Pack Cellulaire (`forfait_cellulaire`) | `cell_signal` / `cell_route` / `cell_fleet` / `cell_command` | 79 / 199 / 399 / 799 $ | immediate |
| Chatbot IA (`forfait_chatbot`) | `ia_chatbot_1` / `ia_chatbot_5` / `ia_chatbot_illimite` | 99 / 249 / 399 $ | immediate |
| Accueil vocal IA (`forfait_vocal`) | `ia_vocal_basic` / `ia_vocal_avance` / `ia_vocal_premium` | 149 / 299 / 499 $ | immediate |

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
- `src/cellulaireConfig.ts`
- `src/modulesIaConfig.ts`
- `src/pages/CheckoutPage.tsx`
- `src/stripeConfig.ts`
- `pipe/index.js`
- `pipe/customers.js`
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

- Swap processor back to Stripe for any forfait
- Reactivate or publish any legacy Stripe Payment Link / hosted checkout URL
- Trust `custom_data.bw_forfait` over the paid price ID (a 79 $ payment must never unlock Partner)
- Change price IDs without Paddle dashboard sync
- Send HubSpot `bw_source=paddle` (breaks provision — enum rejects it)
- Remove or rotate `BW_PADDLE_FULFILL_KEY` without Vorixa + pipe coordinated update
- Let the pipe `PADDLE_API_KEY` expire (current key expires 2026-12-28 — replace it before, via the owner card)
- Treat client-side `/payer` success redirect as payment proof (webhook only)
