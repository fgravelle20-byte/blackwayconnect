# BlackWay domains → Paddle

## LOCK — approbation Paddle (owner, 19 sept. 2026)

| Domaine | Paddle | Rôle |
|---------|--------|------|
| `blackwayconnect.com` | **APPROUVÉ** | Canonical site + checkouts |
| `blackway.ca` | **APPROUVÉ** | Même marque → 301 vers `.com` |

**Ne pas resoumettre** ces domaines chez Paddle. Approval = OK.  
(Approval Paddle ≠ DNS public : voir NXDOMAIN ci-dessous.)

- Canonical site : `https://blackwayconnect.com`
- `blackway.ca` / `www.blackway.ca` → **301** vers `blackwayconnect.com` (même path)
- Checkouts site : storefront Paddle `https://vorixa.ca/pricing` (catalogue Paddle live) jusqu’à catalogue Grow Hub dédié côté Paddle

## Cloudflare — `blackway.ca` (prochaine étape unique)

**2026-09-19 :** `dig blackway.ca` = **NXDOMAIN** (registre .ca).  
Voir [`ops/blackway-ca-nxdomain.md`](./blackway-ca-nxdomain.md) — restaurer le domaine **avant** tout Attach/DNS.

Secondaire : secret Actions `CLOUDFLARE_API_TOKEN` invalide → [`ops/cloudflare-secrets-blocker.md`](./cloudflare-secrets-blocker.md).

## Paths Paddle sur .com

`/paddle` `/acheter` `/checkout` `/encaisser` → `https://vorixa.ca/pricing`

## Wrangler routes

Production `wrangler.jsonc` binds **only** `blackwayconnect.com` until `blackway.ca` is attached as a Worker custom domain.

Worker code still 301s `blackway.ca` → `.com` once DNS/custom domain points at `blackway-site`.
Use `scripts/attach-blackway-ca.sh` (needs `CLOUDFLARE_API_TOKEN`) then re-add zone routes if desired.
