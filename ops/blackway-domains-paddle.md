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
