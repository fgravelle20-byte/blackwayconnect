# BlackWay domains → Paddle

## Status

- `blackwayconnect.com` + `blackway.ca` : **approuvés Paddle** (owner, 19 sept. 2026)
- Canonical site : `https://blackwayconnect.com`
- `blackway.ca` / `www.blackway.ca` → **301** vers `blackwayconnect.com` (même path)
- Checkouts site : storefront Paddle `https://vorixa.ca/pricing` (catalogue Paddle live) jusqu’à catalogue Grow Hub dédié côté Paddle

## Cloudflare (à attacher si pas déjà fait)

Zone `blackway.ca` a déjà les NS Cloudflare. Attacher custom domains au Worker `blackway-site` :

1. Dash → Workers → `blackway-site` → Domains
2. Add `blackway.ca` + `www.blackway.ca`
3. Deploy cette branche

## Paths Paddle sur .com

`/paddle` `/acheter` `/checkout` `/encaisser` → `https://vorixa.ca/pricing`
