# BlackWay domains → Paddle

## LOCK — domaine canonique (owner)

| Domaine | Paddle | Rôle |
|---------|--------|------|
| `blackwayconnect.com` | **APPROUVÉ** | Canonical site + checkouts `/payer` |

- Canonical site : `https://blackwayconnect.com`
- `www.blackwayconnect.com` → 301 apex `.com`
- Checkouts : **`https://blackwayconnect.com/payer?plan=…`** (Paddle overlay)
- Ne plus router les CTAs vers `vorixa.ca/pricing`

## FORBIDDEN — `blackway.ca`

**Ne jamais** recréer attach / zone Cloudflare / docs NXDOMAIN pour `blackway.ca`.  
Détail : [`ops/BLACKWAY-CA-FORBIDDEN.md`](./BLACKWAY-CA-FORBIDDEN.md).

## Paths

| Path | Destination |
|------|-------------|
| `/payer` | Paddle Checkout overlay |
| `/paddle` `/acheter` `/checkout` `/encaisser` | aliases → forfaits / payer |
| `/portail` | Client Master Portal |
| `/diagnostic` | Twin Turbo Leak Score |

## Wrangler routes

Production `wrangler.jsonc` binds `blackwayconnect.com` only.

## Auto-fulfillment (2026-09-29)

Paddle live notification `BlackWay pipe direct` →
`POST https://api.blackwayconnect.com/webhooks/paddle` (signed with `PADDLE_WEBHOOK_SECRET`) →
payment + customer in D1 `bw-master`. The portal also verifies `txn_…` with the Paddle API if the webhook is late.

The old `BlackWayConnect pipe fulfillment (Vorixa relay)` destination is deactivated.
`POST /portal/provision` (`X-BW-Fulfill-Key`) stays available for manual/partner provisioning.

Money lands in the Paddle seller account on checkout (same live seller as Vorixa).
Forfait + portail activate on `transaction.completed` for Grow Hub price IDs.
