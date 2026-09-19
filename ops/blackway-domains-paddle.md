# BlackWay domains → Paddle

## Status

- `blackwayconnect.com` + `blackway.ca` : **approuvés Paddle** (owner, 19 sept. 2026)
- Canonical site : `https://blackwayconnect.com`
- `blackway.ca` / `www.blackway.ca` → **301** vers `blackwayconnect.com` (même path)
- Checkouts site : storefront Paddle `https://vorixa.ca/pricing` (catalogue Paddle live) jusqu’à catalogue Grow Hub dédié côté Paddle

## Cloudflare (blocker actif)

Zone `blackway.ca` a déjà les NS Cloudflare (`quincy` / `lana`) mais **apex/www sans records** → NXDOMAIN.

**Cause :** secret Actions `CLOUDFLARE_API_TOKEN` vide → `scripts/attach-blackway-ca.sh` abort.

**Fix :** voir [`ops/cloudflare-secrets-blocker.md`](./cloudflare-secrets-blocker.md)  
(Option A = set secrets + Run workflow Attach ; Option B = Dash manuel CNAME + 301).

## Paths Paddle sur .com

`/paddle` `/acheter` `/checkout` `/encaisser` → `https://vorixa.ca/pricing`

## Wrangler routes

Production `wrangler.jsonc` binds **only** `blackwayconnect.com` until `blackway.ca` is attached as a Worker custom domain.

Worker code still 301s `blackway.ca` → `.com` once DNS/custom domain points at `blackway-site`.
Use `scripts/attach-blackway-ca.sh` (needs `CLOUDFLARE_API_TOKEN`) then re-add zone routes if desired.
